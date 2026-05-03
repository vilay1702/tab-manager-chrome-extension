import { Box, Button, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AppState } from '../../lib/types';
import { Updater } from '../hooks/useStore';
import { FolderItem } from './FolderItem';
import { SectionHeader } from './SectionHeader';

type Props = {
  state: AppState;
  query: string;
  update: (u: Updater) => void;
  onNewFolder: () => void;
  activeUrl: string | undefined;
};

export function FoldersSection({
  state,
  query,
  update,
  onNewFolder,
  activeUrl,
}: Props) {
  return (
    <Box sx={{ pb: 0.5 }}>
      <SectionHeader
        label="Folders"
        action={
          <Button
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
            onClick={onNewFolder}
            sx={{ minWidth: 0, fontSize: 11, py: 0, px: 1, color: 'text.secondary' }}
          >
            New
          </Button>
        }
      />
      {state.folders.length === 0 ? (
        <Typography variant="body2" sx={{ px: 1.5, color: 'text.secondary' }}>
          Save tabs into folders to keep them across sessions.
        </Typography>
      ) : (
        state.folders.map((folder) => (
          <FolderItem
            key={folder.id}
            state={state}
            folder={folder}
            query={query}
            update={update}
            activeUrl={activeUrl}
          />
        ))
      )}
    </Box>
  );
}
