export const colors = {
  bg: '#08090D',
  surface: '#12141B',
  surface2: '#1B1E28',
  elevated: '#222632',
  border: '#2C3140',
  text: '#F3F4F6',
  muted: '#8D93A6',
  accent: '#3DDC97',
  accentDim: 'rgba(61, 220, 151, 0.16)',
  gold: '#E8C547',
  goldDim: 'rgba(232, 197, 71, 0.16)',
  danger: '#FF5C6A',
  dangerDim: 'rgba(255, 92, 106, 0.16)',
  blue: '#4C8DFF',
  blueDim: 'rgba(76, 141, 255, 0.16)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const gradients = {
  accent: [colors.accent, '#1BAA66'] as const,
  purple: ['#7B61FF', '#4C3BCC'] as const,
  gold: [colors.gold, '#B8961D'] as const,
  danger: [colors.danger, '#CC3543'] as const,
  blue: [colors.blue, '#2961CC'] as const,
  dark: ['#1B1E28', '#12141B'] as const,
  glass: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] as const,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const typography = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const accountPalette = [
  colors.accent,
  '#7B61FF',
  colors.gold,
  colors.danger,
  colors.blue,
  colors.white,
] as const;
