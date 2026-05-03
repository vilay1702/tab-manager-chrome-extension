import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

type Props = {
  label: string;
  count?: number;
  action?: ReactNode;
};

export function SectionHeader({ label, count, action }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        pb: 0.5,
        pt: 0.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          fontSize: 10.5,
        }}
      >
        {label}
        {count != null && (
          <Box component="span" sx={{ ml: 0.75, color: 'text.secondary', opacity: 0.8 }}>
            {count}
          </Box>
        )}
      </Typography>
      {action}
    </Box>
  );
}
