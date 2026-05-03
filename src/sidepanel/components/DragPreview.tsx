import { Box, Typography } from '@mui/material';
import { Favicon } from './Favicon';
import { Tab, AppState } from '../../lib/types';
import { LiveTab } from '../hooks/useLiveTabs';
import { DragInfo } from '../lib/dnd';
import { domainOf } from '../lib/liveActions';

type Props = {
  info: DragInfo;
  state: AppState;
  liveTabs: LiveTab[];
};

export function DragPreview({ info, state, liveTabs }: Props) {
  const item = resolve(info, state, liveTabs);
  if (!item) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.75,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        boxShadow: 8,
        maxWidth: 280,
        cursor: 'grabbing',
        transform: 'rotate(-1.5deg)',
      }}
    >
      <Favicon url={item.url} size={18} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {item.title || item.url}
        </Typography>
        {item.domain && (
          <Typography
            sx={{
              fontSize: 10.5,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {item.domain}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function resolve(
  info: DragInfo,
  state: AppState,
  liveTabs: LiveTab[],
): { title: string; url: string; domain: string } | null {
  if (info.kind === 'live') {
    const t = liveTabs.find((x) => x.id === info.tabId);
    if (!t || !t.url) return null;
    return { title: t.title || t.url, url: t.url, domain: domainOf(t.url) };
  }
  if (info.kind === 'fav') {
    const f = state.favorites.find((x) => x.id === info.id);
    if (!f) return null;
    return { title: f.title, url: f.url, domain: domainOf(f.url) };
  }
  if (info.kind === 'saved') {
    const folder = state.folders.find((f) => f.id === info.folderId);
    const t = folder?.tabs.find((x: Tab) => x.id === info.id);
    if (!t) return null;
    return { title: t.title, url: t.url, domain: domainOf(t.url) };
  }
  return null;
}
