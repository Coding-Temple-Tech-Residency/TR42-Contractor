/**
 * constants/theme.ts — Design tokens for Troy's screens
 *
 * Single source of truth for colors, spacing, typography, and
 * border-radius across all Field Force auth and profile screens.
 *
 * Usage:
 *   import { colors, spacing, fontSize, fonts } from '../constants/theme';
 *
 * Font keys must match the keys registered in utils/LoadFonts.tsx.
 */

// ── Colors ───────────────────────────────────────────────────
export const colors = {
  // Backgrounds — dark navy palette from the approved screenshots
  background:  '#0a0e1a',
  card:        '#1c2330',
  cardAlt:     '#2d3544',
  cardHover:   '#3d4554',

  // Brand — orange primary accent
  primary:      '#ff8c00',
  primaryDark:  '#ff6b00',
  primaryLight: '#ffa000',
  primaryFaint: 'rgba(255,140,0,0.10)',

  // Text
  textWhite:    '#ffffff',
  textLight:    '#d1d5db',
  textMuted:    '#6b7280',
  textDisabled: '#4b5563',

  // Borders
  border:       '#2d3544',
  borderActive: '#ff8c00',
  borderHover:  '#3d4554',

  // Status
  success:     '#34d399',
  successDot:  '#10b981',
  warning:     '#f59e0b',
  error:       '#f87171',
  errorTitle:  '#fca5a5',
  errorBg:     'rgba(127,29,29,0.30)',
  errorBorder: 'rgba(153,27,27,0.60)',
  errorIcon:   'rgba(127,29,29,0.40)',
};

// ── Spacing ──────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
  xxl: 48,
};

// ── Border radius ────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};

// ── Font sizes ───────────────────────────────────────────────
export const fontSize = {
  tiny: 10,
  xs:   11,
  sm:   12,
  md:   14,
  base: 15,
  lg:   18,
  xl:   22,
};

// ── Letter spacing ───────────────────────────────────────────
export const letterSpacing = {
  tight:  0.5,
  normal: 1,
  wide:   2,
  wider:  3,
};

// ── Font families — must match keys in utils/LoadFonts.tsx ───
export const fonts = {
  regular:    'poppins-regular',
  bold:       'poppins-bold',
  italic:     'poppins-italic',
  boldItalic: 'poppins-bolditalic',
};