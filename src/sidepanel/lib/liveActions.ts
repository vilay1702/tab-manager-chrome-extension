export async function activateTab(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  await chrome.tabs.update(tabId, { active: true });
  if (tab.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}

export async function closeTab(tabId: number) {
  await chrome.tabs.remove(tabId);
}

export async function moveTab(tabId: number, toIndex: number) {
  await chrome.tabs.move(tabId, { index: toIndex });
}

export async function newTab() {
  await chrome.tabs.create({ active: true });
}

export async function archiveAllTabs(windowId: number) {
  const tabs = await chrome.tabs.query({ windowId });
  const closable = tabs.filter((t) => !t.pinned && t.id != null).map((t) => t.id!);
  if (closable.length === 0) return;
  await chrome.tabs.remove(closable);
}

export function domainOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
