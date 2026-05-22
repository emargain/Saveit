/**
 * About Screen - Business description
 * 
 * Shows what Saveit is about.
 * Header: Discover the flexibility you deserve
 * Body: Find classes and services near you at a discount in a simple way
 * 
 * Note: Using icon placeholder until transparent gym bag image is available
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton, TextLinkButton } from "../../src/ui/Button";

export default function AboutScreen() {
  const router = useRouter();

  function handleNext() {
    router.push("/(onboarding)/survey-exercise");
  }

  function handleSkip() {
    router.push("/(onboarding)/survey-exercise");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        {/* Illustration placeholder */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationCard}>
            {/* Main bag icon */}
            <View style={styles.bagIcon}>
              <Ionicons name="bag-handle-outline" size={80} color={colors.primary} />
            </View>
            {/* Floating fitness icons */}
            <View style={[styles.floatingIcon, styles.iconYoga]}>
              <Ionicons name="body-outline" size={24} color={colors.primary} />
            </View>
            <View style={[styles.floatingIcon, styles.iconBike]}>
              <Ionicons name="bicycle-outline" size={24} color={colors.primary} />
            </View>
            <View style={[styles.floatingIcon, styles.iconWeight]}>
              <Ionicons name="barbell-outline" size={24} color={colors.primary} />
            </View>
            <View style={[styles.floatingIcon, styles.iconWater]}>
              <Ionicons name="water-outline" size={24} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>Discover the flexibility you deserve</Text>
          <Text style={styles.body}>
            Find classes and services near you at a discount in a simple way
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <PrimaryButton title="Next" onPress={handleNext} />
        <TextLinkButton
          title="Skip"
          onPress={handleSkip}
          style={styles.skipButton}
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
  illustrationContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  illustrationCard: {
    width: 240,
    height: 200,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    // Soft shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bagIcon: {
    marginTop: spacing.md,
  },
  floatingIcon: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.babyBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  iconYoga: {
    top: 20,
    left: 20,
  },
  iconBike: {
    top: 20,
    right: 20,
  },
  iconWeight: {
    bottom: 30,
    left: 30,
  },
  iconWater: {
    bottom: 30,
    right: 30,
  },
  textContent: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  body: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 26,
  },
  buttons: {
    paddingTop: spacing.lg,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: spacing.md,
  },
});
