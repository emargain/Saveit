/**
 * Discover Screen - Browse available last-minute spots and deals
 *
 * Structure:
 * 1. Location selector dropdown
 * 2. Category filter pills
 * 3. Partner cards (studios, salons, courts)
 * 4. Empty state when no items (centered, friendly)
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PartnerCard } from "../../src/components/PartnerCard";
import type { Partner, PartnerCategory } from "../../src/data/partners";
import { useMarketplacePartners } from "../../src/hooks/useMarketplacePartners";
import { useAppTranslation } from "../../src/localization/hooks";
import { useFavorites } from "../../src/state/favorites";
import { useFilters } from "../../src/state/filters";
import { useLocation } from "../../src/state/location";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../src/ui/theme";

type SortId = "relevance" | "distance" | "discount" | "rating";

function categoryLabelFor(
  category: PartnerCategory,
  t: (k: string) => string
): string {
  return t(`discover.categories.${category}`);
}

function matchesSearch(partner: Partner, query: string, catLabel: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (partner.name.toLowerCase().includes(q)) return true;
  if (partner.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  if (catLabel.toLowerCase().includes(q)) return true;
  return false;
}

export default function DiscoverScreen() {
  const { t } = useAppTranslation("customer");
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortId>("relevance");
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { matchesFilters } = useFilters();
  const { currentLocation } = useLocation();
  const { partners: marketplacePartners, loading: partnersLoading } = useMarketplacePartners();

  const categories = useMemo(
    () => [
      { id: "all", label: t("discover.categories.all") },
      { id: "fitness", label: t("discover.categories.fitness") },
      { id: "padel", label: t("discover.categories.padel") },
      { id: "beauty", label: t("discover.categories.beauty") },
      { id: "wellness", label: t("discover.categories.wellness") },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () =>
      [
        { id: "relevance" as const, label: t("discover.sortRelevance") },
        { id: "distance" as const, label: t("discover.sortDistance") },
        { id: "discount" as const, label: t("discover.sortDiscount") },
        { id: "rating" as const, label: t("discover.sortRating") },
      ] as const,
    [t]
  );

  const displayedPartners = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? marketplacePartners
        : marketplacePartners.filter((p) => p.category === selectedCategory);
    const bySearch = searchQuery.trim()
      ? byCategory.filter((p) =>
          matchesSearch(p, searchQuery, categoryLabelFor(p.category, t))
        )
      : byCategory;
    const byFilters = bySearch.filter((p) => matchesFilters(p));
    const sorted = [...byFilters];
    if (sortBy === "distance") {
      sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === "discount") {
      sorted.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (sortBy === "rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
  }, [selectedCategory, searchQuery, sortBy, matchesFilters, marketplacePartners, t]);

  const isEmpty = !partnersLoading && displayedPartners.length === 0;
  const sortLabel =
    sortOptions.find((o) => o.id === sortBy)?.label ?? t("discover.sortRelevance");
  const emptyHeadline =
    marketplacePartners.length > 0
      ? t("discover.emptyTitle")
      : t("discover.emptyBookedTitle");
  const emptyCopy =
    marketplacePartners.length > 0
      ? t("discover.emptySubtitle")
      : t("discover.emptyBookedDesc");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Location Selector - tap to open picker */}
      <Pressable
        style={styles.locationSelector}
        hitSlop={4}
        onPress={() => router.push("/location-picker" as Href)}
      >
        <View style={styles.locationContent}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <View>
            <Text style={styles.locationLabel}>{t("discover.currentLocation")}</Text>
            <Text style={styles.locationValue}>{currentLocation}</Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </Pressable>

      {/* Search Bar + location button */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t("discover.searchPlaceholder")}
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={12}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.locationIconButton}
            onPress={() => router.push("/location-picker" as Href)}
            hitSlop={4}
          >
            <Ionicons name="location-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sort Dropdown */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{t("discover.sortBy")}</Text>
        <Pressable
          style={styles.sortDropdown}
          onPress={() => setSortDropdownVisible(true)}
          hitSlop={4}
        >
          <Text style={styles.sortDropdownText} numberOfLines={1}>
            {sortLabel}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Modal
        visible={sortDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortDropdownVisible(false)}
      >
        <Pressable
          style={styles.sortModalOverlay}
          onPress={() => setSortDropdownVisible(false)}
        >
          <Pressable
            style={styles.sortModalContent}
            onPress={() => {}}
          >
            {sortOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.sortOptionRow,
                  sortBy === option.id && styles.sortOptionRowActive,
                ]}
                onPress={() => {
                  setSortBy(option.id);
                  setSortDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.id && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {partnersLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isEmpty ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="leaf-outline" size={48} color={colors.primary} />
              </View>
              <View style={styles.clockDecor}>
                <Ionicons name="time-outline" size={20} color={colors.secondary} />
              </View>
              <View style={styles.sparkleDecor}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
            </View>

            <Text style={styles.emptyTitle}>{emptyHeadline}</Text>
            <Text style={styles.emptyDescription}>{emptyCopy}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.notifyButton,
                pressed && styles.notifyButtonPressed,
              ]}
              hitSlop={4}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={styles.notifyButtonText}>{t("discover.notifyMe")}</Text>
            </Pressable>
          </View>
        ) : (
          /* Partner Cards */
          <View>
            <Text style={styles.sectionTitle}>{t("discover.sectionTitle")}</Text>

            <View style={styles.cardsContainer}>
              {displayedPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  isFavorite={isFavorite(partner.id)}
                  onToggleFavorite={() => toggleFavorite(partner.id)}
                  onPress={() => router.push(`/partner/${partner.id}` as import("expo-router").Href)}
                  categoryDisplay={categoryLabelFor(partner.category, t)}
                  fromPriceLabel={t("partnerCard.from", { price: partner.priceFrom })}
                  discountLabel={t("partnerCard.off", { percent: partner.discountPercent })}
                  distanceLabel={t("partnerCard.km", { n: partner.distanceKm })}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Location
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locationLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  locationValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  locationIconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  // Categories
  categorySection: {
    paddingVertical: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryPill: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 40,
    justifyContent: "center",
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: colors.white,
  },

  // Sort dropdown
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  sortDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 40,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    maxWidth: "70%",
  },
  sortDropdownText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  sortModalContent: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  sortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sortOptionRowActive: {
    backgroundColor: colors.secondaryLight,
  },
  sortOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  sortOptionTextActive: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  loadingWrap: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Empty state - centered
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 1.5,
  },
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
  clockDecor: {
    position: "absolute",
    top: -6,
    right: -10,
  },
  sparkleDecor: {
    position: "absolute",
    bottom: 10,
    left: -14,
    opacity: 0.5,
  },
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
    marginBottom: spacing.xl,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  notifyButtonPressed: {
    backgroundColor: colors.secondaryLight,
  },
  notifyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Section
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  // Cards
  cardsContainer: {
    gap: spacing.lg,
  },
});