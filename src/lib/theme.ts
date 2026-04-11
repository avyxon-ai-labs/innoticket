/**
 * Centralized design-system tokens as JS constants.
 * These mirror the CSS variables in index.css.
 * Use for chart libs, canvas, dynamic styles, or anywhere CSS vars are inaccessible.
 */

export const colors = {
  sage:        '#4A7C59',
  sageLight:   '#EBF2ED',
  sageMid:     '#C5DBC9',
  ink:         '#0F1117',
  inkMid:      '#3D4151',
  inkLight:    '#6B7280',
  ghost:       '#F7F7F5',
  white:       '#FFFFFF',
  border:      '#E8E8E4',
  amber:       '#D97706',
  amberLight:  '#FEF3C7',
  red:         '#DC2626',
  redLight:    '#FEE2E2',
  blue:        '#2563EB',
  blueLight:   '#EFF6FF',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(15,17,23,0.04)',
  md: '0 6px 24px rgba(15,17,23,0.07)',
  lg: '0 24px 80px rgba(15,17,23,0.18)',
} as const;

export const font = {
  sans:    "'DM Sans', system-ui, sans-serif",
  display: "'Fraunces', Georgia, serif",
  mono:    "'DM Mono', ui-monospace, monospace",
} as const;

export const transition = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
} as const;

// ── Badge / status config ────────────────────────────────────────────────────
export const badgeConfig = {
  open:          { bg: '#EFF6FF', text: '#2563EB', label: 'Open' },
  'in-progress': { bg: '#EBF2ED', text: '#4A7C59', label: 'In Progress' },
  resolved:      { bg: '#EBF2ED', text: '#4A7C59', label: 'Resolved' },
  closed:        { bg: '#F7F7F5', text: '#6B7280', label: 'Closed' },
  pending:       { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  failed:        { bg: '#FEE2E2', text: '#DC2626', label: 'Failed' },
  delivered:     { bg: '#EBF2ED', text: '#4A7C59', label: 'Delivered' },
  transit:       { bg: '#EFF6FF', text: '#2563EB', label: 'In Transit' },
  high:          { bg: '#FEE2E2', text: '#DC2626', label: 'High' },
  medium:        { bg: '#FEF3C7', text: '#D97706', label: 'Medium' },
  low:           { bg: '#EBF2ED', text: '#4A7C59', label: 'Low' },
} as const;

export type BadgeVariant = keyof typeof badgeConfig;

const theme = { colors, radius, shadow, font, transition, badgeConfig };
export default theme;
