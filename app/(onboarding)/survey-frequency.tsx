/**
 * Survey Frequency Screen - Exercise frequency selection
 * 
 * Slider from 1 to 7 days per week.
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

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function SurveyFrequencyScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useOnboarding();
  
  // Initialize with existing selection or default to 3
  const [frequency, setFrequency] = useState(profile.frequency || 3);

  function handleBack() {
    router.back();
  }

  async function handleNext() {
    // Save frequency to profile
    await updateProfile({ frequency });
    router.push("/(onboarding)/survey-reasons");
  }

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
        <Text style={styles.title}>
          How many times a week are you planning on exercising?
        </Text>

        {/* Frequency selector */}
        <View style={styles.selectorContainer}>
          <View style={styles.selector}>
            {FREQUENCY_OPTIONS.map((num) => {
              const isSelected = frequency === num;
              return (
                <Pressable
                  key={num}
                  onPress={() => setFrequency(num)}
                  style={[
                    styles.frequencyButton,
                    isSelected && styles.frequencyButtonSelected,
                  ]}
                >
                  <Text style={[
                    styles.frequencyNumber,
                    isSelected && styles.frequencyNumberSelected,
                  ]}>
                    {num}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Labels */}
          <View style={styles.labels}>
            <Text style={styles.labelText}>1 day</Text>
            <Text style={styles.labelText}>7 days</Text>
          </View>
        </View>

        {/* Selected value display */}
        <View style={styles.valueDisplay}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <Text style={styles.valueText}>
            Selected: <Text style={styles.valueHighlight}>{frequency} {frequency === 1 ? "day" : "days"}</Text> per week
          </Text>
        </View>
      </View>

      {/* Next button */}
      <View style={styles.buttons}>
        <PrimaryButton title="Next" onPress={handleNext} />
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
    marginBottom: spacing.xxl,
    lineHeight: 40,
  },
  selectorContainer: {
    marginBottom: spacing.xl,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
  },
  frequencyButtonSelected: {
    backgroundColor: colors.primary,
  },
  frequencyNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  frequencyNumberSelected: {
    color: colors.white,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  labelText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  valueText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  valueHighlight: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  buttons: {
    paddingTop: spacing.lg,
  },
});
