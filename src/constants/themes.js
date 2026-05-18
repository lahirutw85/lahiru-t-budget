// ============================================================
// THEME CONSTANTS
// ============================================================
// Defines the color palette for DARK and LIGHT modes.
// The active theme is selected in Dashboard.jsx based on
// the `isDarkMode` state toggle.
//
// Usage:
//   const COLORS = isDarkMode ? THEMES.dark : THEMES.light;
//   <div style={{ color: COLORS.textPrimary }}>...</div>
// ============================================================

export const THEMES = {
  // ── Dark Mode ─────────────────────────────────────────────
  dark: {
    skyBlue:      '#4FD1F5', // Primary accent (headings, icons)
    pink:         '#EC8DF5', // Highlight / pie chart segment
    green:        '#A3ECC8', // Income / positive values
    yellow:       '#FFE16A', // Balance / in-hand amounts
    red:          '#EF4444', // Expenses / negative values
    purple:       '#A855F7', // Credit card / savings category
    orange:       '#F59E0B', // Transport / misc category

    bgMain:       '#0B0F19', // Page background (darkest)
    bgCard:       '#151A2D', // Card / panel background
    bgSidebar:    '#0F1322', // Sidebar background

    textPrimary:  '#FFFFFF', // Main text
    textSecondary:'#8B94A6', // Muted / label text

    border:       'rgba(255,255,255,0.05)',  // Card borders
    borderHover:  'rgba(255,255,255,0.1)',   // Hovered border
    activeBg:     'rgba(255,255,255,0.05)',  // Selected/active row
    inputBg:      '#1C2237',                // Form input background
  },

  // ── Light Mode ────────────────────────────────────────────
  light: {
    skyBlue:      '#0284C7',
    pink:         '#D946EF',
    green:        '#059669',
    yellow:       '#D97706',
    red:          '#DC2626',
    purple:       '#7E22CE',
    orange:       '#EA580C',

    bgMain:       '#F4F7FB',
    bgCard:       '#FFFFFF',
    bgSidebar:    '#FFFFFF',

    textPrimary:  '#0F172A',
    textSecondary:'#64748B',

    border:       'rgba(0,0,0,0.08)',
    borderHover:  'rgba(0,0,0,0.12)',
    activeBg:     'rgba(0,0,0,0.04)',
    inputBg:      'rgba(0,0,0,0.03)',
  },
};
