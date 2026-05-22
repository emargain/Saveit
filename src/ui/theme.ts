/**
 * Saveit Design System - Theme Constants
 * 
 * This file contains all the shared styling values used throughout the app.
 * Import these values to keep the design consistent across all screens.
 */

export const colors = {
  // Primary brand colors
  primary: "#0D7377",           // Deep green teal - main brand color
  primaryLight: "#14919B",      // Lighter teal for hover/active states
  primaryDark: "#0A5C5F",       // Darker teal for pressed states
  
  // Secondary colors
  secondary: "#8FD9A8",         // Light green - accents and highlights
  secondaryLight: "#C4EED1",    // Very light green - subtle backgrounds
  
  // Background colors
  background: "#FFFFFF",        // White - main background
  backgroundAlt: "#F8FAFA",     // Off-white - alternate sections
  babyBlue: "#CFE9FF",          // Baby blue - onboarding screens
  
  // Text colors
  text: "#1A2E35",              // Dark teal-gray - primary text
  textMuted: "#6B7B82",         // Soft gray - secondary text
  textLight: "#9CA8AE",         // Light gray - placeholder text
  
  // Neutral colors
  white: "#FFFFFF",
  black: "#000000",
  
  // UI colors
  border: "#E5EAEC",            // Light gray - borders
  borderLight: "#F0F4F5",       // Very light - subtle dividers
  card: "#FFFFFF",              // White - card backgrounds
  
  // Status colors
  error: "#DC2626",             // Red - error messages
  success: "#16A34A",           // Green - success messages
  warning: "#F59E0B",           // Amber - warnings
  
  // Shadow color
  shadow: "#1A2E35",            // For box shadows
};

export const spacing = {
  xs: 4,      // Extra small - tight spacing
  sm: 8,      // Small - compact spacing
  md: 16,     // Medium - default spacing
  lg: 24,     // Large - comfortable spacing
  xl: 32,     // Extra large - section spacing
  xxl: 48,    // Extra extra large - major sections
};

export const radius = {
  sm: 8,      // Small - subtle rounding
  md: 12,     // Medium - default rounding (cards, inputs)
  lg: 16,     // Large - prominent rounding (larger cards)
  xl: 24,     // Extra large - very rounded
  full: 9999, // Full - pill shape (buttons, badges)
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const shadow = {
  // Subtle shadow for cards
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Medium shadow for elevated elements
  elevated: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  // Soft shadow for floating elements
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
};
