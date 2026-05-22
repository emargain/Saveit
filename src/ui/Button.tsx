/**
 * Saveit Design System - Button Components
 * 
 * Three button variants:
 * - PrimaryButton: Pill-shaped filled button for main actions
 * - SecondaryButton: Pill-shaped outlined button for secondary actions
 * - TextLinkButton: Text link for inline navigation
 */

import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "./theme";

// Props that buttons accept
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Primary Button - Pill-shaped filled button for main actions
 * 
 * Example:
 * <PrimaryButton title="Log in" onPress={handleLogin} />
 */
export function PrimaryButton({ title, onPress, disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.baseButton,
        styles.primaryButton,
        pressed && !disabled && styles.primaryPressed,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      <Text style={[styles.primaryText, disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * Secondary Button - Pill-shaped outlined button for secondary actions
 * 
 * Example:
 * <SecondaryButton title="Not now" onPress={handleSkip} />
 */
export function SecondaryButton({ title, onPress, disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.baseButton,
        styles.secondaryButton,
        pressed && !disabled && styles.secondaryPressed,
        disabled && styles.disabledSecondary,
        style,
      ]}
    >
      <Text style={[styles.secondaryText, disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * Text Link Button - For inline links
 * 
 * Example:
 * <TextLinkButton title="Sign up" onPress={goToSignup} />
 */
export function TextLinkButton({ title, onPress, disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pressed && styles.linkPressed,
        style,
      ]}
    >
      <Text style={[styles.linkText, disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Base styles for pill-shaped buttons
  baseButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full, // Pill shape
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },

  // Primary button styles (filled pill)
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadow.soft,
  },
  primaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Secondary button styles (outlined pill)
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryPressed: {
    backgroundColor: colors.secondaryLight,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  disabledSecondary: {
    borderColor: colors.border,
    backgroundColor: "transparent",
  },

  // Link button styles
  linkPressed: {
    opacity: 0.7,
  },
  linkText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Disabled state
  disabledButton: {
    backgroundColor: colors.border,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
