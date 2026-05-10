import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import { LiveTab } from "../hooks/useLiveTabs";
import { activateTab, closeTab, domainOf } from "../lib/liveActions";
import { Favicon } from "./Favicon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { liveId } from "../lib/dnd";

type Props = {
  tab: LiveTab;
  isActive: boolean;
};

export function LiveTabItem({ tab, isActive }: Props) {
  const sortable = useSortable({
    id: liveId(tab.id ?? -1),
    data: { index: tab.index, pinned: tab.pinned },
    disabled: tab.id == null,
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const title = (tab.title ?? "").trim() || tab.url || "Untitled";
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
      sx={{ position: "relative" }}
      {...attributes}
      {...listeners}
    >
      <ListItemButton
        selected={isActive}
        onClick={() => tab.id != null && activateTab(tab.id)}
        onAuxClick={(e) => {
          if (e.button === 1 && tab.id != null) closeTab(tab.id);
        }}
        sx={{
          px: 1,
          py: 0.5,
          gap: 1,
          "& .live-close": { opacity: 0 },
          "&:hover .live-close, &:focus-within .live-close": { opacity: 1 },
          ...(isActive && {
            bgcolor: "action.selected",
            outline: (t) => `2px dashed ${t.palette.primary.main}`,
            outlineOffset: "-2px",
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 24 }}>
          <Favicon url={tab.url ?? ""} size={16} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minWidth: 0,
              }}
            >
              {tab.pinned && (
                <PushPinRoundedIcon
                  sx={{ fontSize: 12, color: "primary.main", flexShrink: 0 }}
                />
              )}
              <Box
                component="span"
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: "text.primary",
                }}
              >
                {title}
              </Box>
            </Box>
          }
          secondary={domain || undefined}
          slotProps={{
            primary: { sx: { lineHeight: 1.2 } },
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
        <IconButton
          className="live-close"
          size="small"
          aria-label="Close tab"
          onClick={(e) => {
            e.stopPropagation();
            if (tab.id != null) closeTab(tab.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          sx={{
            transition: (t) =>
              t.transitions.create("opacity", { duration: 120 }),
            color: "text.secondary",
            width: 22,
            height: 22,
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </ListItemButton>
    </Box>
  );
}
