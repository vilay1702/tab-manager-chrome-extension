export type DragInfo =
  | { kind: 'live'; tabId: number }
  | { kind: 'fav'; id: string }
  | { kind: 'saved'; folderId: string; id: string }
  | { kind: 'dz-fav' }
  | { kind: 'dz-folder'; folderId: string }
  | { kind: 'dz-live' };

export const liveId = (tabId: number) => `live:${tabId}`;
export const favId = (id: string) => `fav:${id}`;
export const savedId = (folderId: string, id: string) =>
  `saved:${folderId}:${id}`;
export const dzFav = 'dz:favorites';
export const dzFolder = (folderId: string) => `dz:folder:${folderId}`;
export const dzLive = 'dz:live';

export function parseDrag(
  id: string | number | null | undefined,
): DragInfo | null {
  if (typeof id !== 'string') return null;
  if (id.startsWith('live:')) {
    const tabId = Number(id.slice(5));
    return Number.isFinite(tabId) ? { kind: 'live', tabId } : null;
  }
  if (id.startsWith('fav:')) return { kind: 'fav', id: id.slice(4) };
  if (id.startsWith('saved:')) {
    const rest = id.slice(6);
    const colon = rest.indexOf(':');
    if (colon < 0) return null;
    return {
      kind: 'saved',
      folderId: rest.slice(0, colon),
      id: rest.slice(colon + 1),
    };
  }
  if (id === 'dz:favorites') return { kind: 'dz-fav' };
  if (id === 'dz:live') return { kind: 'dz-live' };
  if (id.startsWith('dz:folder:'))
    return { kind: 'dz-folder', folderId: id.slice(10) };
  return null;
}
