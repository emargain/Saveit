/**
 * Login — role chips hidden when `authIntentRole` is set (after Profile “switch role”).
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton, TextLinkButton } from "../../src/ui/Button";
import { Input } from "../../src/ui/Input";
import { useAuth } from "../../src/auth-context";
import { useAppTranslation } from "../../src/localization/hooks";
import type { UserRole } from "../../src/types/domain";

function mapSignInError(raw: string, t: (k: string) => string): string {
  if (raw === "Invalid login credentials") return t("errors.invalidCredentials");
  if (raw === "Email not confirmed") return t("errors.emailNotConfirmed");
  if (/rate limit/i.test(raw)) return t("errors.rateLimited");
  return raw;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, authIntentRole, clearAuthIntent } = useAuth();
  const { t } = useAppTranslation("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const intentLocksRole =
    !showAllRoles &&
    (authIntentRole === "customer" || authIntentRole === "partner" || authIntentRole === "admin");

  useEffect(() => {
    if (authIntentRole === "customer" || authIntentRole === "partner" || authIntentRole === "admin") {
      setRole(authIntentRole);
    }
  }, [authIntentRole]);

  function validate() {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.includes("@")) {
      newErrors.email = t("errors.emailInvalid");
    }

    if (password.length < 8) {
      newErrors.password = t("errors.passwordShort");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn(email, password, role);
      if (!result.ok) {
        setSubmitError(mapSignInError(result.error, t));
        return;
      }
      router.replace("/");
    } finally {
      setIsSubmitting(false);
    }
  }

  function continueTitle(): string {
    if (authIntentRole === "partner") return t("continueAsPartner");
    if (authIntentRole === "customer") return t("continueAsCustomer");
    if (authIntentRole === "admin") return t("continueAsAdmin");
    return t("loginTitle");
  }

  function continueSubtitle(): string {
    if (authIntentRole === "partner") return t("authIntentSubtitlePartner");
    if (authIntentRole === "customer") return t("authIntentSubtitleCustomer");
    if (authIntentRole === "admin") return t("authIntentSubtitleAdmin");
    return t("loginSubtitle");
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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={styles.logoText}>Saveit</Text>
            </View>
          </View>

          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationPlaceholder}>
              <Ionicons name="fitness-outline" size={48} color={colors.primary} />
              <Ionicons name="bicycle-outline" size={36} color={colors.primary} style={styles.iconOffset1} />
              <Ionicons name="barbell-outline" size={36} color={colors.primary} style={styles.iconOffset2} />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.intentBanner}>
              <Text style={styles.title}>{continueTitle()}</Text>
              <Text style={styles.subtitle}>{continueSubtitle()}</Text>
            </View>

            <View style={styles.form}>
              {!intentLocksRole && (
                <>
                  <Text style={styles.roleLabel}>{t("accountType")}</Text>
                  <View style={styles.roleRow}>
                    {(
                      [
                        ["customer", t("roleCustomer")],
                        ["partner", t("rolePartner")],
                        ...(__DEV__ ? ([["admin", "Admin"]] as const) : []),
                      ] as const
                    ).map(([r, label]) => (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        style={[styles.roleChip, role === r && styles.roleChipOn]}
                      >
                        <Text style={[styles.roleChipText, role === r && styles.roleChipTextOn]}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {intentLocksRole && (
                <Pressable
                  onPress={async () => {
                    await clearAuthIntent();
                    setShowAllRoles(true);
                  }}
                  style={styles.changeIntentLink}
                >
                  <Text style={styles.changeIntentText}>{t("chooseRoleInstead")}</Text>
                </Pressable>
              )}

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
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                error={errors.password}
              />

              {submitError && (
                <Text style={styles.submitError}>{submitError}</Text>
              )}

              <PrimaryButton
                title={isSubmitting ? t("signingIn") : t("logIn")}
                onPress={handleSignIn}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("noAccount")} </Text>
              <TextLinkButton
                title={t("signUpLink")}
                onPress={() => router.push("/(auth)/signup")}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logoText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  illustrationContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconOffset1: {
    position: "absolute",
    top: 30,
    right: 30,
  },
  iconOffset2: {
    position: "absolute",
    bottom: 40,
    left: 35,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  intentBanner: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
  },
  submitError: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  roleLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  roleChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  roleChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.secondaryLight,
  },
  roleChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  roleChipTextOn: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  changeIntentLink: {
    alignSelf: "center",
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  changeIntentText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    textDecorationLine: "underline",
  },
});
