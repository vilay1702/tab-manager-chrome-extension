import {
  AppState,
  DEFAULT_SETTINGS,
  EMPTY_STATE,
  RECENTLY_CLOSED_LIMIT,
  RECENTLY_CLOSED_TTL_MS,
  RecentlyClosedTab,
  Settings,
} from './types';

const KEY = 'tabManagerState';
const RECENTLY_CLOSED_KEY = 'recentlyClosed';
const SETTINGS_KEY = 'tabManagerSettings';

export async function loadState(): Promise<AppState> {
  const result = await chrome.storage.local.get(KEY);
  const stored = result[KEY] as Partial<AppState> | undefined;
  return {
    favorites: stored?.favorites ?? [],
    folders: stored?.folders ?? [],
    lastFolderId: stored?.lastFolderId,
  } satisfies AppState;
}

export async function saveState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [KEY]: state });
}

export function subscribe(handler: (state: AppState) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === 'local' && changes[KEY]) {
      handler((changes[KEY].newValue as AppState | undefined) ?? EMPTY_STATE);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export async function loadRecentlyClosed(): Promise<RecentlyClosedTab[]> {
  const result = await chrome.storage.local.get(RECENTLY_CLOSED_KEY);
  const stored = result[RECENTLY_CLOSED_KEY] as RecentlyClosedTab[] | undefined;
  return prune(stored ?? []);
}

export async function saveRecentlyClosed(
  list: RecentlyClosedTab[],
): Promise<void> {
  await chrome.storage.local.set({ [RECENTLY_CLOSED_KEY]: prune(list) });
}

export function subscribeRecentlyClosed(
  handler: (list: RecentlyClosedTab[]) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === 'local' && changes[RECENTLY_CLOSED_KEY]) {
      const next = changes[RECENTLY_CLOSED_KEY].newValue as
        | RecentlyClosedTab[]
        | undefined;
      handler(prune(next ?? []));
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export function subscribeSettings(
  handler: (settings: Settings) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === 'local' && changes[SETTINGS_KEY]) {
      const next = changes[SETTINGS_KEY].newValue as
        | Partial<Settings>
        | undefined;
      handler({ ...DEFAULT_SETTINGS, ...(next ?? {}) });
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function prune(list: RecentlyClosedTab[]): RecentlyClosedTab[] {
  const cutoff = Date.now() - RECENTLY_CLOSED_TTL_MS;
  const fresh = list.filter((e) => e.closedAt >= cutoff);
  fresh.sort((a, b) => b.closedAt - a.closedAt);
  return fresh.slice(0, RECENTLY_CLOSED_LIMIT);
}
