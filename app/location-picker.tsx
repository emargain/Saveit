/**
 * Location Picker - Select current city.
 * Saves to LocationContext + AsyncStorage, then goes back.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, fontWeight, radius, spacing } from "../src/ui/theme";
import { useLocation } from "../src/state/location";

const CITIES = [
  "Mexico City",
  "Monterrey",
  "Guadalajara",
  "Oberlin",
];

export default function LocationPickerScreen() {
  const router = useRouter();
  const { currentLocation, setLocation } = useLocation();

  function handleSelect(city: string) {
    setLocation(city);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Select location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CITIES.map((city) => {
          const isSelected = city === currentLocation;
          return (
            <Pressable
              key={city}
              style={[styles.cityRow, isSelected && styles.cityRowSelected]}
              onPress={() => handleSelect(city)}
            >
              <Ionicons
                name="location"
                size={22}
                color={isSelected ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                {city}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          );
        })}
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
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cityRowSelected: {
    backgroundColor: colors.secondaryLight,
  },
  cityName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  cityNameSelected: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
