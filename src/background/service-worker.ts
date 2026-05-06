import {
  loadRecentlyClosed,
  loadSettings,
  loadState,
  saveRecentlyClosed,
} from '../lib/storage';
import { isSavable } from '../lib/tabs';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('sidePanel.setPanelBehavior failed:', err));

/* ----- Recently-closed tracking ------------------------------------- */

type CachedTab = { url: string; title: string; favIconUrl?: string };
const TAB_CACHE_KEY = 'tabSnapshot';
const IGNORE_KEY = 'tabIgnoreUntil';

// session storage survives SW sleep/wake within a browser session, so we
// never lose URL info for the first close after the SW spins back up.
async function readSnapshot(): Promise<Record<string, CachedTab>> {
  const r = await chrome.storage.session.get(TAB_CACHE_KEY);
  return (r[TAB_CACHE_KEY] as Record<string, CachedTab> | undefined) ?? {};
}

async function writeSnapshot(snap: Record<string, CachedTab>): Promise<void> {
  await chrome.storage.session.set({ [TAB_CACHE_KEY]: snap });
}

async function readIgnore(): Promise<Record<string, number>> {
  const r = await chrome.storage.session.get(IGNORE_KEY);
  return (r[IGNORE_KEY] as Record<string, number> | undefined) ?? {};
}

async function writeIgnore(map: Record<string, number>): Promise<void> {
  await chrome.storage.session.set({ [IGNORE_KEY]: map });
}

async function cacheTab(t: chrome.tabs.Tab) {
  if (t.id == null || !isSavable(t.url)) return;
  const snap = await readSnapshot();
  snap[String(t.id)] = {
    url: t.url!,
    title: (t.title ?? '').trim() || t.url!,
    favIconUrl: t.favIconUrl,
  };
  await writeSnapshot(snap);
}

// Hydrate snapshot for already-open tabs on SW startup.
chrome.tabs.query({}).then(async (all) => {
  const snap = await readSnapshot();
  for (const t of all) {
    if (t.id == null || !isSavable(t.url)) continue;
    snap[String(t.id)] = {
      url: t.url!,
      title: (t.title ?? '').trim() || t.url!,
      favIconUrl: t.favIconUrl,
    };
  }
  await writeSnapshot(snap);
});

chrome.tabs.onCreated.addListener((t) => {
  cacheTab(t).catch(() => {});
});
chrome.tabs.onUpdated.addListener((_id, _info, t) => {
  cacheTab(t).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  handleRemoved(tabId).catch((err) =>
    console.error('handleRemoved failed:', err),
  );
});

async function handleRemoved(tabId: number) {
  const key = String(tabId);
  const snap = await readSnapshot();
  const cached = snap[key];
  if (cached) {
    delete snap[key];
    await writeSnapshot(snap);
  }
  if (!cached) return;

  const ignoreMap = await readIgnore();
  const ignoreUntil = ignoreMap[key];
  if (ignoreUntil != null) {
    delete ignoreMap[key];
    await writeIgnore(ignoreMap);
    if (ignoreUntil >= Date.now()) return;
  }
  await recordClosedTab(cached);
}

async function recordClosedTab(t: CachedTab) {
  const list = await loadRecentlyClosed();
  // Drop earlier entries with the same URL — keep the most recent close.
  const filtered = list.filter((e) => e.url !== t.url);
  filtered.unshift({
    id: crypto.randomUUID(),
    url: t.url,
    title: t.title,
    favIconUrl: t.favIconUrl,
    closedAt: Date.now(),
  });
  await saveRecentlyClosed(filtered);
}

/* ----- Messages from the side panel --------------------------------- */

type Message =
  | { kind: 'ignoreClose'; tabIds: number[] }
  | { kind: 'removeClosed'; ids: string[] }
  | { kind: 'clearClosed' };

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  if (msg?.kind === 'ignoreClose') {
    (async () => {
      const ignoreMap = await readIgnore();
      const expiresAt = Date.now() + 5_000;
      for (const id of msg.tabIds) ignoreMap[String(id)] = expiresAt;
      await writeIgnore(ignoreMap);
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (msg?.kind === 'removeClosed') {
    (async () => {
      const list = await loadRecentlyClosed();
      const drop = new Set(msg.ids);
      await saveRecentlyClosed(list.filter((e) => !drop.has(e.id)));
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (msg?.kind === 'clearClosed') {
    saveRecentlyClosed([]).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

// Hourly prune of expired closed-tab entries and stale ignore IDs.
chrome.alarms.create('recently-closed-prune', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'recently-closed-prune') return;
  const list = await loadRecentlyClosed();
  await saveRecentlyClosed(list); // saveRecentlyClosed re-prunes
  const ignoreMap = await readIgnore();
  const now = Date.now();
  let dirty = false;
  for (const [id, exp] of Object.entries(ignoreMap)) {
    if (exp < now) {
      delete ignoreMap[id];
      dirty = true;
    }
  }
  if (dirty) await writeIgnore(ignoreMap);
});

/**
 * On Chrome cold-start, open every saved tab (folders + favorites) as a
 * background tab in the current window. Skips URLs that are already open
 * (so Chrome's session-restore doesn't produce duplicates).
 */
chrome.runtime.onStartup.addListener(() => {
  restoreSavedTabs().catch((err) =>
    console.error('startup tab restore failed:', err),
  );
});

async function restoreSavedTabs() {
  const settings = await loadSettings();
  if (!settings.restoreSavedTabsOnStartup) return;

  // Give Chrome ~800 ms to finish restoring the previous session, so we
  // can dedupe accurately.
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  const state = await loadState();
  const urlsToOpen: string[] = [];
  const seen = new Set<string>();
  for (const f of state.favorites) {
    if (!seen.has(f.url)) {
      seen.add(f.url);
      urlsToOpen.push(f.url);
    }
  }
  for (const folder of state.folders) {
    for (const t of folder.tabs) {
      if (!seen.has(t.url)) {
        seen.add(t.url);
        urlsToOpen.push(t.url);
      }
    }
  }
  if (urlsToOpen.length === 0) return;

  const existing = await chrome.tabs.query({});
  const existingUrls = new Set<string>();
  for (const t of existing) {
    if (t.url) existingUrls.add(t.url);
  }

  for (const url of urlsToOpen) {
    if (existingUrls.has(url)) continue;
    try {
      await chrome.tabs.create({ url, active: false });
    } catch {
      /* invalid URL or window unavailable — skip */
    }
  }
}
