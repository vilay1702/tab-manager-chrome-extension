import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8ab4f8',
      contrastText: '#0b1f3a',
    },
    secondary: {
      main: '#c4c7ca',
    },
    background: {
      default: '#202124',
      paper: '#2d2e31',
    },
    text: {
      primary: '#e8eaed',
      secondary: '#9aa0a6',
    },
    divider: 'rgba(255,255,255,0.10)',
    action: {
      hover: 'rgba(255,255,255,0.06)',
      selected: 'rgba(138,180,248,0.16)',
    },
  },
  typography: {
    fontFamily:
      'Roboto, "Google Sans", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", sans-serif',
    h1: { fontWeight: 700, fontSize: '3rem', lineHeight: 1.15, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3 },
    h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.35 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { paddingInline: 18, paddingBlock: 10 },
      },
    },
  },
});
