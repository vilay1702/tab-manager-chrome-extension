import { useEffect, useRef, useState, MouseEvent } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  ListItemButton,
  Menu,
  MenuItem,
  ListItemIcon as MenuIcon,
  Typography,
  TextField,
  Divider,
} from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { AppState, FOLDER_COLORS, Folder } from '../../lib/types';
import { Updater } from '../hooks/useStore';
import {
  addFavorite,
  deleteFolder,
  favoritesHasUrl,
  moveTab,
  removeFavorite,
  removeTabFromFolder,
  renameFolder,
  setFolderColor,
  toggleCollapse,
} from '../state/actions';
import { SavedTabItem } from './SavedTabItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { dzFolder, savedId } from '../lib/dnd';

type Props = {
  state: AppState;
  folder: Folder;
  query: string;
  update: (u: Updater) => void;
  activeUrl: string | undefined;
};

export function FolderItem({
  state,
  folder,
  query,
  update,
  activeUrl,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: dzFolder(folder.id),
    data: { folderId: folder.id, type: 'folder' },
  });

  const expandTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (isOver && folder.collapsed) {
      expandTimer.current = window.setTimeout(() => {
        update(toggleCollapse(folder.id));
      }, 500);
      return () => {
        if (expandTimer.current) {
          clearTimeout(expandTimer.current);
          expandTimer.current = undefined;
        }
      };
    }
    return undefined;
  }, [isOver, folder.collapsed, folder.id, update]);

  const filtered = query
    ? folder.tabs.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.url.toLowerCase().includes(query.toLowerCase()),
      )
    : folder.tabs;

  const open = !folder.collapsed || query.length > 0;
  const folderOptions = state.folders.map((f) => ({ id: f.id, name: f.name }));

  const openMenu = (e: MouseEvent) => setAnchor(e.currentTarget as HTMLElement);
  const closeMenu = () => setAnchor(null);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        borderRadius: 1.5,
        outline: isOver ? '2px dashed' : '2px dashed transparent',
        outlineColor: isOver ? 'primary.main' : 'transparent',
        outlineOffset: '-2px',
        bgcolor: isOver ? 'action.selected' : 'transparent',
        transition: (t) =>
          t.transitions.create(['outline-color', 'background-color'], { duration: 120 }),
      }}
    >
      <ListItemButton
        onClick={() => !renaming && update(toggleCollapse(folder.id))}
        sx={{
          px: 1,
          py: 0.5,
          gap: 0.5,
          '& .folder-actions': { opacity: 0 },
          '&:hover .folder-actions, &:focus-within .folder-actions': { opacity: 1 },
        }}
      >
        <ChevronRightRoundedIcon
          sx={{
            fontSize: 18,
            color: 'text.secondary',
            transition: (t) => t.transitions.create('transform', { duration: 140 }),
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: folder.color || 'primary.main',
            flexShrink: 0,
            mr: 0.5,
          }}
        />
        {renaming ? (
          <TextField
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              update(renameFolder(folder.id, draftName));
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraftName(folder.name);
                setRenaming(false);
              }
            }}
            variant="outlined"
            size="small"
            sx={{
              flex: 1,
              '& .MuiInputBase-input': { py: 0.5, fontSize: 13, fontWeight: 600 },
            }}
          />
        ) : (
          <Typography
            sx={{
              flex: 1,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {folder.name}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            bgcolor: 'action.hover',
            px: 0.75,
            py: 0,
            borderRadius: 999,
            fontSize: 10.5,
          }}
        >
          {folder.tabs.length}
        </Typography>
        <IconButton
          className="folder-actions"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            openMenu(e);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          sx={{ width: 22, height: 22, color: 'text.secondary', transition: 'opacity 120ms' }}
        >
          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </ListItemButton>

      <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            setDraftName(folder.name);
            setRenaming(true);
          }}
        >
          <MenuIcon>
            <EditRoundedIcon fontSize="small" />
          </MenuIcon>
          Rename
        </MenuItem>
        <Divider />
        <Box sx={{ px: 1.5, py: 0.5, display: 'flex', gap: 0.75 }}>
          {FOLDER_COLORS.map((c) => (
            <Box
              key={c}
              onClick={(e) => {
                e.stopPropagation();
                update(setFolderColor(folder.id, c));
                closeMenu();
              }}
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: c,
                cursor: 'pointer',
                border: c === folder.color ? '2px solid' : '2px solid transparent',
                borderColor: c === folder.color ? 'text.primary' : 'transparent',
                '&:hover': { transform: 'scale(1.15)' },
                transition: 'transform 140ms',
              }}
            />
          ))}
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
            if (
              folder.tabs.length === 0 ||
              confirm(`Delete "${folder.name}" and ${folder.tabs.length} tab(s)?`)
            ) {
              update(deleteFolder(folder.id));
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <MenuIcon>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </MenuIcon>
          Delete folder
        </MenuItem>
      </Menu>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ pl: 2.5 }}>
          {filtered.length === 0 ? (
            <Typography variant="body2" sx={{ px: 1, py: 0.5, color: 'text.secondary' }}>
              {query ? 'No matches.' : 'Drop tabs here.'}
            </Typography>
          ) : (
            <SortableContext
              items={filtered.map((t) => savedId(folder.id, t.id))}
              strategy={verticalListSortingStrategy}
            >
              {filtered.map((tab) => {
                const isFav = favoritesHasUrl(state, tab.url);
                return (
                  <SavedTabItem
                    key={tab.id}
                    tab={tab}
                    folderId={folder.id}
                    isFavorite={isFav}
                    canFavorite={state.favorites.length < 8}
                    isActive={tab.url === activeUrl}
                    folderOptions={folderOptions}
                    onRemove={() => update(removeTabFromFolder(folder.id, tab.id))}
                    onToggleFavorite={() => {
                      if (isFav) {
                        const fav = state.favorites.find((f) => f.url === tab.url);
                        if (fav) update(removeFavorite(fav.id));
                      } else {
                        update(addFavorite({ ...tab, id: crypto.randomUUID() }));
                      }
                    }}
                    onMoveTo={(toFolderId) =>
                      update(moveTab(folder.id, toFolderId, tab.id))
                    }
                  />
                );
              })}
            </SortableContext>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
