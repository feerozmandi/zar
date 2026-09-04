/**
 * Design Tokens & Brand Colors for Zar Noor Niroo Yekta / Xennic Platform
 */
export const XENNIC_THEME = {
  colors: {
    primary: {
      gold: '#F59E0B',      // Solar Gold / نور زر
      goldLight: '#FEF3C7',
      goldDark: '#D97706',
    },
    brand: {
      navy: '#0B132B',      // Industrial Deep Navy
      slate: '#1C2541',
      cyan: '#48CAE4',
    },
    energy: {
      emerald: '#10B981',   // Clean Solar Energy Green
      emeraldLight: '#D1FAE5',
      ruby: '#EF4444',      // Penalty / Reactive Alert Red
      rubyLight: '#FEE2E2',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  typography: {
    fontFamilyFa: 'Vazirmatn, system-ui, -apple-system, sans-serif',
    fontFamilyEn: 'Inter, system-ui, sans-serif',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
} as const;
