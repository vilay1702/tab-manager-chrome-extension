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
import { useRecentlyClosed } from './hooks/useRecentlyClosed';
import { useSettings } from './hooks/useSettings';
import { FavoritesRow } from './components/FavoritesRow';
import { LiveTabsList } from './components/LiveTabsList';
import { FoldersSection } from './components/FoldersSection';
import { BottomBar } from './components/BottomBar';
import { DragPreview } from './components/DragPreview';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PromptDialog } from './components/PromptDialog';
import { addFolder, applyAutoOrganize } from './state/actions';
import { FOLDER_COLORS } from '../lib/types';
import { archiveAllTabs } from './lib/liveActions';
import { DragInfo, parseDrag } from './lib/dnd';
import { organizeTabs } from './lib/autoOrganize';
import {
  OpCtx,
  activateLiveTab,
  favoriteCurrentTab,
  ignoreNextClose,
  moveFavoriteToFolder,
  moveFavoriteToLive,
  moveLiveToFavorites,
  moveLiveToFolder,
  moveSavedBetweenFolders,
  moveSavedToFavorites,
  moveSavedToLive,
  reorderFavorite,
  reorderLiveTab,
  reorderSavedTab,
} from './operations';

export function App() {
  const { state, loaded, update } = useStore();
  const { tabs, activeTabId, windowId } = useLiveTabs();
  const recentlyClosed = useRecentlyClosed();
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string>('');
  const [activeDrag, setActiveDrag] = useState<DragInfo | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const ctx: OpCtx = { state, tabs, update, notify: setToast };

  /* ----- Folder / favorite top-level actions ----- */

  const onNewFolder = useCallback(() => setNewFolderOpen(true), []);
  const confirmNewFolder = (name: string) => {
    const color = FOLDER_COLORS[state.folders.length % FOLDER_COLORS.length];
    update(addFolder(name, color));
    setNewFolderOpen(false);
  };

  const onArchiveAll = useCallback(() => {
    if (windowId == null) return;
    setArchiveOpen(true);
  }, [windowId]);
  const confirmArchive = () => {
    if (windowId != null) archiveAllTabs(windowId);
    setArchiveOpen(false);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const alreadyFavorite =
    !!activeTab && state.favorites.some((f) => f.url === activeTab.url);

  const onFavoriteCurrent = useCallback(
    () => favoriteCurrentTab(ctx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabs, state.favorites, update],
  );

  /* ----- Auto-organize ----- */

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

    // Close live tabs whose URLs got saved. Re-query to avoid stale IDs.
    const savedUrls = new Set<string>();
    for (const g of groups) for (const t of g.tabs) savedUrls.add(t.url);
    let tabIdsToClose: number[] = [];
    try {
      const fresh =
        windowId != null
          ? await chrome.tabs.query({ windowId })
          : await chrome.tabs.query({ currentWindow: true });
      tabIdsToClose = fresh
        .filter((t) => t.id != null && !t.pinned && t.url && savedUrls.has(t.url))
        .map((t) => t.id!);
    } catch {
      /* ignore */
    }
    if (tabIdsToClose.length > 0) await ignoreNextClose(tabIdsToClose);
    for (const id of tabIdsToClose) {
      try {
        await chrome.tabs.remove(id);
      } catch {
        /* tab already gone */
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
  }, [tabs, update, windowId]);

  /* ----- Keyboard ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewFolder();
      }
      if (meta && e.key.toLowerCase() === 'd' && !alreadyFavorite) {
        e.preventDefault();
        onFavoriteCurrent();
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
  }, [onNewFolder, onFavoriteCurrent, alreadyFavorite]);

  /* ----- Drag and drop ----- */

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

    // Drag-to-self: a deliberate gesture on a live tab still activates it.
    if (e.active.id === e.over?.id) {
      if (a.kind === 'live') await activateLiveTab(tabs, a.tabId);
      return;
    }

    const searching = query.trim().length > 0;

    // Reorder is ambiguous while filtered — block within-section reorders.
    if (a.kind === 'live' && o.kind === 'live') {
      if (!searching) await reorderLiveTab(tabs, a.tabId, o.tabId);
      return;
    }
    if (a.kind === 'fav' && o.kind === 'fav') {
      reorderFavorite(ctx, a.id, o.id);
      return;
    }
    if (a.kind === 'saved' && o.kind === 'saved' && a.folderId === o.folderId) {
      if (!searching) reorderSavedTab(ctx, a.folderId, a.id, o.id);
      return;
    }

    // Cross-section moves.
    if (a.kind === 'live' && (o.kind === 'fav' || o.kind === 'dz-fav')) {
      await moveLiveToFavorites(ctx, a.tabId);
      return;
    }
    if (a.kind === 'live' && (o.kind === 'dz-folder' || o.kind === 'saved')) {
      await moveLiveToFolder(ctx, a.tabId, o.folderId);
      return;
    }
    if (a.kind === 'saved' && (o.kind === 'saved' || o.kind === 'dz-folder')) {
      moveSavedBetweenFolders(ctx, a.folderId, o.folderId, a.id);
      return;
    }
    if (a.kind === 'saved' && (o.kind === 'fav' || o.kind === 'dz-fav')) {
      moveSavedToFavorites(ctx, a.folderId, a.id);
      return;
    }
    if (a.kind === 'fav' && (o.kind === 'dz-folder' || o.kind === 'saved')) {
      moveFavoriteToFolder(ctx, a.id, o.folderId);
      return;
    }
    if (a.kind === 'saved' && (o.kind === 'live' || o.kind === 'dz-live')) {
      await moveSavedToLive(ctx, a.folderId, a.id);
      return;
    }
    if (a.kind === 'fav' && (o.kind === 'live' || o.kind === 'dz-live')) {
      await moveFavoriteToLive(ctx, a.id);
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
          recentlyClosed={recentlyClosed}
          notify={setToast}
          onArchiveAll={onArchiveAll}
          settings={settings}
          onSettingsChange={updateSettings}
        />
        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={() => setToast('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message={toast}
          sx={{ '& .MuiSnackbarContent-root': { fontSize: 12 } }}
        />
        <PromptDialog
          open={newFolderOpen}
          title="New folder"
          label="Folder name"
          initialValue="New folder"
          confirmLabel="Create"
          onConfirm={confirmNewFolder}
          onCancel={() => setNewFolderOpen(false)}
        />
        <ConfirmDialog
          open={archiveOpen}
          title="Close all tabs?"
          message={`Close ${tabs.filter((t) => !t.pinned).length} tab(s) in this window. Pinned tabs stay open.`}
          confirmLabel="Close all"
          destructive
          onConfirm={confirmArchive}
          onCancel={() => setArchiveOpen(false)}
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
