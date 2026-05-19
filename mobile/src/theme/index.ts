export const theme = {
  colors: {
    primary: '#F9423A',
    primaryDark: '#D4362E',
    bg: '#1A1033',
    bgLight: '#F8F8FA',
    white: '#FFFFFF',
    text: '#1A1033',
    textSecondary: 'rgba(26, 16, 51, 0.4)',
    textMuted: 'rgba(26, 16, 51, 0.2)',
    border: 'rgba(26, 16, 51, 0.05)',
    accent: '#F9423A',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    black: undefined, // Use system default; replace with custom fonts later
    bold: undefined,
    medium: undefined,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    round: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#F9423A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
