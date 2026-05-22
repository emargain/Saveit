/**
 * Cookies Screen - First onboarding step
 * 
 * Shows cookie/privacy consent with Accept and Not now options.
 * Both options continue to the next step (about screen).
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton, SecondaryButton } from "../../src/ui/Button";
import { useOnboarding } from "../../src/onboarding-context";

export default function CookiesScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();

  async function handleAccept() {
    await updateProfile({ cookiesAccepted: true });
    router.push("/(onboarding)/about");
  }

  function handleDecline() {
    // Still continue, just don't mark as accepted
    router.push("/(onboarding)/about");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={80} color={colors.primary} />
        </View>

        {/* Text content */}
        <Text style={styles.title}>Cookies and Privacy</Text>
        <Text style={styles.body}>
          We use cookies to improve your experience and personalize content. 
          You can change your preferences at any time in settings.
        </Text>

        {/* Privacy note */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Your data is secure and will never be shared with third parties without your consent.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <PrimaryButton title="Accept" onPress={handleAccept} />
        <SecondaryButton
          title="Not now"
          onPress={handleDecline}
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
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    // Soft shadow
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  buttons: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});
