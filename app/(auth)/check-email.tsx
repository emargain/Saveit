/**
 * Check-email screen — shown after signup while waiting for the user to
 * confirm their email. Static stub for MVP; no resend or polling yet.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTranslation } from "../../src/localization/hooks";
import { PrimaryButton } from "../../src/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "../../src/ui/theme";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { t } = useAppTranslation("auth");
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{t("checkEmail.title")}</Text>
            <Text style={styles.subtitle}>
              {t("checkEmail.body", { email: email ?? "" })}
            </Text>
            <View style={styles.actions}>
              <PrimaryButton
                title={t("checkEmail.backToLogin")}
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.babyBlue },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.sm,
  },
});
