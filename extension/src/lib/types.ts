export type Tab = {
  id: string;
  title: string;
  url: string;
  addedAt: number;
};

export type Folder = {
  id: string;
  name: string;
  color?: string;
  tabs: Tab[];
  collapsed: boolean;
  order: number;
};

export type AppState = {
  favorites: Tab[];
  folders: Folder[];
  lastFolderId?: string;
};

export const EMPTY_STATE: AppState = {
  favorites: [],
  folders: [],
};

export const FAVORITES_LIMIT = 8;

export type RecentlyClosedTab = {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  closedAt: number;
};

export const RECENTLY_CLOSED_TTL_MS = 2 * 24 * 60 * 60 * 1000;
export const RECENTLY_CLOSED_LIMIT = 100;

export type Settings = {
  restoreSavedTabsOnStartup: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  restoreSavedTabsOnStartup: false,
};

export const FOLDER_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
];
