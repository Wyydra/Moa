export const COLORS = {
  // Primary Brand Colors
  primary: '#6366F1',        // Vibrant indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Secondary Accent Colors
  accent: '#EC4899',         // Pink accent
  accentLight: '#F472B6',
  
  // Semantic Colors
  success: '#10B981',        // Emerald green
  warning: '#F59E0B',        // Amber
  danger: '#EF4444',         // Red
  info: '#3B82F6',           // Blue
  
  // Study Mode Colors
  learn: '#8B5CF6',          // Purple
  test: '#10B981',           // Emerald
  write: '#F59E0B',          // Amber
  match: '#EC4899',          // Pink
  
  // Neutral Colors
  background: '#FAFAFA',     // Off-white with warmth
  backgroundAlt: '#F5F5F7',  // Slightly darker alternative
  surface: '#FFFFFF',        // Pure white for cards
  surfaceAlt: '#F9FAFB',     // Subtle gray for secondary surfaces
  
  // Text Colors
  text: '#18181B',           // Near black, warmer
  textMedium: '#52525B',     // Medium gray
  textLight: '#A1A1AA',      // Light gray
  textInverse: '#FFFFFF',    // White text
  
  // Border & Divider Colors
  border: '#E4E4E7',         // Light gray border
  borderDark: '#D4D4D8',     // Darker border
  divider: '#F4F4F5',        // Very subtle divider
  
  // Legacy Support (for gradual migration)
  cream: '#FFFBF5',
  skyBlue: '#3B82F6',
  mint: '#10B981',
  mintGreen: '#10B981',
  coral: '#EF4444',
  gold: '#F59E0B',
  cardBg: '#FFFFFF',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    huge: 34,
    display: 42,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadow definitions
// Note: On Android, elevation may clip rounded corners slightly
// This is a known React Native limitation with the elevation API
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  }),
};
