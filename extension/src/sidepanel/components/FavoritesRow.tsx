import { Tab } from '../../lib/types';
import { Updater } from '../hooks/useStore';
import { removeFavorite } from '../state/actions';
import { openOrActivate } from '../../lib/tabs';
import { Favicon } from './Favicon';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { dzFav, favId } from '../lib/dnd';

type Props = {
  favorites: Tab[];
  update: (u: Updater) => void;
  activeUrl: string | undefined;
};

export function FavoritesRow({ favorites, update, activeUrl }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: dzFav });

  return (
    <SortableContext
      items={favorites.map((f) => favId(f.id))}
      strategy={rectSortingStrategy}
    >
      <Box
        ref={setNodeRef}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 0.75,
          px: favorites.length === 0 ? 1 : 0.5,
          py: favorites.length === 0 ? 1 : 0.5,
          alignItems: 'center',
          borderRadius: 2,
          border: favorites.length === 0 ? '1px dashed' : 'none',
          borderColor: 'divider',
          outline: isOver ? '2px dashed' : '2px dashed transparent',
          outlineColor: isOver ? 'primary.main' : 'transparent',
          outlineOffset: '-2px',
          bgcolor: isOver ? 'action.selected' : 'transparent',
          transition: (t) =>
            t.transitions.create(
              ['outline-color', 'background-color', 'border-color'],
              { duration: 120 },
            ),
          minHeight: 44,
        }}
      >
        {favorites.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'text.secondary',
              flex: 1,
              minWidth: 0,
            }}
          >
            <StarBorderRoundedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{
                fontSize: 12,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Drag tabs here to favorite them
            </Typography>
          </Box>
        ) : (
          favorites.map((tab) => (
            <FavTile
              key={tab.id}
              tab={tab}
              isActive={tab.url === activeUrl}
              onOpen={(force) => openOrActivate(tab.url, force)}
              onRemove={() => update(removeFavorite(tab.id))}
            />
          ))
        )}
      </Box>
    </SortableContext>
  );
}

function FavTile({
  tab,
  isActive,
  onOpen,
  onRemove,
}: {
  tab: Tab;
  isActive: boolean;
  onOpen: (forceNewTab: boolean) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: favId(tab.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  let host = '';
  try {
    host = new URL(tab.url).hostname.replace(/^www\./, '');
  } catch {
    /* */
  }

  return (
    <Tooltip title={`${tab.title} · ${host}`} placement="bottom">
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          position: 'relative',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: isActive ? 'action.selected' : 'action.hover',
          outline: isActive ? '2px solid' : '2px solid transparent',
          outlineColor: isActive ? 'primary.main' : 'transparent',
          outlineOffset: '0px',
          cursor: 'pointer',
          transition: (t) =>
            t.transitions.create(['background-color', 'transform', 'outline-color'], {
              duration: 140,
            }),
          touchAction: 'none',
          '&:hover': {
            bgcolor: isActive ? 'action.selected' : 'action.hover',
            '.fav-remove': { opacity: 1 },
          },
          '&:active': { transform: 'scale(0.96)' },
        }}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (e.defaultPrevented) return;
          onOpen(e.metaKey || e.ctrlKey);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) onOpen(true);
        }}
      >
        <Favicon url={tab.url} size={20} />
        <IconButton
          className="fav-remove"
          size="small"
          aria-label="Remove from favorites"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 16,
            height: 16,
            bgcolor: 'text.primary',
            color: 'background.paper',
            opacity: 0,
            transition: (t) => t.transitions.create('opacity', { duration: 120 }),
            '&:hover': { bgcolor: 'text.primary' },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 10 }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
