/**
 * Saveit Design System - Input Components
 * 
 * Styled text input with optional label for forms.
 */

import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, spacing, radius, fontSize, fontWeight } from "./theme";

// Props for our Input component
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Input - Rounded text input with optional label and error message
 * 
 * Example:
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 * />
 * 
 * With error:
 * <Input
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 *   error="Password must be at least 8 characters"
 * />
 */
export function Input({ label, error, style, ...textInputProps }: InputProps) {
  return (
    <View style={styles.container}>
      {/* Optional label above the input */}
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* The text input field */}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...textInputProps}
      />
      
      {/* Optional error message below the input */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: spacing.md,
  },
  
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 52,
  },
  
  inputError: {
    borderColor: colors.error,
  },
  
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
