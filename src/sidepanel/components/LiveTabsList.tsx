import { useMemo } from 'react';
import { Box, Divider, List, Typography } from '@mui/material';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { LiveTab } from '../hooks/useLiveTabs';
import { LiveTabItem } from './LiveTabItem';
import { SectionHeader } from './SectionHeader';
import { dzLive, liveId } from '../lib/dnd';

type Props = {
  tabs: LiveTab[];
  activeTabId: number | undefined;
  query: string;
  trackedUrls: Set<string>;
};

export function LiveTabsList({ tabs, activeTabId, query, trackedUrls }: Props) {
  const q = query.trim().toLowerCase();

  // For each tracked URL, hide ONE matching live tab (preferring the active
  // one) so the folder/favorite entry "represents" it. Duplicates beyond
  // the first stay visible. Pinned tabs are never hidden.
  const untracked = useMemo(() => {
    const sorted = [...tabs].sort((a, b) => {
      const aActive = a.id === activeTabId ? 0 : 1;
      const bActive = b.id === activeTabId ? 0 : 1;
      return aActive - bActive;
    });
    const consumed = new Set<string>();
    const hideIds = new Set<number>();
    for (const t of sorted) {
      if (t.pinned || t.id == null || !t.url) continue;
      if (trackedUrls.has(t.url) && !consumed.has(t.url)) {
        consumed.add(t.url);
        hideIds.add(t.id);
      }
    }
    return tabs.filter((t) => t.id == null || !hideIds.has(t.id));
  }, [tabs, trackedUrls, activeTabId]);

  const filtered = q
    ? untracked.filter(
        (t) =>
          (t.title ?? '').toLowerCase().includes(q) ||
          (t.url ?? '').toLowerCase().includes(q),
      )
    : untracked;

  const pinned = filtered.filter((t) => t.pinned);
  const unpinned = filtered.filter((t) => !t.pinned);

  const { setNodeRef, isOver } = useDroppable({ id: dzLive });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        pb: 0.5,
        borderRadius: 1.5,
        outline: isOver ? '2px dashed' : '2px dashed transparent',
        outlineColor: isOver ? 'primary.main' : 'transparent',
        outlineOffset: '-2px',
        bgcolor: isOver ? 'action.selected' : 'transparent',
        transition: (t) =>
          t.transitions.create(['outline-color', 'background-color'], {
            duration: 120,
          }),
        minHeight: 60,
      }}
    >
      <SectionHeader label="Tabs" count={untracked.length} />
      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ px: 1.5, color: 'text.secondary' }}>
          {q ? 'No matches.' : isOver ? 'Drop to open as a new tab.' : 'No open tabs.'}
        </Typography>
      ) : (
        <SortableContext
          items={filtered.filter((t) => t.id != null).map((t) => liveId(t.id!))}
          strategy={verticalListSortingStrategy}
        >
          <List dense disablePadding>
            {pinned.map((t) => (
              <LiveTabItem key={t.id} tab={t} isActive={t.id === activeTabId} />
            ))}
            {pinned.length > 0 && unpinned.length > 0 && (
              <Divider sx={{ my: 0.5, mx: 1 }} />
            )}
            {unpinned.map((t) => (
              <LiveTabItem key={t.id} tab={t} isActive={t.id === activeTabId} />
            ))}
          </List>
        </SortableContext>
      )}
    </Box>
  );
}
