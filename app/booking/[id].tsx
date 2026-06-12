/**
 * Booking detail — single reservation with studio context.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTranslation } from "../../src/localization/hooks";
import {
  fetchCustomerBookingById,
  type CustomerBookingRow,
} from "../../src/services/bookings-service";
import type { InventoryKind } from "../../src/types/domain";
import { formatSlotDateTime } from "../../src/utils/datetime";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../src/ui/theme";

function statusLabel(status: CustomerBookingRow["status"], t: (k: string) => string): string {
  switch (status) {
    case "cancelled":
      return t("bookingsTab.statusCancelled");
    case "completed":
      return t("bookingsTab.statusCompleted");
    case "no_show":
      return t("bookingsTab.statusNoShow");
    case "confirmed":
      return t("bookingDetail.statusConfirmed");
    default:
      return status;
  }
}

function inventoryKindLabel(kind: InventoryKind, t: (k: string) => string): string {
  switch (kind) {
    case "class":
      return t("bookingsTab.kindClass");
    case "court":
      return t("bookingsTab.kindCourt");
    case "session":
      return t("bookingsTab.kindSession");
    default:
      return t("bookingsTab.kindOther");
  }
}

function formatAddress(booking: CustomerBookingRow): string {
  const parts = [
    booking.studio.address.line1,
    booking.studio.address.city,
    booking.studio.address.region,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function BookingDetailScreen() {
  const { t, i18n } = useAppTranslation("customer");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<CustomerBookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    const row = await fetchCustomerBookingById(id);
    setBooking(row);
    setNotFound(!row);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("bookingsTab.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !booking) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("bookingsTab.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>{t("bookingDetail.notFound")}</Text>
          <Text style={styles.notFoundDesc}>{t("bookingDetail.notFoundDesc")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const slotLabel =
    booking.slot.title ?? inventoryKindLabel(booking.slot.inventoryKind, t);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {booking.studio.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{statusLabel(booking.status, t)}</Text>
        </View>

        <Text style={styles.dateTimeLarge}>
          {formatSlotDateTime(booking.slot.startsAt, i18n.language)}
        </Text>

        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>{slotLabel}</Text>
          <Text style={styles.detailMeta}>
            {t("bookingDetail.duration", { minutes: booking.slot.durationMinutes })}
          </Text>
          <Text style={styles.detailMeta}>
            {inventoryKindLabel(booking.slot.inventoryKind, t)}
          </Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.sectionLabel}>{t("bookingDetail.priceLabel")}</Text>
          <Text style={styles.priceValue}>${Math.round(booking.priceMxn)} MXN</Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.sectionLabel}>{t("bookingDetail.addressLabel")}</Text>
          <Text style={styles.detailMeta}>{formatAddress(booking)}</Text>
        </View>

        <Text style={styles.cancelNote}>{t("bookingDetail.cancelNote")}</Text>

        <Pressable
          style={({ pressed }) => [styles.studioButton, pressed && styles.studioButtonPressed]}
          onPress={() => router.push(`/partner/${booking.studio.id}`)}
        >
          <Text style={styles.studioButtonText}>{t("bookingDetail.goToStudio")}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>

        <View style={styles.idBlock}>
          <Text style={styles.idLabel}>{t("bookingDetail.bookingIdLabel")}</Text>
          <Text style={styles.idValue}>{booking.id}</Text>
        </View>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  notFoundTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  notFoundDesc: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryLight,
  },
  statusBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  dateTimeLarge: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  detailBlock: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  detailMeta: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cancelNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 22,
    fontStyle: "italic",
  },
  studioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  studioButtonPressed: {
    opacity: 0.92,
  },
  studioButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  idBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.xs,
  },
  idLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  idValue: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
    color: colors.textMuted,
  },
});
