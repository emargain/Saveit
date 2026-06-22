/**
 * Customer Profile — user info, preferences, analytics, sign out.
 * No role switching, no partner logic.
 */

import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, radius } from "../../src/ui/theme";
import { PrimaryButton } from "../../src/ui/Button";
import { useAuth } from "../../src/auth-context";
import { useAppTranslation } from "../../src/localization/hooks";
import { useOnboarding } from "../../src/onboarding-context";
import { useMarketplacePartners } from "../../src/hooks/useMarketplacePartners";
import type { Partner } from "../../src/types/partner";
import { useViews } from "../../src/state/views";

const EXERCISE_LABELS: Record<string, string> = {
  yoga: "Yoga", pilates: "Pilates", cycling: "Cycling",
  hiit: "HIIT", outdoor: "Outdoor", other: "Other",
};

const REASON_LABELS: Record<string, string> = {
  "saving-money": "Saving money", flexibility: "Flexibility", discovering: "Discovering studios",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { userEmail, signOut } = useAuth();
  const { t } = useAppTranslation("customer");
  const { profile } = useOnboarding();
  const { partners } = useMarketplacePartners();
  const { getTopViewedIds, getViewCount } = useViews();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const topViewedIds = getTopViewedIds(5);
  const topViewedPartners = topViewedIds
    .map((id) => partners.find((p) => p.id === id))
    .filter((p): p is Partner => p != null);
  const totalViewCount = topViewedIds.reduce((sum, id) => sum + getViewCount(id), 0);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  const exerciseDisplay = profile.exerciseTypes.length > 0
    ? profile.exerciseTypes.map((id) => EXERCISE_LABELS[id] || id).join(", ")
    : t("profile.notSet");

  const frequencyDisplay = profile.frequency !== null
    ? t("profile.frequencyValue", { count: profile.frequency })
    : t("profile.notSet");

  const reasonsDisplay = profile.reasons.length > 0
    ? profile.reasons.map((id) => REASON_LABELS[id] || id).join(", ")
    : t("profile.notSet");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("profile.title")}</Text>

        {/* User info */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text style={styles.email}>{userEmail || t("profile.noEmail")}</Text>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>{t("profile.preferences")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("profile.exerciseTypes")}</Text>
              <Text style={styles.infoValue}>{exerciseDisplay}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("profile.frequency")}</Text>
              <Text style={styles.infoValue}>{frequencyDisplay}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("profile.whySaveit")}</Text>
              <Text style={styles.infoValue}>{reasonsDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Analytics */}
        <Text style={styles.sectionTitle}>{t("profile.analytics")}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t("profile.partnerViews")}</Text>
              <Text style={styles.infoValue}>
                {t("profile.viewsTotal", { count: totalViewCount })}
              </Text>
            </View>
          </View>
          {topViewedPartners.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.infoLabel}>{t("profile.mostViewed")}</Text>
              {topViewedPartners.map((p) => (
                <View key={p.id} style={styles.analyticsRow}>
                  <Text style={styles.analyticsName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.analyticsCount}>
                    {t("profile.viewsCount", { count: getViewCount(p.id) })}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Settings */}
        <PrimaryButton
          title={t("profile.openSettings")}
          onPress={() => router.push("/settings")}
          style={{ marginBottom: spacing.md }}
        />

        {/* Sign out */}
        <View style={styles.signOutContainer}>
          <PrimaryButton
            title={isSigningOut ? t("profile.signingOut") : t("profile.signOut")}
            onPress={handleSignOut}
            disabled={isSigningOut}
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.babyBlue },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.babyBlue,
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: spacing.md,
  },
  email: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text, textAlign: "center" },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  infoIcon: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.babyBlue,
    justifyContent: "center", alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
  infoValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  analyticsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  analyticsName: { flex: 1, fontSize: fontSize.sm, color: colors.text, marginRight: spacing.sm },
  analyticsCount: { fontSize: fontSize.sm, color: colors.textMuted },
  signOutContainer: { marginTop: spacing.lg },
  signOutButton: { backgroundColor: colors.error },
});
