import {
  loadRecentlyClosed,
  loadState,
  saveRecentlyClosed,
} from '../lib/storage';
import { isSavable } from '../lib/tabs';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('sidePanel.setPanelBehavior failed:', err));

/* ----- Recently-closed tracking ------------------------------------- */

type CachedTab = { url: string; title: string; favIconUrl?: string };
const tabCache = new Map<number, CachedTab>();
const ignoredTabIds = new Map<number, number>(); // tabId -> expiresAt

function cacheTab(t: chrome.tabs.Tab) {
  if (t.id == null || !isSavable(t.url)) return;
  tabCache.set(t.id, {
    url: t.url!,
    title: (t.title ?? '').trim() || t.url!,
    favIconUrl: t.favIconUrl,
  });
}

// Hydrate cache for already-open tabs (covers SW restarts).
chrome.tabs.query({}).then((all) => {
  for (const t of all) cacheTab(t);
});

chrome.tabs.onCreated.addListener((t) => cacheTab(t));
chrome.tabs.onUpdated.addListener((_id, _info, t) => cacheTab(t));

chrome.tabs.onRemoved.addListener((tabId) => {
  const cached = tabCache.get(tabId);
  tabCache.delete(tabId);
  if (!cached) return;
  const ignoreUntil = ignoredTabIds.get(tabId);
  if (ignoreUntil != null) {
    ignoredTabIds.delete(tabId);
    if (ignoreUntil >= Date.now()) return;
  }
  recordClosedTab(cached).catch((err) =>
    console.error('recordClosedTab failed:', err),
  );
});

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
    const expiresAt = Date.now() + 5_000;
    for (const id of msg.tabIds) ignoredTabIds.set(id, expiresAt);
    sendResponse({ ok: true });
    return false;
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
  const now = Date.now();
  for (const [id, exp] of ignoredTabIds) {
    if (exp < now) ignoredTabIds.delete(id);
  }
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
