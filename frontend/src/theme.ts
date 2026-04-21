import { createTheme } from '@mui/material/styles';

// Тёмная тема
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0F172A',  // фон страницы
      paper: '#1E293B',    // карточки
    },
    primary: {
      main: '#3B82F6',     // кнопки
    },
    secondary: {
      main: '#22C55E',     // автор цитаты
    },
    text: {
      primary: '#E5E7EB',  // основной текст
      secondary: '#94A3B8',// второстепенный текст
    },
    divider: '#94A3B8',
    error: {
      main: '#FF3456'
    },
  },
});

// Светлая тема
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F8F5F0',  // фон страницы
      paper: '#FFFFFF',    // карточки
    },
    primary: {
      main: '#9FAFBF',     // кнопки
    },
    secondary: {
      main: '#D97706',     // автор цитаты
    },
    text: {
      primary: '#111827',  // основной текст
    },
    divider: '#1E293B',
    error: {
      main: '#F52538'
    },
  },
});
