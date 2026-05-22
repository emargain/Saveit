/**
 * Favorites Screen - Shows saved favorite partners.
 * List of favorited partners or empty state with CTA to Discover.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useAppTranslation } from "../../src/localization/hooks";
import { useMarketplacePartners } from "../../src/hooks/useMarketplacePartners";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../src/ui/theme";
import type { PartnerCategory } from "../../src/data/partners";
import { PartnerCard } from "../../src/components/PartnerCard";
import { useFavorites } from "../../src/state/favorites";

function categoryLabel(category: PartnerCategory, t: (k: string) => string) {
  return t(`discover.categories.${category}`);
}

export default function FavoritesScreen() {
  const { t } = useAppTranslation("customer");
  const router = useRouter();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { partners: marketplacePartners } = useMarketplacePartners();

  const favoritePartners = useMemo(
    () => marketplacePartners.filter((p) => favoriteIds.includes(p.id)),
    [favoriteIds, marketplacePartners]
  );

  const isEmpty = favoritePartners.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("favorites.title")}</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptyStateWrapper}>
          <View style={styles.emptyState}>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="heart-outline" size={52} color={colors.primary} />
              </View>
              <View style={styles.starDecor1}>
                <Ionicons name="star" size={16} color={colors.secondary} />
              </View>
              <View style={styles.starDecor2}>
                <Ionicons name="star" size={12} color={colors.primary} />
              </View>
              <View style={styles.dotDecor} />
            </View>

            <Text style={styles.emptyTitle}>{t("favorites.emptyTitle")}</Text>
            <Text style={styles.emptyDescription}>{t("favorites.emptyDesc")}</Text>

            <View style={styles.hintCard}>
              <View style={styles.hintCardContent}>
                <View style={styles.hintImagePlaceholder}>
                  <Ionicons name="business-outline" size={24} color={colors.textMuted} />
                </View>
                <View style={styles.hintTextContainer}>
                  <View style={styles.hintTitleRow}>
                    <View style={styles.hintTitlePlaceholder} />
                    <View style={styles.hintPricePlaceholder} />
                  </View>
                  <View style={styles.hintSubtitlePlaceholder} />
                </View>
              </View>
              <View style={styles.heartIconContainer}>
                <Ionicons name="heart" size={18} color={colors.error} />
              </View>
              <View style={styles.tapHint}>
                <Ionicons name="arrow-up" size={14} color={colors.primary} />
                <Text style={styles.tapHintText}>{t("favorites.tapHint")}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={() => router.push("/(tabs)/discover")}
              hitSlop={4}
            >
              <Ionicons name="compass-outline" size={20} color={colors.white} />
              <Text style={styles.ctaButtonText}>{t("favorites.browse")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {favoritePartners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                isFavorite={isFavorite(partner.id)}
                onToggleFavorite={() => toggleFavorite(partner.id)}
                onPress={() => router.push(`/partner/${partner.id}` as import("expo-router").Href)}
                categoryDisplay={categoryLabel(partner.category, t)}
                fromPriceLabel={t("partnerCard.from", { price: partner.priceFrom })}
                discountLabel={t("partnerCard.off", { percent: partner.discountPercent })}
                distanceLabel={t("partnerCard.km", { n: partner.distanceKm })}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  cardsContainer: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Empty state - centered
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  // Illustration
  illustrationContainer: {
    marginBottom: spacing.xl,
    position: "relative",
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  starDecor1: {
    position: "absolute",
    top: -8,
    right: -10,
  },
  starDecor2: {
    position: "absolute",
    bottom: 8,
    left: -14,
    opacity: 0.5,
  },
  dotDecor: {
    position: "absolute",
    top: 20,
    left: -6,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },

  // Text
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },

  // Hint card
  hintCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
    position: "relative",
  },
  hintCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  hintImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  hintTextContainer: {
    flex: 1,
  },
  hintTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  hintTitlePlaceholder: {
    width: 100,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
  },
  hintPricePlaceholder: {
    width: 44,
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryLight,
  },
  hintSubtitlePlaceholder: {
    width: 70,
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.borderLight,
  },
  heartIconContainer: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.soft,
  },
  tapHint: {
    position: "absolute",
    top: spacing.md + 40,
    right: spacing.md + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tapHintText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // CTA - min 48px height
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    gap: spacing.sm,
    ...shadow.elevated,
  },
  ctaButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
