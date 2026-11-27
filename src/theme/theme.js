'use client';

import { createTheme } from '@mui/material/styles';

export const brandColors = {
  navy: '#0B2A5B',
  primaryBlue: '#1D4ED8',
  brightBlue: '#3B82F6',
  skyTint: '#EAF2FF',
  iceBg: '#F5F8FD',
  white: '#FFFFFF',
  border: '#E3EAF5',
  textPrimary: '#0F1B33',
  textSecondary: '#5B6B88',
  heroGradient: 'linear-gradient(135deg, #0B2A5B 0%, #1D4ED8 100%)',
  cardShadow: '0 4px 24px rgba(11, 42, 91, 0.06)',
  cardHoverShadow: '0 12px 32px rgba(29, 78, 216, 0.14)',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0EA5E9'
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primaryBlue,
      dark: brandColors.navy,
      light: brandColors.brightBlue,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.navy,
      light: '#1E3A8A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: brandColors.iceBg,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.textPrimary,
      secondary: brandColors.textSecondary,
    },
    divider: brandColors.border,
    success: {
      main: brandColors.success,
      light: '#DCFCE7',
      dark: '#15803D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: brandColors.warning,
      light: '#FEF3C7',
      dark: '#B45309',
      contrastText: '#FFFFFF',
    },
    error: {
      main: brandColors.error,
      light: '#FEE2E2',
      dark: '#B91C1C',
      contrastText: '#FFFFFF',
    },
    info: {
      main: brandColors.info,
      light: '#E0F2FE',
      dark: '#0369A1',
      contrastText: '#FFFFFF',
    },
    custom: brandColors
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '22px',
      fontWeight: 700,
      lineHeight: 1.35,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: 1.45,
    },
    body1: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '14px',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
        body: {
          backgroundColor: brandColors.iceBg,
          color: brandColors.textPrimary,
          margin: 0,
          padding: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '*': {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
        '*::-webkit-scrollbar': {
          display: 'none',
          width: 0,
          height: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.border}`,
          boxShadow: brandColors.cardShadow,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          minHeight: 42,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          lineHeight: 1.25,
          gap: '8px',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
            transform: 'translateY(-1px)',
          },
        },
        startIcon: {
          marginLeft: 0,
          marginRight: 0,
        },
        endIcon: {
          marginLeft: 0,
          marginRight: 0,
        },
        containedPrimary: {
          backgroundColor: brandColors.primaryBlue,
          '&:hover': {
            backgroundColor: brandColors.navy,
          },
        },
        outlinedPrimary: {
          borderColor: brandColors.primaryBlue,
          color: brandColors.primaryBlue,
          '&:hover': {
            backgroundColor: brandColors.skyTint,
            borderColor: brandColors.navy,
          },
        },
        sizeSmall: {
          minHeight: 36,
          padding: '7px 16px',
          fontSize: '13px',
          gap: '6px',
        },
        sizeLarge: {
          minHeight: 48,
          padding: '12px 28px',
          fontSize: '15px',
          gap: '10px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: brandColors.white,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '& fieldset': {
            borderColor: brandColors.border,
          },
          '&:hover fieldset': {
            borderColor: brandColors.brightBlue,
          },
          '&.Mui-focused fieldset': {
            borderColor: brandColors.primaryBlue,
            borderWidth: '1.5px',
          },
        },
        input: {
          padding: '11px 14px',
          fontSize: '14px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderColor: brandColors.border,
          fontSize: '13.5px',
          color: brandColors.textPrimary,
        },
        head: {
          backgroundColor: '#F8FAFC',
          fontWeight: 600,
          color: brandColors.navy,
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: brandColors.skyTint,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '12px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 20px 48px rgba(11, 42, 91, 0.16)',
        },
      },
    },
  },
});

export default theme;
