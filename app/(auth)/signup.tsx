/**
 * Signup screen — customer only. No role chips, no partner/admin routing.
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, fontWeight } from "../../src/ui/theme";
import { PrimaryButton, TextLinkButton } from "../../src/ui/Button";
import { Input } from "../../src/ui/Input";
import { useAuth } from "../../src/auth-context";
import { useOnboarding } from "../../src/onboarding-context";
import { useAppTranslation } from "../../src/localization/hooks";

function mapSignupError(raw: string, t: (k: string) => string): string {
  if (raw === "User already registered") return t("errors.emailAlreadyRegistered");
  if (raw.includes("Password should be at least")) return t("errors.passwordTooWeak");
  if (/rate limit/i.test(raw)) return t("errors.rateLimited");
  return raw;
}

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { t } = useAppTranslation("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate() {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!email.includes("@")) newErrors.email = t("errors.emailInvalid");
    if (password.length < 8) newErrors.password = t("errors.passwordShort");
    if (password !== confirmPassword) newErrors.confirmPassword = t("errors.passwordMismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp(email, password, "customer");
      if (!result.ok) {
        setSubmitError(mapSignupError(result.error, t));
        return;
      }
      if (result.requiresEmailConfirmation) {
        router.replace({
          pathname: "/(auth)/check-email" as never,
          params: { email },
        });
        return;
      }
      await resetOnboarding();
      router.replace("/(onboarding)/cookies");
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <View style={styles.header}>
              <Text style={styles.title}>{t("signupTitle")}</Text>
              <Text style={styles.subtitle}>{t("signupSubtitle")}</Text>
            </View>

            <View style={styles.form}>
              <Input
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email}
              />
              <Input
                label={t("password")}
                placeholder={t("passwordCreatePlaceholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                error={errors.password}
              />
              <Input
                label={t("confirmPassword")}
                placeholder={t("confirmPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
              {submitError && (
                <Text style={styles.submitError}>{submitError}</Text>
              )}
              <PrimaryButton
                title={isSubmitting ? t("creatingAccount") : t("createAccount")}
                onPress={handleSignUp}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("haveAccount")} </Text>
              <TextLinkButton
                title={t("logInLink")}
                onPress={() => router.push("/(auth)/login")}
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
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl, justifyContent: "center" },
  header: { marginBottom: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, textAlign: "center", marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  form: { gap: spacing.sm },
  submitError: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: fontSize.sm },
});
