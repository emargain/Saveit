/**
 * Survey Reasons Screen - Reason for using Saveit
 * 
 * Multi-select options:
 * - Saving money for exercising
 * - Flexibility in my workouts
 * - Discovering different studios
 * 
 * Stores selection in onboarding profile.
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton } from "../../src/ui/Button";
import { useOnboarding } from "../../src/onboarding-context";

const REASON_OPTIONS = [
  {
    id: "saving-money",
    label: "Saving money for exercising",
    icon: "wallet-outline",
  },
  {
    id: "flexibility",
    label: "Flexibility in my workouts",
    icon: "time-outline",
  },
  {
    id: "discovering",
    label: "Discovering different studios",
    icon: "compass-outline",
  },
] as const;

export default function SurveyReasonsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useOnboarding();
  
  // Initialize with existing selections if any
  const [selected, setSelected] = useState<string[]>(profile.reasons);

  function toggleOption(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

  function handleBack() {
    router.back();
  }

  async function handleNext() {
    // Save reasons to profile
    await updateProfile({ reasons: selected });
    router.push("/(onboarding)/location");
  }

  const canContinue = selected.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Why are you using Saveit?</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {REASON_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                onPress={() => toggleOption(option.id)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={isSelected ? colors.white : colors.primary}
                  />
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Next button */}
      <View style={styles.buttons}>
        <PrimaryButton
          title="Next"
          onPress={handleNext}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.white,
    gap: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(11, 95, 165, 0.05)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(11, 95, 165, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttons: {
    paddingTop: spacing.lg,
  },
});
