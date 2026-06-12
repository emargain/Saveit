/**
 * My Bookings — upcoming and past reservations for the signed-in customer.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth-context";
import { useAppTranslation } from "../../src/localization/hooks";
import {
  fetchCustomerBookings,
  type CustomerBookingRow,
} from "../../src/services/bookings-service";
import type { InventoryKind } from "../../src/types/domain";
import { formatSlotDateTime } from "../../src/utils/datetime";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../src/ui/theme";

type FilterTab = "upcoming" | "past";

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

function statusLabel(status: CustomerBookingRow["status"], t: (k: string) => string): string {
  switch (status) {
    case "cancelled":
      return t("bookingsTab.statusCancelled");
    case "completed":
      return t("bookingsTab.statusCompleted");
    case "no_show":
      return t("bookingsTab.statusNoShow");
    default:
      return status;
  }
}

export default function BookingsScreen() {
  const { t, i18n } = useAppTranslation("customer");
  const router = useRouter();
  const { userId, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const [bookings, setBookings] = useState<CustomerBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchCustomerBookings(userId);
    setBookings(list);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up = bookings
      .filter((b) => new Date(b.slot.startsAt) > now)
      .sort(
        (a, b) =>
          new Date(a.slot.startsAt).getTime() - new Date(b.slot.startsAt).getTime()
      );
    const pa = bookings
      .filter((b) => new Date(b.slot.startsAt) <= now)
      .sort(
        (a, b) =>
          new Date(b.slot.startsAt).getTime() - new Date(a.slot.startsAt).getTime()
      );
    return { upcoming: up, past: pa };
  }, [bookings]);

  const displayed = activeTab === "upcoming" ? upcoming : past;

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("bookingsTab.title")}</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t("bookingsTab.signInPrompt")}</Text>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.ctaButtonText}>{t("bookingsTab.signInCta")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("bookingsTab.title")}</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabPill, activeTab === "upcoming" && styles.tabPillActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
            {t("bookingsTab.tabUpcoming")} ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabPill, activeTab === "past" && styles.tabPillActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
            {t("bookingsTab.tabPast")} ({past.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming"
              ? t("bookingsTab.emptyUpcoming")
              : t("bookingsTab.emptyPast")}
          </Text>
          {activeTab === "upcoming" && (
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.ctaButtonText}>{t("bookingsTab.browseCta")}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const slotLabel =
              item.slot.title ?? inventoryKindLabel(item.slot.inventoryKind, t);
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() =>
                  router.push({
                    pathname: "/booking/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.rowMain}>
                  <Text style={styles.studioName}>{item.studio.name}</Text>
                  <Text style={styles.dateTime}>
                    {formatSlotDateTime(item.slot.startsAt, i18n.language)}
                  </Text>
                  <Text style={styles.slotLabel}>{slotLabel}</Text>
                  <Text style={styles.price}>${Math.round(item.priceMxn)} MXN</Text>
                </View>
                {item.status !== "confirmed" && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {statusLabel(item.status, t)}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabPill: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.white,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowPressed: {
    backgroundColor: colors.backgroundAlt,
  },
  rowMain: {
    flex: 1,
    gap: spacing.xs,
  },
  studioName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  dateTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  slotLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  ctaButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  ctaButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
