/**
 * Settings — language; account switching is on Profile / Partner hub (sign-in flow).
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTranslation } from "../src/localization/hooks";
import { clearLanguageOverride, setAppLanguage } from "../src/localization/i18n";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../src/ui/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useAppTranslation("customer");
  const { t: tc } = useAppTranslation("common");

  const settingsRows = [
    { id: "account", icon: "person-outline" as const, label: t("settings.account") },
    { id: "notifications", icon: "notifications-outline" as const, label: t("settings.notifications") },
    { id: "privacy", icon: "shield-checkmark-outline" as const, label: t("settings.privacy") },
    { id: "help", icon: "help-circle-outline" as const, label: t("settings.help") },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsRows.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
            onPress={() => {}}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </Pressable>
        ))}

        <Text style={styles.section}>{t("settings.languageSection")}</Text>
        <Pressable
          style={styles.optionRow}
          onPress={async () => {
            await setAppLanguage("es");
          }}
        >
          <Text style={styles.optionLabel}>{tc("languageSpanish")}</Text>
        </Pressable>
        <Pressable
          style={styles.optionRow}
          onPress={async () => {
            await setAppLanguage("en");
          }}
        >
          <Text style={styles.optionLabel}>{tc("languageEnglish")}</Text>
        </Pressable>
        <Pressable
          style={styles.optionRow}
          onPress={async () => {
            await clearLanguageOverride();
          }}
        >
          <Text style={styles.optionLabel}>{tc("languageDevice")}</Text>
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
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  hintFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  optionRowPressed: {
    backgroundColor: colors.backgroundAlt,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
