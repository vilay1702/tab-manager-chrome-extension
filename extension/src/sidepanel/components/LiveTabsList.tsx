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
};

export function LiveTabsList({ tabs, activeTabId, query }: Props) {
  const q = query.trim().toLowerCase();

  // Every live browser tab is its own entry, identified by chrome.tabs.Tab.id.
  // Duplicates of the same URL appear as separate rows because they're
  // separate browser tabs.
  const valid = tabs.filter((t) => t.id != null);
  const filtered = q
    ? valid.filter(
        (t) =>
          (t.title ?? '').toLowerCase().includes(q) ||
          (t.url ?? '').toLowerCase().includes(q),
      )
    : valid;

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
      <SectionHeader label="Tabs" count={valid.length} />
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
