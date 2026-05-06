import { Tab } from './types';

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  try {
    const win = await chrome.windows.getCurrent();
    const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
    return tab;
  } catch {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tab;
  }
}

export async function getCurrentWindowTabs(): Promise<chrome.tabs.Tab[]> {
  try {
    const win = await chrome.windows.getCurrent();
    return chrome.tabs.query({ windowId: win.id });
  } catch {
    return chrome.tabs.query({ lastFocusedWindow: true });
  }
}

export function isSavable(url: string | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export function tabFromChromeTab(t: chrome.tabs.Tab): Tab | null {
  if (!isSavable(t.url)) return null;
  return {
    id: crypto.randomUUID(),
    title: (t.title ?? '').trim() || t.url!,
    url: t.url!,
    addedAt: Date.now(),
  };
}

export async function openOrActivate(
  url: string,
  forceNewTab = false,
): Promise<void> {
  if (forceNewTab) {
    await chrome.tabs.create({ url, active: true });
    return;
  }
  // Activate any existing live tab with this URL — no new tab created.
  const matches = await chrome.tabs.query({ url });
  const existing = matches[0];
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    return;
  }
  // No live tab has this URL. Reuse the current tab only if it's a
  // throwaway page (NTP, about:blank, chrome://newtab, etc.) — never
  // overwrite a real page the user is reading.
  const current = await getCurrentTab();
  if (current?.id != null && !isSavable(current.url)) {
    await chrome.tabs.update(current.id, { url, active: true });
    if (current.windowId != null) {
      await chrome.windows.update(current.windowId, { focused: true });
    }
    return;
  }
  await chrome.tabs.create({ url, active: true });
}

export function faviconUrl(pageUrl: string, size = 32): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.toString();
}
