import { useState, MouseEvent } from "react";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon as MenuIcon,
  Divider,
  TextField,
} from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Tab } from "../../lib/types";
import { Favicon } from "./Favicon";
import { openOrActivate } from "../../lib/tabs";
import { domainOf } from "../lib/liveActions";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { savedId } from "../lib/dnd";

type Props = {
  tab: Tab;
  folderId: string;
  isFavorite: boolean;
  canFavorite: boolean;
  isActive: boolean;
  folderOptions: { id: string; name: string }[];
  onRemove: () => void;
  onToggleFavorite: () => void;
  onMoveTo: (folderId: string) => void;
  onRename: (name: string) => void;
};

export function SavedTabItem({
  tab,
  folderId,
  isFavorite,
  canFavorite,
  isActive,
  folderOptions,
  onRemove,
  onToggleFavorite,
  onMoveTo,
  onRename,
}: Props) {
  const sortable = useSortable({
    id: savedId(folderId, tab.id),
    data: { folderId, type: "tab" },
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(tab.title);

  const open = (e: MouseEvent) => setAnchor(e.currentTarget as HTMLElement);
  const close = () => setAnchor(null);

  const startRename = () => {
    setDraft(tab.title);
    setRenaming(true);
  };
  const commitRename = () => {
    if (draft.trim() && draft.trim() !== tab.title) onRename(draft);
    setRenaming(false);
  };
  const cancelRename = () => {
    setDraft(tab.title);
    setRenaming(false);
  };

  const moveOptions = folderOptions.filter((f) => f.id !== folderId);
  const domain = domainOf(tab.url);

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <ListItemButton
        selected={isActive}
        disableRipple={renaming}
        onClick={(e) => {
          if (renaming) return;
          openOrActivate(tab.url, e.metaKey || e.ctrlKey);
        }}
        onAuxClick={(e) => {
          if (renaming) return;
          if (e.button === 1) openOrActivate(tab.url, true);
        }}
        sx={{
          px: 1,
          py: 0.5,
          gap: 1,
          "& .saved-actions": { opacity: 0 },
          "&:hover .saved-actions, &:focus-within .saved-actions": {
            opacity: 1,
          },
          ...(isActive && {
            bgcolor: "action.selected",
            outline: (t: any) => `2px dashed ${t.palette.primary.main}`,
            outlineOffset: "-2px",
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 24 }}>
          <Favicon url={tab.url} size={16} />
        </ListItemIcon>
        <ListItemText
          primary={
            renaming ? (
              <TextField
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") commitRename();
                  else if (e.key === "Escape") cancelRename();
                }}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  "& .MuiInputBase-input": { py: 0.25, fontSize: 13 },
                  "& .MuiOutlinedInput-root": { borderRadius: 1 },
                }}
              />
            ) : (
              tab.title
            )
          }
          secondary={domain || undefined}
          slotProps={{
            primary: {
              sx: {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 13,
                lineHeight: 1.2,
              },
            },
            secondary: {
              sx: {
                fontSize: 10.5,
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              },
            },
          }}
          sx={{ m: 0 }}
        />
        <Box
          className="saved-actions"
          sx={{ display: "flex", gap: 0.25, transition: "opacity 120ms" }}
        >
          <IconButton
            size="small"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            disabled={!isFavorite && !canFavorite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{
              width: 22,
              height: 22,
              color: isFavorite ? "primary.main" : "text.secondary",
              opacity: isFavorite ? 1 : undefined,
            }}
          >
            {isFavorite ? (
              <StarRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            aria-label="Rename"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{ width: 22, height: 22, color: "text.secondary" }}
          >
            <EditRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Tab actions"
            onClick={(e) => {
              e.stopPropagation();
              open(e);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{ width: 22, height: 22, color: "text.secondary" }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </ListItemButton>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        transitionDuration={120}
      >
        <MenuItem
          onClick={() => {
            close();
            openOrActivate(tab.url, true);
          }}
        >
          <MenuIcon>
            <OpenInNewRoundedIcon fontSize="small" />
          </MenuIcon>
          Open in new tab
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            startRename();
          }}
        >
          <MenuIcon>
            <EditRoundedIcon fontSize="small" />
          </MenuIcon>
          Rename
        </MenuItem>
        {moveOptions.length > 0 && <Divider />}
        {moveOptions.map((f) => (
          <MenuItem
            key={f.id}
            onClick={() => {
              close();
              onMoveTo(f.id);
            }}
          >
            <MenuIcon>
              <DriveFileMoveOutlinedIcon fontSize="small" />
            </MenuIcon>
            Move to "{f.name}"
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            onRemove();
          }}
          sx={{ color: "error.main" }}
        >
          <MenuIcon>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </MenuIcon>
          Remove
        </MenuItem>
      </Menu>
    </Box>
  );
}
