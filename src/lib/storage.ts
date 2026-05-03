import { AppState, EMPTY_STATE } from './types';

const KEY = 'tabManagerState';

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
