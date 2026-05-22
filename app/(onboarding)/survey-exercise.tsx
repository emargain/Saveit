/**
 * Survey Exercise Screen - Exercise type selection
 * 
 * Multi-select chips for: Yoga, Pilates, Cycling, HIIT, Outdoor, Other
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

const EXERCISE_OPTIONS = [
  { id: "yoga", label: "Yoga", icon: "body-outline" },
  { id: "pilates", label: "Pilates", icon: "fitness-outline" },
  { id: "cycling", label: "Cycling", icon: "bicycle-outline" },
  { id: "hiit", label: "HIIT", icon: "flash-outline" },
  { id: "outdoor", label: "Outdoor", icon: "leaf-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
] as const;

export default function SurveyExerciseScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useOnboarding();
  
  // Initialize with existing selections if any
  const [selected, setSelected] = useState<string[]>(profile.exerciseTypes);

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
    // Save selections to profile
    await updateProfile({ exerciseTypes: selected });
    router.push("/(onboarding)/survey-frequency");
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
        <Text style={styles.title}>Tell us about your goals</Text>
        <Text style={styles.subtitle}>
          Let us help you achieve your dreams by telling us a little about yourself
        </Text>

        <Text style={styles.question}>What type of exercise are you looking to do?</Text>
        <Text style={styles.helper}>Select all that apply</Text>

        {/* Chips */}
        <View style={styles.chipsContainer}>
          {EXERCISE_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                onPress={() => toggleOption(option.id)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={isSelected ? colors.white : colors.primary}
                />
                <Text style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                )}
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
    lineHeight: 22,
  },
  question: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helper: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  buttons: {
    paddingTop: spacing.lg,
  },
});
