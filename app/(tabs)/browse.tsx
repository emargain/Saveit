/**
 * Browse Screen - Search and discover partners and venues
 *
 * Structure:
 * 1. Search bar with location and filter buttons
 * 2. List/Map toggle switch
 * 3. List: empty state | Map: MapView with partner markers and callouts
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from "../../src/ui/theme";
import type { Partner, PartnerCategory } from "../../src/types/partner";
import { useMarketplacePartners } from "../../src/hooks/useMarketplacePartners";
import { getCityCoordinates } from "../../src/data/city-coordinates";
import { useLocation } from "../../src/state/location";
import { useFilters } from "../../src/state/filters";

type ViewMode = "list" | "map";

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  fitness: "Fitness",
  padel: "Padel",
  beauty: "Beauty",
  wellness: "Wellness",
};

function getCategoryLabel(category: PartnerCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

function matchesSearch(partner: Partner, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (partner.name.toLowerCase().includes(q)) return true;
  if (partner.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  if (getCategoryLabel(partner.category).toLowerCase().includes(q)) return true;
  return false;
}

const MAP_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

export default function BrowseScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { currentLocation } = useLocation();
  const { matchesFilters } = useFilters();
  const { partners: marketplacePartners } = useMarketplacePartners();

  const filteredPartners = useMemo(
    () =>
      marketplacePartners
        .filter((p) => matchesSearch(p, searchQuery))
        .filter((p) => matchesFilters(p)),
    [searchQuery, matchesFilters, marketplacePartners]
  );

  const cityCoords = getCityCoordinates(currentLocation);
  const mapRegion = useMemo(
    () => ({
      latitude: cityCoords.latitude,
      longitude: cityCoords.longitude,
      ...MAP_DELTA,
    }),
    [cityCoords.latitude, cityCoords.longitude]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for partners or deals..."
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

          <Pressable style={styles.iconButton} hitSlop={4}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            hitSlop={4}
            onPress={() => router.push("/filters" as Href)}
          >
            <Ionicons name="options-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === "list" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === "list" ? colors.white : colors.textMuted}
            />
            <Text style={[
              styles.toggleText,
              viewMode === "list" && styles.toggleTextActive,
            ]}>
              List
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleButton,
              viewMode === "map" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("map")}
          >
            <Ionicons
              name="map-outline"
              size={18}
              color={viewMode === "map" ? colors.white : colors.textMuted}
            />
            <Text style={[
              styles.toggleText,
              viewMode === "map" && styles.toggleTextActive,
            ]}>
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === "map" && (Platform.OS === "ios" || Platform.OS === "android") ? (
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={false}
          >
            {filteredPartners.map((partner) => (
              <Marker
                key={partner.id}
                coordinate={{ latitude: partner.lat, longitude: partner.lng }}
                title={partner.name}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName} numberOfLines={1}>
                      {partner.name}
                    </Text>
                    <Text style={styles.calloutDiscount}>
                      {partner.discountPercent}% off
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      ) : viewMode === "map" && Platform.OS === "web" ? (
        <View style={[styles.mapWrapper, styles.mapPlaceholder]}>
          <Ionicons name="map-outline" size={48} color={colors.textMuted} />
          <Text style={styles.mapPlaceholderText}>Map view on device</Text>
        </View>
      ) : (
        /* List: Empty State */
        <View style={styles.emptyStateWrapper}>
          <View style={styles.emptyState}>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCircle}>
                <Ionicons name="location" size={48} color={colors.primary} />
              </View>
              <View style={styles.pinDecor1}>
                <Ionicons name="location" size={18} color={colors.secondary} />
              </View>
              <View style={styles.pinDecor2}>
                <Ionicons name="location" size={14} color={colors.primary} />
              </View>
              <View style={styles.circleDecor} />
            </View>

            <Text style={styles.emptyTitle}>No venues nearby... yet!</Text>
            <Text style={styles.emptyDescription}>
              We are growing fast! Try searching a different area{"\n"}
              or adjusting your distance filter.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={() => {}}
              hitSlop={4}
            >
              <Ionicons name="navigate-outline" size={20} color={colors.white} />
              <Text style={styles.ctaButtonText}>Change location</Text>
            </Pressable>

            <View style={styles.hintRow}>
              <Ionicons name="sparkles" size={16} color={colors.secondary} />
              <Text style={styles.hintText}>New partners join every week!</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  // Map
  mapWrapper: {
    flex: 1,
    minHeight: 300,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundAlt,
  },
  mapPlaceholderText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  callout: {
    minWidth: 120,
    maxWidth: 200,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  calloutName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  calloutDiscount: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.white,
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
  pinDecor1: {
    position: "absolute",
    top: -10,
    right: -14,
    opacity: 0.8,
  },
  pinDecor2: {
    position: "absolute",
    bottom: 8,
    left: -18,
    opacity: 0.4,
  },
  circleDecor: {
    position: "absolute",
    top: 28,
    left: -8,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    opacity: 0.6,
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
    marginBottom: spacing.xl,
  },

  // CTA - min 48px
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
    marginBottom: spacing.lg,
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

  // Hint
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
