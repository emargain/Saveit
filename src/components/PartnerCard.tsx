/**
 * Partner card - Shared by Discover and Favorites.
 * Shows image placeholder, name, category, rating, distance, price/discount, heart.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../ui/theme";
import type { Partner, PartnerCategory } from "../types/partner";

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  fitness: "Fitness",
  padel: "Padel",
  beauty: "Beauty",
  wellness: "Wellness",
};

function getCategoryLabel(category: PartnerCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

interface PartnerCardProps {
  partner: Partner;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress?: () => void;
  /** When set, overrides default English category label (use i18n from screen). */
  categoryDisplay?: string;
  fromPriceLabel?: string;
  discountLabel?: string;
  distanceLabel?: string;
}

export function PartnerCard({
  partner,
  isFavorite,
  onToggleFavorite,
  onPress,
  categoryDisplay,
  fromPriceLabel,
  discountLabel: discountLabelProp,
  distanceLabel,
}: PartnerCardProps) {
  const categoryLabel = categoryDisplay ?? getCategoryLabel(partner.category);
  const distanceText = distanceLabel ?? `${partner.distanceKm} km`;
  const fromPrice = fromPriceLabel ?? `From $${partner.priceFrom}`;
  const discountLabel = discountLabelProp ?? `${partner.discountPercent}% off`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="business-outline" size={36} color={colors.textMuted} />
        </View>
        <Pressable style={styles.heartButton} onPress={onToggleFavorite} hitSlop={8}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? colors.error : colors.white}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {partner.name}
        </Text>
        <Text style={styles.category}>{categoryLabel}</Text>

        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>{partner.rating}</Text>
          </View>
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.distanceText}>{distanceText}</Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.fromPrice}>{fromPrice}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  cardPressed: {
    backgroundColor: colors.backgroundAlt,
  },
  imageContainer: {
    position: "relative",
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  heartButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "capitalize",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  fromPrice: {
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
});
