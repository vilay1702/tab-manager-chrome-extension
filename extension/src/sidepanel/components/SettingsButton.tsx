import { useState, MouseEvent } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Settings } from '../../lib/types';

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
};

export function SettingsButton({ settings, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (e: MouseEvent<HTMLButtonElement>) =>
    setAnchor(e.currentTarget);
  const close = () => setAnchor(null);

  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          size="small"
          aria-label="Settings"
          onClick={open}
          sx={{ width: 32, height: 32, color: 'text.secondary' }}
        >
          <SettingsRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 300 } } }}
      >
        <Stack
          sx={{
            px: 1.25,
            py: 0.75,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
        </Stack>
        <Box sx={{ px: 1.25, py: 1 }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'flex-start', gap: 1 }}
            component="label"
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, lineHeight: 1.3 }}>
                Reopen saved tabs on Chrome startup
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: 'text.secondary',
                  lineHeight: 1.3,
                  mt: 0.25,
                }}
              >
                Opens every favorite and folder tab as background tabs when
                Chrome starts cold.
              </Typography>
            </Box>
            <Switch
              size="small"
              checked={settings.restoreSavedTabsOnStartup}
              onChange={(e) =>
                onChange({ restoreSavedTabsOnStartup: e.target.checked })
              }
              slotProps={{
                input: {
                  'aria-label': 'Reopen saved tabs on Chrome startup',
                },
              }}
            />
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
