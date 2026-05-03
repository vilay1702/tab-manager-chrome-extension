import { useCallback, useEffect, useState } from 'react';
import { Box, InputAdornment, Snackbar, Stack, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useStore } from './hooks/useStore';
import { useLiveTabs } from './hooks/useLiveTabs';
import { FavoritesRow } from './components/FavoritesRow';
import { LiveTabsList } from './components/LiveTabsList';
import { FoldersSection } from './components/FoldersSection';
import { BottomBar } from './components/BottomBar';
import { DragPreview } from './components/DragPreview';
import {
  addFavorite,
  addFolder,
  addTabToFolder,
  applyAutoOrganize,
  moveTab,
  removeFavorite,
  removeTabFromFolder,
  reorderFavorites,
  reorderTabsInFolder,
} from './state/actions';
import { FAVORITES_LIMIT, FOLDER_COLORS } from '../lib/types';
import { getCurrentTab, isSavable, tabFromChromeTab } from '../lib/tabs';
import { DragInfo, parseDrag } from './lib/dnd';
import { organizeTabs } from './lib/autoOrganize';

export function App() {
  const { state, loaded, update } = useStore();
  const { tabs, activeTabId, windowId } = useLiveTabs();
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string>('');
  const [activeDrag, setActiveDrag] = useState<DragInfo | null>(null);

  const onNewFolder = useCallback(() => {
    const name = prompt('Folder name', 'New folder');
    if (name === null) return;
    const color = FOLDER_COLORS[state.folders.length % FOLDER_COLORS.length];
    update(addFolder(name, color));
  }, [state.folders.length, update]);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const alreadyFavorite =
    !!activeTab && state.favorites.some((f) => f.url === activeTab.url);

  const addCurrentToFavorites = useCallback(async () => {
    const t = activeTab ?? (await getCurrentTab());
    if (!t) return;
    if (!isSavable(t.url)) return;
    const tab = tabFromChromeTab(t);
    if (!tab) return;
    if (state.favorites.length >= FAVORITES_LIMIT) {
      setToast('Favorites are full (max 8).');
      return;
    }
    if (state.favorites.some((f) => f.url === tab.url)) return;
    update(addFavorite(tab));
    if (t.id != null) {
      try {
        await chrome.tabs.remove(t.id);
      } catch {
        /* tab already gone */
      }
    }
  }, [activeTab, update, state.favorites]);

  const onAutoOrganize = useCallback(async () => {
    const { groups, ungrouped, totalConsidered } = organizeTabs(tabs);
    if (groups.length === 0) {
      setToast(
        totalConsidered === 0
          ? 'No savable tabs to organize.'
          : 'No groups of 2+ similar tabs found.',
      );
      return;
    }
    let result = { foldersCreated: 0, foldersUpdated: 0, tabsAdded: 0 };
    update((s) => {
      const r = applyAutoOrganize(s, groups);
      result = r.result;
      return r.state;
    });

    // Move semantics: close live tabs whose URLs got saved.
    const savedUrls = new Set<string>();
    for (const g of groups) for (const t of g.tabs) savedUrls.add(t.url);
    const tabIdsToClose = tabs
      .filter((t) => t.id != null && !t.pinned && t.url && savedUrls.has(t.url))
      .map((t) => t.id!);
    if (tabIdsToClose.length > 0) {
      try {
        await chrome.tabs.remove(tabIdsToClose);
      } catch {
        /* ignore */
      }
    }

    const parts: string[] = [];
    if (result.foldersCreated)
      parts.push(`${result.foldersCreated} new folder${result.foldersCreated > 1 ? 's' : ''}`);
    if (result.foldersUpdated)
      parts.push(`${result.foldersUpdated} updated`);
    if (result.tabsAdded === 0 && tabIdsToClose.length === 0) {
      setToast('Already organized — nothing new to save.');
    } else {
      const closed =
        tabIdsToClose.length > 0
          ? ` Closed ${tabIdsToClose.length} live tab${tabIdsToClose.length > 1 ? 's' : ''}.`
          : '';
      setToast(
        `Moved ${result.tabsAdded} tab${result.tabsAdded > 1 ? 's' : ''} into ${parts.join(', ')}.${closed}` +
          (ungrouped ? ` ${ungrouped} singleton${ungrouped > 1 ? 's' : ''} skipped.` : ''),
      );
    }
  }, [tabs, update]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewFolder();
      }
      if (meta && e.key.toLowerCase() === 'd' && !alreadyFavorite) {
        e.preventDefault();
        addCurrentToFavorites();
      }
      if (e.key === '/' && !isTyping(e.target)) {
        e.preventDefault();
        const input = document.getElementById('tm-search') as HTMLInputElement | null;
        input?.focus();
      }
      if (e.key === 'Escape') setQuery('');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNewFolder, addCurrentToFavorites, alreadyFavorite]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveDrag(parseDrag(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDrag(null);

    const a = parseDrag(e.active.id);
    const o = parseDrag(e.over?.id);
    if (!a || !o) return;
    if (e.active.id === e.over?.id) return;

    const searching = query.trim().length > 0;

    // ---- live → live: reorder browser tabs + activate dragged tab -----
    if (a.kind === 'live' && o.kind === 'live') {
      if (searching) return; // ambiguous indices while filtered
      const from = tabs.find((t) => t.id === a.tabId);
      const to = tabs.find((t) => t.id === o.tabId);
      if (!from || !to || to.index == null) return;
      if (from.pinned !== to.pinned) return;
      try {
        await chrome.tabs.move(a.tabId, { index: to.index });
        await chrome.tabs.update(a.tabId, { active: true });
        if (from.windowId != null) {
          await chrome.windows.update(from.windowId, { focused: true });
        }
      } catch {
        /* ignore */
      }
      return;
    }

    // ---- live → favorite: save + close the browser tab -----------------
    if (a.kind === 'live' && (o.kind === 'fav' || o.kind === 'dz-fav')) {
      const live = tabs.find((t) => t.id === a.tabId);
      if (!live) return;
      const tab = tabFromChromeTab(live);
      if (!tab) return;
      const alreadyFav = state.favorites.some((f) => f.url === tab.url);
      if (!alreadyFav && state.favorites.length >= FAVORITES_LIMIT) {
        setToast('Favorites are full (max 8).');
        return;
      }
      if (!alreadyFav) update(addFavorite(tab));
      try {
        await chrome.tabs.remove(a.tabId);
      } catch {
        /* tab already gone */
      }
      return;
    }

    // ---- live → folder: save + close the browser tab -------------------
    if (a.kind === 'live' && (o.kind === 'dz-folder' || o.kind === 'saved')) {
      const live = tabs.find((t) => t.id === a.tabId);
      if (!live) return;
      const tab = tabFromChromeTab(live);
      if (!tab) return;
      const target = state.folders.find((f) => f.id === o.folderId);
      if (!target) {
        setToast('Folder no longer exists.');
        return;
      }
      const alreadyInFolder = target.tabs.some((t) => t.url === tab.url);
      if (!alreadyInFolder) update(addTabToFolder(o.folderId, tab));
      try {
        await chrome.tabs.remove(a.tabId);
      } catch {
        /* tab already gone */
      }
      return;
    }

    // ---- favorite → favorite: reorder ----------------------------------
    if (a.kind === 'fav' && o.kind === 'fav') {
      const ids = state.favorites.map((f) => f.id);
      const from = ids.indexOf(a.id);
      const to = ids.indexOf(o.id);
      if (from < 0 || to < 0 || from === to) return;
      update(reorderFavorites(from, to));
      return;
    }

    // ---- saved → saved: reorder within folder, or move between ---------
    if (a.kind === 'saved' && o.kind === 'saved') {
      if (a.folderId === o.folderId) {
        if (searching) return; // ambiguous indices while filtered
        const folder = state.folders.find((f) => f.id === a.folderId);
        if (!folder) return;
        const ids = folder.tabs.map((t) => t.id);
        const from = ids.indexOf(a.id);
        const to = ids.indexOf(o.id);
        if (from < 0 || to < 0 || from === to) return;
        update(reorderTabsInFolder(a.folderId, from, to));
      } else {
        const target = state.folders.find((f) => f.id === o.folderId);
        if (!target) {
          setToast('Folder no longer exists.');
          return;
        }
        update(moveTab(a.folderId, o.folderId, a.id));
      }
      return;
    }

    // ---- saved → folder header: move -----------------------------------
    if (a.kind === 'saved' && o.kind === 'dz-folder') {
      if (a.folderId === o.folderId) return;
      const target = state.folders.find((f) => f.id === o.folderId);
      if (!target) {
        setToast('Folder no longer exists.');
        return;
      }
      update(moveTab(a.folderId, o.folderId, a.id));
      return;
    }

    // ---- saved → favorite: move (remove from folder, add favorite) ----
    if (a.kind === 'saved' && (o.kind === 'fav' || o.kind === 'dz-fav')) {
      const folder = state.folders.find((f) => f.id === a.folderId);
      const tab = folder?.tabs.find((t) => t.id === a.id);
      if (!tab) return;
      const alreadyFav = state.favorites.some((f) => f.url === tab.url);
      if (alreadyFav) {
        // URL already in favorites — just take it out of the folder.
        update(removeTabFromFolder(a.folderId, a.id));
        return;
      }
      if (state.favorites.length >= FAVORITES_LIMIT) {
        setToast('Favorites are full (max 8).');
        return;
      }
      const captured = tab;
      update((s) => {
        const removed = removeTabFromFolder(a.folderId, a.id)(s);
        return addFavorite({ ...captured, id: crypto.randomUUID() })(removed);
      });
      return;
    }

    // ---- favorite → folder: move (remove fav, add to folder) -----------
    if (a.kind === 'fav' && (o.kind === 'dz-folder' || o.kind === 'saved')) {
      const fav = state.favorites.find((f) => f.id === a.id);
      if (!fav) return;
      const target = state.folders.find((f) => f.id === o.folderId);
      if (!target) {
        setToast('Folder no longer exists.');
        return;
      }
      if (target.tabs.some((t) => t.url === fav.url)) {
        // URL already in folder — just remove from favorites.
        update(removeFavorite(a.id));
        return;
      }
      const captured = fav;
      update((s) => {
        const removed = removeFavorite(a.id)(s);
        return addTabToFolder(o.folderId, { ...captured, id: crypto.randomUUID() })(
          removed,
        );
      });
      return;
    }

    // ---- saved → live: open as active tab + remove from folder --------
    if (a.kind === 'saved' && (o.kind === 'live' || o.kind === 'dz-live')) {
      const folder = state.folders.find((f) => f.id === a.folderId);
      const tab = folder?.tabs.find((t) => t.id === a.id);
      if (!tab) return;
      try {
        const created = await chrome.tabs.create({ url: tab.url, active: true });
        if (created.windowId != null) {
          await chrome.windows.update(created.windowId, { focused: true });
        }
        // Only remove from folder if the open succeeded.
        update(removeTabFromFolder(a.folderId, a.id));
      } catch {
        setToast('Could not open this tab.');
      }
      return;
    }

    // ---- favorite → live: open as active tab + remove from favorites ---
    if (a.kind === 'fav' && (o.kind === 'live' || o.kind === 'dz-live')) {
      const fav = state.favorites.find((f) => f.id === a.id);
      if (!fav) return;
      try {
        const created = await chrome.tabs.create({ url: fav.url, active: true });
        if (created.windowId != null) {
          await chrome.windows.update(created.windowId, { focused: true });
        }
        update(removeFavorite(a.id));
      } catch {
        setToast('Could not open this tab.');
      }
      return;
    }
  };

  if (!loaded) {
    return <Box sx={{ height: '100%', bgcolor: 'background.default' }} aria-hidden />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: '1fr auto',
          height: '100%',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Box sx={{ overflowY: 'auto', px: 1, pt: 1, pb: 0.5 }}>
          <Stack spacing={1.25}>
            <TextField
              id="tm-search"
              placeholder="Search tabs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              fullWidth
              hiddenLabel
              slotProps={{
                input: {
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 999,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                    '& input': { py: 1, fontSize: 13 },
                  },
                },
              }}
            />
            <FavoritesRow
              favorites={state.favorites}
              update={update}
              activeUrl={activeTab?.url}
            />
            <FoldersSection
              state={state}
              query={query}
              update={update}
              onNewFolder={onNewFolder}
              activeUrl={activeTab?.url}
            />
            <LiveTabsList tabs={tabs} activeTabId={activeTabId} query={query} />
          </Stack>
        </Box>
        <BottomBar
          windowId={windowId}
          tabCount={tabs.filter((t) => !t.pinned).length}
          onNewFolder={onNewFolder}
          onAutoOrganize={onAutoOrganize}
          canAutoOrganize={tabs.length >= 2}
        />
        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={() => setToast('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message={toast}
          sx={{ '& .MuiSnackbarContent-root': { fontSize: 12 } }}
        />
      </Box>
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.3' } },
          }),
        }}
      >
        {activeDrag ? (
          <DragPreview info={activeDrag} state={state} liveTabs={tabs} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}
