/**
 * Location Screen - Request location permission
 * 
 * Last onboarding step. Explains why location helps.
 * Either button completes onboarding and routes to the completion screen.
 * 
 * Note: Does not request actual OS permissions yet - simulates acceptance.
 */

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton, SecondaryButton } from "../../src/ui/Button";
import { useOnboarding } from "../../src/onboarding-context";

export default function LocationScreen() {
  const router = useRouter();
  const { setOnboardingCompleted } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  async function handleEnableLocation() {
    setIsLoading(true);
    try {
      // TODO: Request actual location permission using expo-location
      // For now, just simulate acceptance
      
      await setOnboardingCompleted();
      router.replace("/(onboarding)/complete");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkip() {
    setIsLoading(true);
    try {
      await setOnboardingCompleted();
      router.replace("/(onboarding)/complete");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        {/* Location icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={64} color={colors.primary} />
        </View>

        {/* Text content */}
        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.body}>
          Allow location access so we can suggest nearby studios and classes 
          that match your preferences.
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.benefitText}>Find studios near you</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.benefitText}>Get personalized recommendations</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.benefitText}>See real-time class availability</Text>
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
          <Text style={styles.privacyText}>
            Your location is only used while the app is open and is never shared.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <PrimaryButton
          title={isLoading ? "Please wait..." : "Enable Location"}
          onPress={handleEnableLocation}
          disabled={isLoading}
        />
        <SecondaryButton
          title="Not now"
          onPress={handleSkip}
          disabled={isLoading}
          style={styles.secondaryButton}
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    // Soft shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  benefitsList: {
    alignSelf: "stretch",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  privacyText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
  buttons: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});
