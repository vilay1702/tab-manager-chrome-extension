import { Box, Fab, IconButton, Tooltip } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import LayersClearOutlinedIcon from '@mui/icons-material/LayersClearOutlined';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { newTab } from '../lib/liveActions';
import { RecentlyClosedButton } from './RecentlyClosedButton';
import { SettingsButton } from './SettingsButton';
import { RecentlyClosedTab, Settings } from '../../lib/types';

type Props = {
  windowId: number | undefined;
  tabCount: number;
  onNewFolder: () => void;
  onAutoOrganize: () => void;
  canAutoOrganize: boolean;
  recentlyClosed: RecentlyClosedTab[];
  notify: (msg: string) => void;
  onArchiveAll: () => void;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
};

export function BottomBar({
  windowId,
  tabCount,
  onNewFolder,
  onAutoOrganize,
  canAutoOrganize,
  recentlyClosed,
  notify,
  onArchiveAll,
  settings,
  onSettingsChange,
}: Props) {
  const archiveDisabled = windowId == null || tabCount === 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Tooltip title="Auto-organize tabs into folders">
        <span>
          <IconButton
            size="small"
            aria-label="Auto-organize tabs"
            onClick={onAutoOrganize}
            disabled={!canAutoOrganize}
            sx={{ width: 32, height: 32, color: 'text.secondary' }}
          >
            <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="New folder">
        <IconButton
          size="small"
          aria-label="New folder"
          onClick={onNewFolder}
          sx={{ width: 32, height: 32, color: 'text.secondary' }}
        >
          <CreateNewFolderOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Close all tabs in window">
        <span>
          <IconButton
            size="small"
            aria-label="Close all tabs in window"
            onClick={onArchiveAll}
            disabled={archiveDisabled}
            sx={{ width: 32, height: 32, color: 'text.secondary' }}
          >
            <LayersClearOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <RecentlyClosedButton list={recentlyClosed} notify={notify} />
      <SettingsButton settings={settings} onChange={onSettingsChange} />
      <Box sx={{ flex: 1 }} />
      <Tooltip title="New tab">
        <Fab
          color="primary"
          size="small"
          onClick={() => newTab()}
          aria-label="New tab"
          sx={{ width: 36, height: 36, minHeight: 36, boxShadow: 2 }}
        >
          <AddRoundedIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
