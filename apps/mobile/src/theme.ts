/** MVP 固定浅色主题 */
export const colors = {
  background: '#F3F6FA',
  card: '#FFFFFF',
  text: '#1F2933',
  textSecondary: '#6B7684',
  textTertiary: '#9AA4B0',
  border: '#E4E9EF',
  primary: '#4A90D9',
  primarySoft: '#E8F1FB',
  danger: '#D9534F',
  dangerSoft: '#FBEAEA',
  success: '#4CAF7D',
  overlay: 'rgba(31, 41, 51, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const typography = {
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  secondary: { fontSize: 13, color: colors.textSecondary },
};
