/**
 * Filters Modal - Price range, min rating, tags.
 * Apply saves to FiltersContext and goes back; Reset clears filters.
 */

import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../src/ui/theme";
import { useFilters, DEFAULT_FILTERS } from "../src/state/filters";

const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
  { value: 5, label: "5" },
];

const TAG_OPTIONS = [
  "yoga",
  "pilates",
  "HIIT",
  "cycling",
  "padel",
  "facial",
  "nails",
  "massage",
  "meditation",
  "wellness",
];

const PRICE_MAX = 1000;
const PRICE_STEP = 50;

export default function FiltersScreen() {
  const router = useRouter();
  const { filters, applyFilters, resetFilters } = useFilters();

  const [priceMin, setPriceMin] = useState(filters.priceMin);
  const [priceMax, setPriceMax] = useState(filters.priceMax);
  const [minRating, setMinRating] = useState(filters.minRating);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.selectedTags);

  useEffect(() => {
    setPriceMin(filters.priceMin);
    setPriceMax(filters.priceMax);
    setMinRating(filters.minRating);
    setSelectedTags(filters.selectedTags);
  }, [filters.priceMin, filters.priceMax, filters.minRating, filters.selectedTags]);

  function handleApply() {
    applyFilters({
      priceMin: Math.min(priceMin, priceMax),
      priceMax: Math.max(priceMin, priceMax),
      minRating,
      selectedTags,
    });
    router.back();
  }

  function handleReset() {
    setPriceMin(DEFAULT_FILTERS.priceMin);
    setPriceMax(DEFAULT_FILTERS.priceMax);
    setMinRating(DEFAULT_FILTERS.minRating);
    setSelectedTags(DEFAULT_FILTERS.selectedTags);
    resetFilters();
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Price range */}
        <Text style={styles.sectionTitle}>Price range</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Min ${Math.round(priceMin)}</Text>
          <Text style={styles.priceLabel}>Max ${Math.round(priceMax)}</Text>
        </View>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={PRICE_MAX}
            step={PRICE_STEP}
            value={priceMin}
            onValueChange={setPriceMin}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderLight}
            thumbTintColor={colors.primary}
          />
        </View>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={PRICE_MAX}
            step={PRICE_STEP}
            value={priceMax}
            onValueChange={setPriceMax}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderLight}
            thumbTintColor={colors.primary}
          />
        </View>

        {/* Minimum rating */}
        <Text style={styles.sectionTitle}>Minimum rating</Text>
        <View style={styles.chipRow}>
          {RATING_OPTIONS.map((opt) => {
            const isSelected = minRating === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setMinRating(opt.value)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>Tags</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.chipRow}>
          {TAG_OPTIONS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleReset}
          >
            <Text style={styles.buttonSecondaryText}>Reset</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleApply}
          >
            <Text style={styles.buttonPrimaryText}>Apply</Text>
          </Pressable>
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
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
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  sliderRow: {
    marginBottom: spacing.sm,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  buttonPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
