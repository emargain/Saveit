/**
 * Profile / partner hub — current account role and switch (signs out → auth with intent).
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth-context";
import type { UserRole } from "../types/domain";
import { colors, fontSize, fontWeight, radius, shadow, spacing } from "../ui/theme";

type Labels = {
  sectionTitle: string;
  currentLabel: string;
  customer: string;
  partner: string;
  admin?: string;
  switchToCustomer: string;
  switchToPartner: string;
  switchFromAdmin?: string;
  explainer: string;
};

interface RoleAccountCardProps {
  labels: Labels;
}

export function RoleAccountCard({ labels }: RoleAccountCardProps) {
  const router = useRouter();
  const { role, beginRoleSwitch, isBeginningRoleSwitch } = useAuth();

  async function goSwitch(target: "customer" | "partner") {
    await beginRoleSwitch(target);
    router.replace("/(auth)/login");
  }

  if (role === "admin") {
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{labels.sectionTitle}</Text>
        </View>
        <View style={styles.roleBadge}>
          <View style={styles.roleIconWrap}>
            <Ionicons name="shield" size={28} color={colors.primary} />
          </View>
          <View style={styles.roleTextCol}>
            <Text style={styles.muted}>{labels.currentLabel}</Text>
            <Text style={styles.roleName}>{labels.admin ?? "Admin"}</Text>
          </View>
        </View>
        <Text style={styles.explainer}>{labels.explainer}</Text>
        <Pressable
          style={({ pressed }) => [styles.switchBtn, pressed && styles.switchBtnPressed]}
          onPress={() => goSwitch("customer")}
          disabled={isBeginningRoleSwitch}
        >
          {isBeginningRoleSwitch ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.switchBtnText}>
              {labels.switchFromAdmin ?? labels.switchToCustomer}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  const displayRole: "customer" | "partner" = role === "partner" ? "partner" : "customer";

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{labels.sectionTitle}</Text>
      </View>

      <View style={styles.roleBadge}>
        <View style={styles.roleIconWrap}>
          <Ionicons
            name={displayRole === "partner" ? "business" : "person"}
            size={28}
            color={colors.primary}
          />
        </View>
        <View style={styles.roleTextCol}>
          <Text style={styles.muted}>{labels.currentLabel}</Text>
          <Text style={styles.roleName}>
            {displayRole === "partner" ? labels.partner : labels.customer}
          </Text>
        </View>
      </View>

      <Text style={styles.explainer}>{labels.explainer}</Text>

      {displayRole === "partner" ? (
        <Pressable
          style={({ pressed }) => [styles.switchBtn, pressed && styles.switchBtnPressed]}
          onPress={() => goSwitch("customer")}
          disabled={isBeginningRoleSwitch}
        >
          {isBeginningRoleSwitch ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              <Text style={styles.switchBtnText}>{labels.switchToCustomer}</Text>
            </>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.switchBtn, pressed && styles.switchBtnPressed]}
          onPress={() => goSwitch("partner")}
          disabled={isBeginningRoleSwitch}
        >
          {isBeginningRoleSwitch ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
              <Text style={styles.switchBtnText}>{labels.switchToPartner}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTextCol: { flex: 1 },
  muted: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  roleName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  explainer: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    minHeight: 52,
  },
  switchBtnPressed: {
    backgroundColor: colors.secondaryLight,
  },
  switchBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
