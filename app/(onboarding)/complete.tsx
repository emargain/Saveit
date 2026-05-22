/**
 * Shown after customer onboarding finishes.
 * "Continue" goes to customer tabs. "Back to sign in" signs out.
 */

import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth-context";
import { useAppTranslation } from "../../src/localization/hooks";
import { PrimaryButton, SecondaryButton } from "../../src/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "../../src/ui/theme";

export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useAppTranslation("customer");
  const { t: tc } = useAppTranslation("common");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("onboardingComplete.title")}</Text>
        <Text style={styles.body}>{t("onboardingComplete.body")}</Text>
      </View>
      <View style={styles.buttons}>
        <PrimaryButton
          title={t("onboardingComplete.continueApp")}
          onPress={() => router.replace("/(tabs)")}
        />
        <SecondaryButton
          title={tc("backToSignIn")}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.babyBlue, padding: spacing.lg, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: "center", marginBottom: spacing.md },
  body: { fontSize: fontSize.md, color: colors.textMuted, textAlign: "center", lineHeight: 24 },
  buttons: { gap: spacing.sm, paddingTop: spacing.lg },
});
