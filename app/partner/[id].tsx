/**
 * Partner detail — marketplace studio + live slots; booking updates partner dashboard locally.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth-context";
import type { Partner, PartnerCategory } from "../../src/data/partners";
import { useAppTranslation } from "../../src/localization/hooks";
import {
  createCustomerBooking,
  getLocalBundleForPartnerId,
  getMarketplacePartnerById,
} from "../../src/services/studio-service";
import type { TimeSlotInventory } from "../../src/types/domain";
import { useViews } from "../../src/state/views";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../src/ui/theme";

function categoryLabel(category: PartnerCategory, t: (k: string) => string) {
  return t(`discover.categories.${category}`);
}

export default function PartnerDetailsScreen() {
  const { t } = useAppTranslation("customer");
  const { t: tc } = useAppTranslation("common");
  const { userId, userEmail } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incrementView } = useViews();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [slots, setSlots] = useState<TimeSlotInventory[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const p = await getMarketplacePartnerById(id);
    setPartner(p ?? null);
    const bundle = await getLocalBundleForPartnerId(id);
    setSlots(
      (bundle?.slots ?? []).filter((s) => s.publishStatus === "live" && !s.isPaused)
    );
  }, [id]);

  useEffect(() => {
    if (id) incrementView(id);
  }, [id, incrementView]);

  useEffect(() => {
    void load();
  }, [load]);

  const liveSlots = useMemo(() => slots, [slots]);

  async function handleBook(slot: TimeSlotInventory) {
    const customerId = userId ?? userEmail ?? "guest";
    const res = await createCustomerBooking({
      studioId: id!,
      slotId: slot.id,
      customerUserId: customerId,
      customerEmail: userEmail,
      quantity: 1,
    });
    if (res.ok) {
      Alert.alert(t("booking.successTitle"), t("booking.successBody"));
      await load();
    } else {
      Alert.alert(t("booking.errorTitle"), res.error ?? tc("errors.generic"));
    }
  }

  if (!partner) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("partnerDetail.header")}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t("partnerDetail.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cat = categoryLabel(partner.category, t);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {partner.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {partner.imageUrl ? (
          <Image source={{ uri: partner.imageUrl }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        <Text style={styles.name}>{partner.name}</Text>
        <Text style={styles.category}>{cat}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <Text style={styles.metaText}>{partner.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {t("partnerCard.km", { n: partner.distanceKm })} · {partner.locationName}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            {t("partnerDetail.fromPrice", { from: partner.priceFrom, to: partner.priceTo })}
          </Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {t("partnerDetail.off", { percent: partner.discountPercent })}
            </Text>
          </View>
        </View>

        {partner.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionLabel}>{t("partnerDetail.tags")}</Text>
            <View style={styles.tagsRow}>
              {partner.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>{t("partnerDetail.slots")}</Text>
        {liveSlots.length === 0 ? (
          <Text style={styles.muted}>{t("booking.noSlots")}</Text>
        ) : (
          liveSlots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotTitle}>{slot.title}</Text>
                <Text style={styles.muted}>
                  {slot.startTime} · {slot.capacityRemaining}/{slot.capacityTotal} · $
                  {slot.saveItPrice}
                </Text>
              </View>
              <Pressable
                style={styles.bookSmall}
                onPress={() => handleBook(slot)}
                disabled={slot.capacityRemaining < 1}
              >
                <Text style={styles.bookSmallText}>{t("partnerDetail.book")}</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
          onPress={() => {
            const first = liveSlots[0];
            if (first) void handleBook(first);
            else Alert.alert(t("booking.errorTitle"), t("booking.noSlots"));
          }}
        >
          <Text style={styles.bookButtonText}>{t("partnerDetail.book")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  notFoundText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  heroImage: {
    height: 200,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textTransform: "capitalize",
  },
  meta: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  priceLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  discountBadge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  discountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  tagsSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  slotTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  bookSmall: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  bookSmallText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  bookButton: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
    ...shadow.elevated,
  },
  bookButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  bookButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
