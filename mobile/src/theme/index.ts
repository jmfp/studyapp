export const colors = {
  background: '#0B1120',
  surface: '#141E30',
  surfaceElevated: '#1B2840',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  accent: '#F59E0B',
  accentSecondary: '#FBBF24',
  white: '#FFFFFF',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  success: '#22C55E',
  successLight: '#4ADE80',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  warning: '#F59E0B',
  border: '#1E293B',
  cardBg: '#141E30',
  overlay: 'rgba(0,0,0,0.75)',
  gradient1: '#2563EB',
  gradient2: '#0EA5E9',
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
  h1: { fontSize: 32, fontWeight: '700' as const, color: '#F1F5F9', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, color: '#F1F5F9' },
  h3: { fontSize: 20, fontWeight: '600' as const, color: '#F1F5F9' },
  h4: { fontSize: 17, fontWeight: '600' as const, color: '#F1F5F9' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#F1F5F9' },
  bodyMuted: { fontSize: 15, fontWeight: '400' as const, color: '#94A3B8' },
  small: { fontSize: 13, fontWeight: '400' as const, color: '#94A3B8' },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' as const },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
};
