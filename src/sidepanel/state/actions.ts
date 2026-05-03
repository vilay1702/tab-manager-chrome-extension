import { AppState, FAVORITES_LIMIT, Folder, Tab } from '../../lib/types';
import { Updater } from '../hooks/useStore';
import type { OrganizedGroup } from '../lib/autoOrganize';

const without = <T extends { id: string }>(arr: T[], id: string) =>
  arr.filter((item) => item.id !== id);

// Removes any tab with the given URL from favorites and from every folder,
// optionally skipping a destination folder or favorites list. Used to
// enforce the invariant that a URL lives in at most one place.
const stripUrlFromState =
  (url: string, exceptFolderId?: string, exceptFavorites = false) =>
  (s: AppState): AppState => ({
    ...s,
    favorites: exceptFavorites ? s.favorites : s.favorites.filter((f) => f.url !== url),
    folders: s.folders.map((f) =>
      f.id === exceptFolderId
        ? f
        : { ...f, tabs: f.tabs.filter((t) => t.url !== url) },
    ),
  });

export const addFolder =
  (name: string, color?: string): Updater =>
  (s) => {
    const folder: Folder = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled',
      color,
      tabs: [],
      collapsed: false,
      order: s.folders.length,
    };
    return { ...s, folders: [...s.folders, folder], lastFolderId: folder.id };
  };

export const renameFolder =
  (id: string, name: string): Updater =>
  (s) => ({
    ...s,
    folders: s.folders.map((f) =>
      f.id === id ? { ...f, name: name.trim() || f.name } : f,
    ),
  });

export const deleteFolder =
  (id: string): Updater =>
  (s) => ({
    ...s,
    folders: without(s.folders, id),
    lastFolderId: s.lastFolderId === id ? undefined : s.lastFolderId,
  });

export const toggleCollapse =
  (id: string): Updater =>
  (s) => ({
    ...s,
    folders: s.folders.map((f) =>
      f.id === id ? { ...f, collapsed: !f.collapsed } : f,
    ),
  });

export const setFolderColor =
  (id: string, color: string): Updater =>
  (s) => ({
    ...s,
    folders: s.folders.map((f) => (f.id === id ? { ...f, color } : f)),
  });

export const addTabToFolder =
  (folderId: string, tab: Tab): Updater =>
  (s) => {
    const target = s.folders.find((f) => f.id === folderId);
    if (!target) return s;
    if (hasUrl(target.tabs, tab.url)) return s;
    // Move semantics: strip URL from favorites and any other folder first.
    const stripped = stripUrlFromState(tab.url, folderId, false)(s);
    return {
      ...stripped,
      folders: stripped.folders.map((f) =>
        f.id === folderId ? { ...f, tabs: [...f.tabs, tab] } : f,
      ),
      lastFolderId: folderId,
    };
  };

export const removeTabFromFolder =
  (folderId: string, tabId: string): Updater =>
  (s) => ({
    ...s,
    folders: s.folders.map((f) =>
      f.id === folderId ? { ...f, tabs: without(f.tabs, tabId) } : f,
    ),
  });

export const moveTab =
  (
    fromFolderId: string,
    toFolderId: string,
    tabId: string,
    toIndex?: number,
  ): Updater =>
  (s) => {
    if (fromFolderId === toFolderId) return s;
    const from = s.folders.find((f) => f.id === fromFolderId);
    const tab = from?.tabs.find((t) => t.id === tabId);
    if (!from || !tab) return s;
    // Move semantics: strip URL from favorites and any folder except destination.
    const stripped = stripUrlFromState(tab.url, toFolderId, false)(s);
    return {
      ...stripped,
      folders: stripped.folders.map((f) => {
        if (f.id === toFolderId) {
          const tabs = [...f.tabs];
          const index = toIndex ?? tabs.length;
          tabs.splice(index, 0, tab);
          return { ...f, tabs };
        }
        return f;
      }),
      lastFolderId: toFolderId,
    };
  };

export const reorderTabsInFolder =
  (folderId: string, fromIndex: number, toIndex: number): Updater =>
  (s) => ({
    ...s,
    folders: s.folders.map((f) => {
      if (f.id !== folderId) return f;
      const tabs = [...f.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      if (!moved) return f;
      tabs.splice(toIndex, 0, moved);
      return { ...f, tabs };
    }),
  });

export const addFavorite =
  (tab: Tab): Updater =>
  (s) => {
    if (hasUrl(s.favorites, tab.url)) return s;
    if (s.favorites.length >= FAVORITES_LIMIT) return s;
    // Move semantics: strip URL from any folder first.
    const stripped = stripUrlFromState(tab.url, undefined, true)(s);
    return { ...stripped, favorites: [...stripped.favorites, tab] };
  };

export const removeFavorite =
  (id: string): Updater =>
  (s) => ({ ...s, favorites: without(s.favorites, id) });

export const reorderFavorites =
  (fromIndex: number, toIndex: number): Updater =>
  (s) => {
    const favorites = [...s.favorites];
    const [moved] = favorites.splice(fromIndex, 1);
    if (!moved) return s;
    favorites.splice(toIndex, 0, moved);
    return { ...s, favorites };
  };

const hasUrl = (tabs: Tab[], url: string) =>
  tabs.some((t) => t.url === url);

export const folderHasUrl = (s: AppState, folderId: string, url: string) => {
  const folder = s.folders.find((f) => f.id === folderId);
  return folder ? hasUrl(folder.tabs, url) : false;
};

export const favoritesHasUrl = (s: AppState, url: string) =>
  hasUrl(s.favorites, url);

export type OrganizeResult = {
  foldersCreated: number;
  foldersUpdated: number;
  tabsAdded: number;
};

export function applyAutoOrganize(
  s: AppState,
  groups: OrganizedGroup[],
): { state: AppState; result: OrganizeResult } {
  let next = s;
  let foldersCreated = 0;
  let foldersUpdated = 0;
  let tabsAdded = 0;

  for (const g of groups) {
    let folder = next.folders.find(
      (f) => f.name.toLowerCase() === g.name.toLowerCase(),
    );
    let createdNow = false;
    if (!folder) {
      folder = {
        id: crypto.randomUUID(),
        name: g.name,
        color: g.color,
        tabs: [],
        collapsed: false,
        order: next.folders.length,
      };
      next = { ...next, folders: [...next.folders, folder] };
      createdNow = true;
    }

    const existingUrls = new Set(folder.tabs.map((t) => t.url));
    const tabsToAdd = g.tabs.filter((t) => !existingUrls.has(t.url));
    if (tabsToAdd.length === 0 && !createdNow) continue;

    if (createdNow) foldersCreated++;
    else foldersUpdated++;
    tabsAdded += tabsToAdd.length;

    const folderId = folder.id;
    next = {
      ...next,
      folders: next.folders.map((f) =>
        f.id === folderId ? { ...f, tabs: [...f.tabs, ...tabsToAdd] } : f,
      ),
    };
  }

  return { state: next, result: { foldersCreated, foldersUpdated, tabsAdded } };
}
