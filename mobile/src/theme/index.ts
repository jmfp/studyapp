export const colors = {
  background: '#0F0F1A',
  surface: '#1C1C2E',
  surfaceElevated: '#252538',
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4B43DB',
  accent: '#B2FF59',
  accentSecondary: '#76FF03',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#5A5A7A',
  success: '#4CAF50',
  successLight: '#81C784',
  error: '#FF5252',
  errorLight: '#FF8A80',
  warning: '#FFD740',
  border: '#2A2A40',
  cardBg: '#1C1C2E',
  overlay: 'rgba(0,0,0,0.7)',
  gradient1: '#6C63FF',
  gradient2: '#9C27B0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: '#FFFFFF', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: '#FFFFFF' },
  h3: { fontSize: 20, fontWeight: '600' as const, color: '#FFFFFF' },
  h4: { fontSize: 17, fontWeight: '600' as const, color: '#FFFFFF' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#FFFFFF' },
  bodyMuted: { fontSize: 15, fontWeight: '400' as const, color: '#A0A0B0' },
  small: { fontSize: 13, fontWeight: '400' as const, color: '#A0A0B0' },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#A0A0B0', letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};
