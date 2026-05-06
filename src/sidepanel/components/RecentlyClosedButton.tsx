import { useState, MouseEvent } from 'react';
import {
  Badge,
  Box,
  Button,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Favicon } from './Favicon';
import { domainOf } from '../lib/liveActions';
import { RecentlyClosedTab } from '../../lib/types';
import {
  clearClosedTabs,
  dismissClosedTab,
  restoreClosedTab,
} from '../operations';

type Props = {
  list: RecentlyClosedTab[];
  notify: (msg: string) => void;
};

export function RecentlyClosedButton({ list, notify }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (e: MouseEvent<HTMLButtonElement>) =>
    setAnchor(e.currentTarget);
  const close = () => setAnchor(null);

  const empty = list.length === 0;

  return (
    <>
      <Tooltip title="Recently closed">
        <span>
          <IconButton
            size="small"
            onClick={open}
            disabled={empty}
            sx={{ width: 32, height: 32, color: 'text.secondary' }}
          >
            <Badge
              badgeContent={list.length}
              color="primary"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 9,
                  height: 14,
                  minWidth: 14,
                  px: '3px',
                },
              }}
            >
              <HistoryRoundedIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 360,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            px: 1.25,
            py: 0.75,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>
            Recently closed
          </Typography>
          <Button
            size="small"
            onClick={() => {
              clearClosedTabs();
              close();
            }}
            sx={{ fontSize: 11, minWidth: 0, px: 0.75, py: 0.25 }}
          >
            Clear
          </Button>
        </Stack>
        <Box sx={{ overflowY: 'auto' }}>
          {list.map((entry) => (
            <ClosedTabRow
              key={entry.id}
              entry={entry}
              onRestore={() => {
                restoreClosedTab(entry.url, entry.id, notify);
                close();
              }}
              onDismiss={() => dismissClosedTab(entry.id)}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
}

function ClosedTabRow({
  entry,
  onRestore,
  onDismiss,
}: {
  entry: RecentlyClosedTab;
  onRestore: () => void;
  onDismiss: () => void;
}) {
  const domain = domainOf(entry.url);
  return (
    <ListItemButton
      onClick={onRestore}
      sx={{
        px: 1,
        py: 0.5,
        gap: 1,
        position: 'relative',
        '& .closed-actions': { display: 'none' },
        '&:hover .closed-actions, &:focus-within .closed-actions': {
          display: 'flex',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 24 }}>
        <Favicon url={entry.url} size={16} />
      </ListItemIcon>
      <ListItemText
        primary={entry.title}
        secondary={`${domain || ''}${domain ? ' · ' : ''}${formatRelative(entry.closedAt)}`}
        slotProps={{
          primary: {
            sx: {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
              lineHeight: 1.2,
            },
          },
          secondary: {
            sx: {
              fontSize: 10.5,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            },
          },
        }}
        sx={{ m: 0 }}
      />
      <Box
        className="closed-actions"
        sx={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(32,33,36,0.7)'
              : 'rgba(255,255,255,0.7)',
          borderRadius: 1.5,
          px: 0.25,
        }}
      >
        <IconButton
          size="small"
          aria-label="Dismiss"
          title="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          sx={{ width: 22, height: 22, color: 'text.secondary' }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </ListItemButton>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
