/**
 * Tab operations — every cross-section move, open, and add lives here.
 *
 * Pure state updates (rename, reorder within a list, etc.) stay in
 * `state/actions.ts`. This module composes those updates with the chrome.tabs
 * side effects and adds validation + user feedback (toasts).
 *
 * Each operation:
 *  - Validates source + destination
 *  - Calls the right action(s) atomically through `update`
 *  - Performs any chrome.tabs.* side effect
 *  - Calls `notify` on user-visible failures
 */

import { AppState, FAVORITES_LIMIT, Tab } from '../lib/types';
import { tabFromChromeTab, getCurrentTab, openOrActivate } from '../lib/tabs';
import {
  addFavorite,
  addTabToFolder,
  moveTab,
  removeFavorite,
  removeTabFromFolder,
  reorderFavorites,
  reorderTabsInFolder,
} from './state/actions';
import { Updater } from './hooks/useStore';

export type OpCtx = {
  state: AppState;
  tabs: chrome.tabs.Tab[];
  update: (u: Updater) => void;
  notify: (msg: string) => void;
};

/* ------------------------------------------------------------------------ *
 * OPEN — saved or favorite                                                  *
 * ------------------------------------------------------------------------ */

/**
 * Click on a saved tab or favorite.
 *  - If a live tab already has this URL → activate it.
 *  - Otherwise → navigate the currently active tab in place.
 *  - forceNewTab=true (⌘-click / middle-click / "Open in new tab") always
 *    creates a fresh tab.
 *
 * The saved/favorite entry itself stays where it is.
 */
export async function openSavedUrl(
  url: string,
  forceNewTab: boolean,
): Promise<void> {
  await openOrActivate(url, forceNewTab);
}

/* ------------------------------------------------------------------------ *
 * ADD — live → favorites (⌘D / current-tab shortcut)                        *
 * ------------------------------------------------------------------------ */

/** Save the active live tab to favorites and close it. */
export async function favoriteCurrentTab(ctx: OpCtx): Promise<void> {
  const live = ctx.tabs.find((t) => t.active) ?? (await getCurrentTab());
  if (!live) return;
  const tab = tabFromChromeTab(live);
  if (!tab) return;
  if (ctx.state.favorites.some((f) => f.url === tab.url)) return;
  if (ctx.state.favorites.length >= FAVORITES_LIMIT) {
    ctx.notify('Favorites are full (max 8).');
    return;
  }
  ctx.update(addFavorite(tab));
  if (live.id != null) {
    await ignoreNextClose([live.id]);
    try {
      await chrome.tabs.remove(live.id);
    } catch {
      /* tab already gone */
    }
  }
}

/* ------------------------------------------------------------------------ *
 * MOVE — live → folder / favorites                                          *
 * ------------------------------------------------------------------------ */

/** Drag a live tab into a folder. Saves it; the live tab stays open. */
export async function moveLiveToFolder(
  ctx: OpCtx,
  liveTabId: number,
  folderId: string,
): Promise<void> {
  const live = ctx.tabs.find((t) => t.id === liveTabId);
  if (!live) return;
  const tab = tabFromChromeTab(live);
  if (!tab) return;
  const folder = ctx.state.folders.find((f) => f.id === folderId);
  if (!folder) {
    ctx.notify('Folder no longer exists.');
    return;
  }
  if (!folder.tabs.some((t) => t.url === tab.url)) {
    ctx.update(addTabToFolder(folderId, tab));
  }
}

/** Drag a live tab onto favorites. Saves it; the live tab stays open. */
export async function moveLiveToFavorites(
  ctx: OpCtx,
  liveTabId: number,
): Promise<void> {
  const live = ctx.tabs.find((t) => t.id === liveTabId);
  if (!live) return;
  const tab = tabFromChromeTab(live);
  if (!tab) return;
  const alreadyFav = ctx.state.favorites.some((f) => f.url === tab.url);
  if (alreadyFav) return;
  if (ctx.state.favorites.length >= FAVORITES_LIMIT) {
    ctx.notify('Favorites are full (max 8).');
    return;
  }
  ctx.update(addFavorite(tab));
}

/* ------------------------------------------------------------------------ *
 * MOVE — saved ↔ favorites                                                  *
 * ------------------------------------------------------------------------ */

/** Drag a saved tab onto favorites. Removes it from its folder. */
export function moveSavedToFavorites(
  ctx: OpCtx,
  fromFolderId: string,
  savedTabId: string,
): void {
  const folder = ctx.state.folders.find((f) => f.id === fromFolderId);
  const tab = folder?.tabs.find((t) => t.id === savedTabId);
  if (!tab) return;

  if (ctx.state.favorites.some((f) => f.url === tab.url)) {
    // URL already favorited — just remove the duplicate from the folder.
    ctx.update(removeTabFromFolder(fromFolderId, savedTabId));
    return;
  }
  if (ctx.state.favorites.length >= FAVORITES_LIMIT) {
    ctx.notify('Favorites are full (max 8).');
    return;
  }
  const captured: Tab = tab;
  ctx.update((s) => {
    const removed = removeTabFromFolder(fromFolderId, savedTabId)(s);
    return addFavorite({ ...captured, id: crypto.randomUUID() })(removed);
  });
}

/** Drag a favorite into a folder. Removes it from favorites. */
export function moveFavoriteToFolder(
  ctx: OpCtx,
  favoriteId: string,
  toFolderId: string,
): void {
  const fav = ctx.state.favorites.find((f) => f.id === favoriteId);
  if (!fav) return;
  const target = ctx.state.folders.find((f) => f.id === toFolderId);
  if (!target) {
    ctx.notify('Folder no longer exists.');
    return;
  }
  if (target.tabs.some((t) => t.url === fav.url)) {
    ctx.update(removeFavorite(favoriteId));
    return;
  }
  const captured: Tab = fav;
  ctx.update((s) => {
    const removed = removeFavorite(favoriteId)(s);
    return addTabToFolder(toFolderId, { ...captured, id: crypto.randomUUID() })(
      removed,
    );
  });
}

/* ------------------------------------------------------------------------ *
 * MOVE — between folders                                                    *
 * ------------------------------------------------------------------------ */

/** Drag a saved tab from one folder into another. */
export function moveSavedBetweenFolders(
  ctx: OpCtx,
  fromFolderId: string,
  toFolderId: string,
  savedTabId: string,
): void {
  if (fromFolderId === toFolderId) return;
  const target = ctx.state.folders.find((f) => f.id === toFolderId);
  if (!target) {
    ctx.notify('Folder no longer exists.');
    return;
  }
  ctx.update(moveTab(fromFolderId, toFolderId, savedTabId));
}

/* ------------------------------------------------------------------------ *
 * MOVE — saved/favorite → live (open + remove from source)                  *
 * ------------------------------------------------------------------------ */

/** Drag a saved tab into the Tabs section. Opens it and removes from folder. */
export async function moveSavedToLive(
  ctx: OpCtx,
  fromFolderId: string,
  savedTabId: string,
): Promise<void> {
  const folder = ctx.state.folders.find((f) => f.id === fromFolderId);
  const tab = folder?.tabs.find((t) => t.id === savedTabId);
  if (!tab) return;
  try {
    const created = await chrome.tabs.create({ url: tab.url, active: true });
    if (created.windowId != null) {
      await chrome.windows.update(created.windowId, { focused: true });
    }
    ctx.update(removeTabFromFolder(fromFolderId, savedTabId));
  } catch {
    ctx.notify('Could not open this tab.');
  }
}

/** Drag a favorite into the Tabs section. Opens it and removes from favorites. */
export async function moveFavoriteToLive(
  ctx: OpCtx,
  favoriteId: string,
): Promise<void> {
  const fav = ctx.state.favorites.find((f) => f.id === favoriteId);
  if (!fav) return;
  try {
    const created = await chrome.tabs.create({ url: fav.url, active: true });
    if (created.windowId != null) {
      await chrome.windows.update(created.windowId, { focused: true });
    }
    ctx.update(removeFavorite(favoriteId));
  } catch {
    ctx.notify('Could not open this tab.');
  }
}

/* ------------------------------------------------------------------------ *
 * REORDER                                                                   *
 * ------------------------------------------------------------------------ */

/** Drag-reorder a live browser tab. Activates the moved tab. */
export async function reorderLiveTab(
  tabs: chrome.tabs.Tab[],
  fromTabId: number,
  toTabId: number,
): Promise<void> {
  const from = tabs.find((t) => t.id === fromTabId);
  const to = tabs.find((t) => t.id === toTabId);
  if (!from || !to || to.index == null) return;
  if (from.pinned !== to.pinned) return;
  try {
    await chrome.tabs.move(fromTabId, { index: to.index });
    await chrome.tabs.update(fromTabId, { active: true });
    if (from.windowId != null) {
      await chrome.windows.update(from.windowId, { focused: true });
    }
  } catch {
    /* ignore */
  }
}

/** Drag-to-self on a live tab still activates it. */
export async function activateLiveTab(
  tabs: chrome.tabs.Tab[],
  tabId: number,
): Promise<void> {
  try {
    await chrome.tabs.update(tabId, { active: true });
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.windowId != null) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  } catch {
    /* ignore */
  }
}

/** Drag-reorder a favorite. */
export function reorderFavorite(
  ctx: OpCtx,
  fromFavoriteId: string,
  toFavoriteId: string,
): void {
  const ids = ctx.state.favorites.map((f) => f.id);
  const from = ids.indexOf(fromFavoriteId);
  const to = ids.indexOf(toFavoriteId);
  if (from < 0 || to < 0 || from === to) return;
  ctx.update(reorderFavorites(from, to));
}

/** Drag-reorder a saved tab inside its folder. */
export function reorderSavedTab(
  ctx: OpCtx,
  folderId: string,
  fromSavedId: string,
  toSavedId: string,
): void {
  const folder = ctx.state.folders.find((f) => f.id === folderId);
  if (!folder) return;
  const ids = folder.tabs.map((t) => t.id);
  const from = ids.indexOf(fromSavedId);
  const to = ids.indexOf(toSavedId);
  if (from < 0 || to < 0 || from === to) return;
  ctx.update(reorderTabsInFolder(folderId, from, to));
}

/* ------------------------------------------------------------------------ *
 * RECENTLY CLOSED                                                           *
 * ------------------------------------------------------------------------ */

/** Tell the SW to ignore the next close of these tab IDs (within ~5s). */
export async function ignoreNextClose(tabIds: number[]): Promise<void> {
  if (tabIds.length === 0) return;
  try {
    await chrome.runtime.sendMessage({ kind: 'ignoreClose', tabIds });
  } catch {
    /* SW unavailable — fall through; the tab close that follows may show up
       in recently-closed, which is mildly noisy but not a data risk. */
  }
}

/** Reopen a recently-closed entry and remove it from the list. */
export async function restoreClosedTab(
  url: string,
  entryId: string,
  notify: (msg: string) => void,
): Promise<void> {
  try {
    // If the URL is already open in some tab, activate it instead of
    // making a duplicate.
    const matches = await chrome.tabs.query({ url });
    const existing = matches[0];
    if (existing?.id != null) {
      await chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
    } else {
      const created = await chrome.tabs.create({ url, active: true });
      if (created.windowId != null) {
        await chrome.windows.update(created.windowId, { focused: true });
      }
    }
    await chrome.runtime.sendMessage({
      kind: 'removeClosed',
      ids: [entryId],
    });
  } catch {
    notify('Could not restore this tab.');
  }
}

/** Remove a single recently-closed entry without reopening it. */
export async function dismissClosedTab(entryId: string): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      kind: 'removeClosed',
      ids: [entryId],
    });
  } catch {
    /* ignore */
  }
}

/** Clear every recently-closed entry. */
export async function clearClosedTabs(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ kind: 'clearClosed' });
  } catch {
    /* ignore */
  }
}
