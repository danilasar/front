import { alpha, createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#071B2D',
      paper: 'rgba(13, 48, 79, 0.78)',
    },
    primary: {
      main: '#54C8FF',
    },
    secondary: {
      main: '#7BFFB2',
    },
    text: {
      primary: '#F4FCFF',
      secondary: '#B8E5F4',
    },
    divider: 'rgba(184, 229, 244, 0.35)',
    error: {
      main: '#FF3456'
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${alpha(theme.palette.common.white, 0.24)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.18)} 0%, ${alpha(theme.palette.background.paper, 0.82)} 100%)`,
          boxShadow: `0 24px 60px ${alpha('#00111f', 0.42)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.34)}`,
          backdropFilter: 'blur(18px) saturate(150%)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          minHeight: 40,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.55)}`,
        }),
        contained: ({ theme }) => ({
          background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.7)} 0%, ${theme.palette.primary.main} 42%, #1597D8 100%)`,
          color: '#052337',
        }),
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.common.white, 0.45),
          background: alpha(theme.palette.common.white, 0.13),
          backdropFilter: 'blur(12px)',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${alpha(theme.palette.common.white, 0.36)}`,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.48)}`,
        }),
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#DDF8FF',
      paper: 'rgba(255, 255, 255, 0.74)',
    },
    primary: {
      main: '#56C8FF',
    },
    secondary: {
      main: '#35D68B',
    },
    text: {
      primary: '#063047',
      secondary: '#35697C',
    },
    divider: 'rgba(6, 48, 71, 0.16)',
    error: {
      main: '#F52538'
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${alpha(theme.palette.common.white, 0.72)}`,
          background: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.9)} 0%, ${alpha('#DFF8FF', 0.68)} 100%)`,
          boxShadow: `0 24px 60px ${alpha('#1384B6', 0.18)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.95)}`,
          backdropFilter: 'blur(18px) saturate(150%)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          minHeight: 40,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.8)}`,
        }),
        contained: {
          background: 'linear-gradient(180deg, #FFFFFF 0%, #8EE3FF 33%, #43C5FF 66%, #0B96DA 100%)',
          color: '#04324B',
        },
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.primary.main, 0.55),
          background: alpha(theme.palette.common.white, 0.42),
          backdropFilter: 'blur(12px)',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${alpha(theme.palette.common.white, 0.78)}`,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.9)}`,
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.78)} 0%, ${alpha(theme.palette.primary.main, 0.18)} 100%)`,
        }),
      },
    },
  },
});
