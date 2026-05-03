import { createTheme, type PaletteMode } from "@mui/material/styles";

export function makeTheme(mode: PaletteMode) {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#8ab4f8" : "#1a73e8",
        contrastText: isDark ? "#0b1f3a" : "#ffffff",
      },
      secondary: {
        main: isDark ? "#c4c7ca" : "#5f6368",
      },
      background: {
        default: isDark ? "#202124" : "#ffffff",
        paper: isDark ? "#2d2e31" : "#ffffff",
      },
      text: {
        primary: isDark ? "#e8eaed" : "#202124",
        secondary: isDark ? "#9aa0a6" : "#5f6368",
      },
      divider: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      action: {
        hover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        selected: isDark ? "rgba(138,180,248,0.16)" : "rgba(26,115,232,0.10)",
      },
    },
    typography: {
      fontFamily:
        'Roboto, "Google Sans", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", sans-serif',
      fontSize: 13,
      body1: { fontSize: 13, lineHeight: 1.4 },
      body2: { fontSize: 12, lineHeight: 1.4 },
      caption: {
        fontSize: 11,
        lineHeight: 1.4,
        color: isDark ? "#9aa0a6" : "#5f6368",
      },
      button: { textTransform: "none", fontWeight: 500 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingTop: 6,
            paddingBottom: 6,
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 28 },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: false, enterDelay: 400 },
      },
      MuiTextField: {
        defaultProps: { size: "small", variant: "filled" },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 999 },
        },
      },
    },
  });
}
