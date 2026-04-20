// ============================================
// theme.ts — Shared design tokens
// Import this anywhere you need colors,
// spacing, typography, or border radius.
//
// COLORS: Do NOT import `colors` directly in
// screens anymore. Use the useTheme() hook
// from ThemeContext instead so light/dark mode
// works automatically across the whole app.
//
// spacing, radius, fontSize, letterSpacing,
// and fonts are static — import those directly.
// ============================================

// ── Dark palette (default) ────────────────────────────────────
export const darkColors = {
  background:   '#0a0e1a',
  card:         '#1c2330',
  cardAlt:      '#2d3544',
  cardHover:    '#3d4554',

  primary:      '#ff8c00',
  primaryDark:  '#ff6b00',
  primaryLight: '#ffa000',
  primaryFaint: 'rgba(255, 140, 0, 0.1)',

  textWhite:    '#ffffff',
  textLight:    '#d1d5db',
  textMuted:    '#6b7280',
  textDisabled: '#4b5563',

  border:       '#2d3544',
  borderActive: '#ff8c00',
  borderHover:  '#3d4554',

  success:      '#34d399',
  successDot:   '#10b981',
  warning:      '#f59e0b',
  error:        '#f87171',
  errorTitle:   '#fca5a5',
  errorBg:      'rgba(127, 29, 29, 0.3)',
  errorBorder:  'rgba(153, 27, 27, 0.6)',
  errorIcon:    'rgba(127, 29, 29, 0.4)',
};

// ── Light palette ─────────────────────────────────────────────
export const lightColors = {
  background:   '#f0f4f8',          // soft off-white — easier on the eyes than pure white
  card:         '#ffffff',          // white cards
  cardAlt:      '#e2e8f0',          // light gray for borders/dividers
  cardHover:    '#cbd5e1',          // slightly darker hover

  primary:      '#d97706',          // amber — slightly darker so it reads on light bg
  primaryDark:  '#b45309',
  primaryLight: '#f59e0b',
  primaryFaint: 'rgba(217, 119, 6, 0.08)',

  textWhite:    '#0f172a',          // near-black — main text on light bg
  textLight:    '#334155',          // dark slate — labels, secondary text
  textMuted:    '#64748b',          // medium gray — placeholders
  textDisabled: '#94a3b8',          // lighter gray — disabled

  border:       '#cbd5e1',          // light blue-gray border
  borderActive: '#d97706',          // amber active border
  borderHover:  '#94a3b8',

  success:      '#059669',          // darker green — readable on light bg
  successDot:   '#047857',
  warning:      '#d97706',
  error:        '#dc2626',          // darker red — readable on light bg
  errorTitle:   '#b91c1c',
  errorBg:      'rgba(220, 38, 38, 0.08)',
  errorBorder:  'rgba(185, 28, 28, 0.3)',
  errorIcon:    'rgba(220, 38, 38, 0.1)',
};

// ── Static fallback (for files not yet on ThemeContext) ───────
// This matches the original dark palette so existing imports
// don't break while the migration is in progress.
export const colors = darkColors;

// ── Static tokens (same for both modes) ──────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const fontSize = {
  tiny: 10,
  xs:   11,
  sm:   12,
  md:   14,
  base: 15,
  lg:   18,
  xl:   22,
};

export const fonts = {
  regular:    'poppins-regular',
  bold:       'poppins-bold',
  boldItalic: 'poppins-bold-italic',
};

export const letterSpacing = {
  tight:  0.5,
  normal: 1,
  wide:   2,
  wider:  3,
};

// Type alias so screens can type-hint the colors object
export type AppColors = typeof darkColors;