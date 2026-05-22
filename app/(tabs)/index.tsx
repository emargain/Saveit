/**
 * Customer Home — discovery-focused landing page inspired by fitness marketplace apps.
 *
 * Sections:
 *  1. Header: Saveit logo + profile avatar + settings
 *  2. Category grid (2-col) with icons
 *  3. Last-minute spots horizontal scroll (partner cards)
 *  4. Savi AI coach CTA section
 *  5. Invite friends promo card
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { FlatList, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTranslation } from "../../src/localization/hooks";
import { useMarketplacePartners } from "../../src/hooks/useMarketplacePartners";
import { useFavorites } from "../../src/state/favorites";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../../src/ui/theme";

const SHARE_URL = "https://saveit.app";

interface CategoryItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: "fitness", icon: "barbell-outline", color: "#6366F1" },
  { id: "yoga", icon: "body-outline", color: "#EC4899" },
  { id: "padel", icon: "tennisball-outline", color: "#F59E0B" },
  { id: "boxing", icon: "fitness-outline", color: "#EF4444" },
  { id: "beauty", icon: "flower-outline", color: "#8B5CF6" },
  { id: "wellness", icon: "leaf-outline", color: "#10B981" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useAppTranslation("customer");
  const { partners, loading } = useMarketplacePartners();
  const { isFavorite, toggleFavorite } = useFavorites();

  const topDeals = partners.slice(0, 8);

  async function handleShare() {
    try {
      await Share.share({
        message: `Check out Saveit! Last minute discounts for studios, padel, and beauty near you. ${SHARE_URL}`,
        url: SHARE_URL,
        title: "Share Saveit",
      });
    } catch {
      // cancelled
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Saveit</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIcon}
            hitSlop={8}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.avatar}
            hitSlop={8}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="person" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Categories grid ── */}
        <Text style={styles.sectionTitle}>{t("home.categoriesTitle")}</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
              onPress={() => router.push(`/(tabs)/discover?cat=${cat.id}` as Href)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + "18" }]}>
                <Ionicons name={cat.icon} size={26} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {t(`home.categories.${cat.id}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Last-minute spots ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.nearYouTitle")}</Text>
          <Pressable hitSlop={8} onPress={() => router.push("/(tabs)/discover")}>
            <Text style={styles.seeAll}>{t("home.seeAll")}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.dealCardShimmer} />
            ))}
          </View>
        ) : topDeals.length === 0 ? (
          <View style={styles.emptyDeals}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyDealsText}>{t("home.emptyTitle")}</Text>
          </View>
        ) : (
          <FlatList
            data={topDeals}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.dealsRow}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.dealCard, pressed && styles.dealCardPressed]}
                onPress={() => router.push(`/partner/${item.id}` as Href)}
              >
                <View style={styles.dealImage}>
                  <Ionicons name="business-outline" size={28} color={colors.textMuted} />
                  {/* Discount badge */}
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>-{item.discountPercent}%</Text>
                  </View>
                  {/* Heart */}
                  <Pressable
                    style={styles.dealHeart}
                    hitSlop={8}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Ionicons
                      name={isFavorite(item.id) ? "heart" : "heart-outline"}
                      size={18}
                      color={isFavorite(item.id) ? colors.error : colors.white}
                    />
                  </Pressable>
                </View>
                <View style={styles.dealContent}>
                  <Text style={styles.dealName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.dealMeta} numberOfLines={1}>{item.locationName}</Text>
                  <View style={styles.dealBottom}>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <Text style={styles.ratingVal}>{item.rating}</Text>
                    </View>
                    <Text style={styles.dealPrice}>${item.priceFrom}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}

        {/* ── Savi AI coach section ── */}
        <Pressable
          style={({ pressed }) => [styles.saviCard, pressed && styles.saviCardPressed]}
          onPress={() => router.push("/(tabs)/coach")}
        >
          <View style={styles.saviIconWrap}>
            <Ionicons name="chatbubbles" size={28} color={colors.white} />
          </View>
          <View style={styles.saviContent}>
            <Text style={styles.saviTitle}>{t("home.saviTitle")}</Text>
            <Text style={styles.saviSub}>{t("home.saviSubtitle")}</Text>
            <View style={styles.saviBtn}>
              <Text style={styles.saviBtnText}>{t("home.saviCta")}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </View>
        </Pressable>

        {/* ── Invite friends promo ── */}
        <Pressable
          style={({ pressed }) => [styles.promoCard, pressed && styles.promoCardPressed]}
          onPress={handleShare}
        >
          <View style={styles.promoIcon}>
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>{t("home.referTitle")}</Text>
            <Text style={styles.promoSub}>{t("home.referSubtitle")}</Text>
          </View>
          <View style={styles.promoBadge}>
            <Ionicons name="share-outline" size={14} color={colors.white} />
            <Text style={styles.promoBadgeText}>{t("home.shareCta")}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ────────────────── styles ────────────────── */

const DEAL_CARD_W = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Section */
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAll: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },

  /* Categories grid */
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
    ...shadow.soft,
  },
  categoryCardPressed: { backgroundColor: colors.backgroundAlt },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },

  /* Deals horizontal */
  dealsRow: { paddingLeft: spacing.lg, paddingRight: spacing.sm, gap: spacing.md },
  dealCard: {
    width: DEAL_CARD_W,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  dealCardPressed: { opacity: 0.92 },
  dealImage: {
    height: 110,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  dealBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  dealBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.white },
  dealHeart: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  dealContent: { padding: spacing.sm },
  dealName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  dealMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  dealBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingVal: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text },
  dealPrice: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },

  /* Loading shimmers */
  loadingRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.md },
  dealCardShimmer: {
    width: DEAL_CARD_W,
    height: 170,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
  },

  /* Empty deals */
  emptyDeals: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyDealsText: { fontSize: fontSize.sm, color: colors.textMuted },

  /* Savi AI coach */
  saviCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.elevated,
  },
  saviCardPressed: { opacity: 0.92 },
  saviIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  saviContent: { flex: 1 },
  saviTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white },
  saviSub: { fontSize: fontSize.xs, color: "rgba(255,255,255,0.8)", marginTop: 2, lineHeight: 18 },
  saviBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  saviBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },

  /* Promo / invite */
  promoCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
    ...shadow.card,
  },
  promoCardPressed: { backgroundColor: colors.backgroundAlt },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  promoSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  promoBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.white },
});
