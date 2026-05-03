import { useState } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { faviconUrl } from '../../lib/tabs';

type Props = {
  url: string;
  size?: number;
  sx?: SxProps<Theme>;
};

export function Favicon({ url, size = 16, sx }: Props) {
  const [errored, setErrored] = useState(false);
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    /* invalid url */
  }
  const initial = host.replace(/^www\./, '').charAt(0).toUpperCase() || '•';

  if (errored || !host) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.55),
          fontWeight: 600,
          borderRadius: '4px',
          bgcolor: 'action.selected',
          color: 'text.secondary',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          textTransform: 'uppercase',
          ...sx,
        }}
        aria-hidden
      >
        {initial}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={faviconUrl(url, size * 2)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setErrored(true)}
      sx={{ flexShrink: 0, borderRadius: '3px', objectFit: 'contain', ...sx }}
    />
  );
}
