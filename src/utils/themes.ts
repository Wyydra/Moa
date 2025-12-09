/**
 * Theme System for Moa
 * Defines light and dark color palettes
 */

export interface Theme {
  // Primary Brand Colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Secondary Accent Colors
  accent: string;
  accentLight: string;
  
  // Semantic Colors
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // Study Mode Colors
  learn: string;
  test: string;
  write: string;
  match: string;
  
  // Neutral Colors
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  
  // Text Colors
  text: string;
  textMedium: string;
  textLight: string;
  textInverse: string;
  
  // Border & Divider Colors
  border: string;
  borderDark: string;
  divider: string;
  
  // Modal Overlay
  overlay: string;
  
  // Legacy Support (for gradual migration)
  cream: string;
  skyBlue: string;
  mint: string;
  mintGreen: string;
  coral: string;
  gold: string;
  cardBg: string;
}

export const lightTheme: Theme = {
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
  
  // Modal Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Legacy Support (for gradual migration)
  cream: '#FFFBF5',
  skyBlue: '#3B82F6',
  mint: '#10B981',
  mintGreen: '#10B981',
  coral: '#EF4444',
  gold: '#F59E0B',
  cardBg: '#FFFFFF',
};

export const darkTheme: Theme = {
  // Primary Brand Colors - lighter for better contrast on dark
  primary: '#818CF8',        // Lighter indigo for dark mode
  primaryDark: '#6366F1',
  primaryLight: '#A5B4FC',
  
  // Secondary Accent Colors
  accent: '#F472B6',         // Lighter pink
  accentLight: '#F9A8D4',
  
  // Semantic Colors - adjusted for dark mode visibility
  success: '#22C55E',        // Slightly brighter green
  warning: '#FBBF24',        // Brighter amber
  danger: '#F87171',         // Softer red
  info: '#60A5FA',           // Brighter blue
  
  // Study Mode Colors - kept vibrant
  learn: '#A78BFA',          // Lighter purple
  test: '#22C55E',           // Brighter emerald
  write: '#FBBF24',          // Brighter amber
  match: '#F472B6',          // Lighter pink
  
  // Neutral Colors - Zinc palette for dark mode
  background: '#09090B',     // Zinc-950 - ultra dark
  backgroundAlt: '#18181B',  // Zinc-900
  surface: '#27272A',        // Zinc-800 - elevated surface
  surfaceAlt: '#3F3F46',     // Zinc-700 - secondary surface
  
  // Text Colors - inverted for dark mode
  text: '#FAFAFA',           // Zinc-50 - high contrast
  textMedium: '#D4D4D8',     // Zinc-300
  textLight: '#71717A',      // Zinc-500
  textInverse: '#18181B',    // Dark text on light backgrounds
  
  // Border & Divider Colors - subtle in dark mode
  border: '#3F3F46',         // Zinc-700
  borderDark: '#52525B',     // Zinc-600
  divider: '#27272A',        // Zinc-800
  
  // Modal Overlay - darker for dark mode
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Legacy Support
  cream: '#3F3F46',          // Adapted to dark
  skyBlue: '#60A5FA',
  mint: '#22C55E',
  mintGreen: '#22C55E',
  coral: '#F87171',
  gold: '#FBBF24',
  cardBg: '#27272A',
};
