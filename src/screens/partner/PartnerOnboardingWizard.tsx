/**
 * Multi-step partner onboarding — fields map to `StudioEntity` / inventory types.
 */

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth-context";
import { useAppTranslation } from "../../localization/hooks";
import {
  ensureDraftBundle,
  savePartnerDraft,
  submitPartnerApplication,
  upsertInventorySlots,
} from "../../services/studio-service";
import type {
  InventoryKind,
  StudioCategory,
  StudioEntity,
  TimeSlotInventory,
} from "../../types/domain";
import { createId } from "../../utils/id";
import { PrimaryButton, SecondaryButton } from "../../ui/Button";
import { Input } from "../../ui/Input";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../ui/theme";

const STEP_COUNT = 11; // indices 0..10 (no sample slot step)

const CATEGORIES: StudioCategory[] = [
  "fitness",
  "yoga",
  "pilates",
  "padel",
  "recovery",
  "wellness",
  "boxing",
  "beauty",
  "other",
];

function parseServiceTypes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function PartnerOnboardingWizard() {
  const { t } = useAppTranslation("partner");
  const { t: tc } = useAppTranslation("common");
  const { userEmail, userId } = useAuth();
  const router = useRouter();
  const ownerKey = userId ?? userEmail ?? "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studio, setStudio] = useState<StudioEntity | null>(null);
  const [inventoryKind, setInventoryKind] = useState<InventoryKind | null>(null);
  const [scheduleText, setScheduleText] = useState("");

  const load = useCallback(async () => {
    if (!ownerKey) return;
    const bundle = await ensureDraftBundle(ownerKey);
    setStudio(bundle.studio);
  }, [ownerKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStudio = (patch: Partial<StudioEntity>) => {
    setStudio((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const persist = async (next: StudioEntity) => {
    await savePartnerDraft(next);
  };

  const handleSaveDraft = async () => {
    if (!studio) return;
    setLoading(true);
    try {
      await persist(studio);
      Alert.alert(tc("save"), t("onboarding.saveDraft"));
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (): boolean => {
    if (!studio) return false;
    switch (step) {
      case 1:
        return Boolean(studio.name.trim());
      case 4:
        return (
          Boolean(studio.location.addressLine1.trim()) &&
          Boolean(studio.location.city.trim()) &&
          Boolean(studio.contact.phone.trim()) &&
          Boolean(studio.contact.email.trim())
        );
      case 5:
        return studio.serviceTypes.length > 0;
      case 6:
        return (
          studio.pricingRules.averageRetailPrice > 0 &&
          studio.pricingRules.minimumSaveItPrice > 0
        );
      case 10:
        return inventoryKind !== null;
      default:
        return true;
    }
  };

  const goNext = async () => {
    if (!studio) return;
    if (!validateStep()) {
      Alert.alert(tc("errors.generic"), t("onboarding.validationRequired"));
      return;
    }
    if (step === 8 && scheduleText.trim()) {
      const blocks = parseScheduleLines(scheduleText);
      updateStudio({ schedules: blocks });
    }
    await persist(studio);
    if (step < STEP_COUNT - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step === 0) router.back();
    else setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!studio) return;
    if (!validateStep()) {
      Alert.alert(tc("errors.generic"), t("onboarding.validationRequired"));
      return;
    }
    setLoading(true);
    try {
      await persist(studio);
      const slot = buildPlaceholderSlot(studio, inventoryKind!);
      await upsertInventorySlots(studio, [slot]);
      await submitPartnerApplication(studio);
      router.replace("/(business)/(tabs)");
    } finally {
      setLoading(false);
    }
  };

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (res.canceled || !studio) return;
    const uris = res.assets.map((a) => a.uri).filter(Boolean);
    updateStudio({ photoUris: [...studio.photoUris, ...uris] });
  };

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (res.canceled || !res.assets[0] || !studio) return;
    updateStudio({ logoUri: res.assets[0].uri });
  };

  if (!studio) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.muted}>{tc("loading")}</Text>
      </SafeAreaView>
    );
  }

  const stepTitle = [
    t("onboarding.stepAccount"),
    t("onboarding.stepBasics"),
    t("onboarding.stepBrand"),
    t("onboarding.stepPhotos"),
    t("onboarding.stepLocation"),
    t("onboarding.stepCategory"),
    t("onboarding.stepPricing"),
    t("onboarding.stepPeak"),
    t("onboarding.stepDemand"),
    t("onboarding.stepRules"),
    t("onboarding.stepInventoryType"),
  ][step];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("onboarding.title")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressOuter}>
        <View
          style={[styles.progressInner, { width: `${((step + 1) / STEP_COUNT) * 100}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {t("onboarding.progress", { current: step + 1, total: STEP_COUNT })} · {stepTitle}
      </Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.block}>
            <Text style={styles.body}>
              {t("onboarding.accountHint", { email: userEmail ?? "" })}
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldStudioName")}
              value={studio.name}
              onChangeText={(name) => updateStudio({ name })}
            />
            <Input
              label={t("onboarding.fieldBrandName")}
              value={studio.brandName ?? ""}
              onChangeText={(brandName) => updateStudio({ brandName: brandName || null })}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldDescription")}
              value={studio.description ?? ""}
              onChangeText={(description) => updateStudio({ description: description || null })}
              multiline
            />
            <SecondaryButton title={t("onboarding.fieldLogo")} onPress={pickLogo} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.block}>
            <SecondaryButton title={t("onboarding.pickImages")} onPress={pickPhotos} />
            <Text style={styles.muted}>{studio.photoUris.length} photos</Text>
          </View>
        )}

        {step === 4 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldAddress")}
              value={studio.location.addressLine1}
              onChangeText={(addressLine1) =>
                updateStudio({ location: { ...studio.location, addressLine1 } })
              }
            />
            <Input
              label={t("onboarding.fieldCity")}
              value={studio.location.city}
              onChangeText={(city) =>
                updateStudio({ location: { ...studio.location, city } })
              }
            />
            <Input
              label={t("onboarding.fieldRegion")}
              value={studio.location.region ?? ""}
              onChangeText={(region) =>
                updateStudio({ location: { ...studio.location, region: region || null } })
              }
            />
            <Input
              label={t("onboarding.fieldPostal")}
              value={studio.location.postalCode ?? ""}
              onChangeText={(postalCode) =>
                updateStudio({ location: { ...studio.location, postalCode: postalCode || null } })
              }
            />
            <Input
              label={t("onboarding.fieldCountry")}
              value={studio.location.country}
              onChangeText={(country) =>
                updateStudio({ location: { ...studio.location, country } })
              }
            />
            <Input
              label={t("onboarding.fieldContactEmail")}
              value={studio.contact.email}
              onChangeText={(email) =>
                updateStudio({ contact: { ...studio.contact, email } })
              }
              keyboardType="email-address"
            />
            <Input
              label={t("onboarding.fieldPhone")}
              value={studio.contact.phone}
              onChangeText={(phone) =>
                updateStudio({ contact: { ...studio.contact, phone } })
              }
              keyboardType="phone-pad"
            />
            <Input
              label={t("onboarding.fieldWebsite")}
              value={studio.contact.websiteUrl ?? ""}
              onChangeText={(websiteUrl) =>
                updateStudio({ contact: { ...studio.contact, websiteUrl: websiteUrl || null } })
              }
            />
            <Input
              label={t("onboarding.fieldInstagram")}
              value={studio.contact.instagram ?? ""}
              onChangeText={(instagram) =>
                updateStudio({ contact: { ...studio.contact, instagram: instagram || null } })
              }
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.block}>
            <Text style={styles.label}>{t("onboarding.fieldCategory")}</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => updateStudio({ category: c })}
                  style={[styles.chip, studio.category === c && styles.chipOn]}
                >
                  <Text style={[styles.chipText, studio.category === c && styles.chipTextOn]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input
              label={t("onboarding.fieldServiceTypes")}
              value={studio.serviceTypes.join(", ")}
              onChangeText={(text) => updateStudio({ serviceTypes: parseServiceTypes(text) })}
            />
          </View>
        )}

        {step === 6 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldAvgPrice")}
              value={String(studio.pricingRules.averageRetailPrice || "")}
              onChangeText={(v) =>
                updateStudio({
                  pricingRules: {
                    ...studio.pricingRules,
                    averageRetailPrice: Number(v) || 0,
                  },
                  averageClassPrice: Number(v) || 0,
                })
              }
              keyboardType="numeric"
            />
            <Input
              label={t("onboarding.fieldMinPrice")}
              value={String(studio.pricingRules.minimumSaveItPrice || "")}
              onChangeText={(v) =>
                updateStudio({
                  pricingRules: {
                    ...studio.pricingRules,
                    minimumSaveItPrice: Number(v) || 0,
                  },
                })
              }
              keyboardType="numeric"
            />
            <Input
              label={t("onboarding.fieldDiscount")}
              value={String(studio.pricingRules.defaultDiscountPercent ?? "")}
              onChangeText={(v) =>
                updateStudio({
                  pricingRules: {
                    ...studio.pricingRules,
                    defaultDiscountPercent: Number(v) || null,
                  },
                })
              }
              keyboardType="numeric"
            />
            <Text style={styles.label}>{t("onboarding.fieldPricingBehavior")}</Text>
            {(
              [
                ["fixed_discount", t("onboarding.pricingFixed")],
                ["dynamic_floor", t("onboarding.pricingDynamic")],
                ["manual", t("onboarding.pricingManual")],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() =>
                  updateStudio({
                    pricingRules: { ...studio.pricingRules, preferredBehavior: key },
                  })
                }
                style={[
                  styles.optionRow,
                  studio.pricingRules.preferredBehavior === key && styles.optionRowOn,
                ]}
              >
                <Text style={styles.optionText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 7 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldPeak")}
              value={studio.offPeakOccupancy.notes ?? ""}
              onChangeText={(notes) =>
                updateStudio({
                  offPeakOccupancy: {
                    ...studio.offPeakOccupancy,
                    notes: notes || null,
                  },
                })
              }
              multiline
              placeholder="Mon–Fri 17:00–20:00"
            />
            <Input
              label={t("onboarding.fieldOffPeak")}
              value={String(studio.offPeakOccupancy.typicalPercent)}
              onChangeText={(v) =>
                updateStudio({
                  offPeakOccupancy: {
                    ...studio.offPeakOccupancy,
                    typicalPercent: Number(v) || 0,
                  },
                })
              }
              keyboardType="numeric"
            />
          </View>
        )}

        {step === 8 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldDemand")}
              value={(studio.demandByDayTime ?? [])
                .map((d) => `${d.dayOfWeek} ${d.timeWindow} ${d.demandLevel}`)
                .join("\n")}
              onChangeText={(text) => {
                const lines = text.split("\n").filter(Boolean);
                const demandByDayTime = lines.map((line) => {
                  const [d, w, lvl] = line.split(" ");
                  return {
                    dayOfWeek: Number(d) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                    timeWindow: w ?? "",
                    demandLevel: (lvl as "low" | "medium" | "high") ?? "medium",
                  };
                });
                updateStudio({ demandByDayTime });
              }}
              multiline
              placeholder="1 18:00-20:00 high"
            />
            <Input
              label={t("onboarding.fieldSchedules")}
              value={scheduleText}
              onChangeText={setScheduleText}
              multiline
              placeholder="1 09:00-10:00"
            />
          </View>
        )}

        {step === 9 && (
          <View style={styles.block}>
            <Input
              label={t("onboarding.fieldCancelHours")}
              value={String(studio.cancellation.freeCancelHoursBefore)}
              onChangeText={(v) =>
                updateStudio({
                  cancellation: {
                    ...studio.cancellation,
                    freeCancelHoursBefore: Number(v) || 0,
                  },
                })
              }
              keyboardType="numeric"
            />
            <Pressable
              onPress={() => updateStudio({ autoPublishSlots: !studio.autoPublishSlots })}
              style={styles.optionRow}
            >
              <Text style={styles.optionText}>{t("onboarding.fieldAutoPublish")}</Text>
              <Ionicons
                name={studio.autoPublishSlots ? "checkbox" : "square-outline"}
                size={22}
                color={colors.primary}
              />
            </Pressable>
            <Input
              label={t("onboarding.fieldLegalName")}
              value={studio.taxLegal.businessLegalName ?? ""}
              onChangeText={(businessLegalName) =>
                updateStudio({
                  taxLegal: { ...studio.taxLegal, businessLegalName: businessLegalName || null },
                })
              }
            />
            <Input
              label={t("onboarding.fieldTaxId")}
              value={studio.taxLegal.taxIdPlaceholder ?? ""}
              onChangeText={(taxIdPlaceholder) =>
                updateStudio({
                  taxLegal: { ...studio.taxLegal, taxIdPlaceholder: taxIdPlaceholder || null },
                })
              }
            />
          </View>
        )}

        {step === 10 && (
          <View style={styles.block}>
            <Text style={styles.body}>{t("onboarding.stepInventoryTypeHint")}</Text>
            <Text style={styles.label}>{t("onboarding.fieldSlotKind")}</Text>
            {(
              [
                ["class", t("onboarding.kindClass")],
                ["court", t("onboarding.kindCourt")],
                ["session", t("onboarding.kindSession")],
                ["other", t("onboarding.kindOther")],
              ] as const
            ).map(([k, label]) => (
              <Pressable
                key={k}
                onPress={() => setInventoryKind(k)}
                style={[
                  styles.optionRow,
                  inventoryKind === k && styles.optionRowOn,
                ]}
              >
                <Text style={styles.optionText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton
          title={t("onboarding.saveDraft")}
          onPress={handleSaveDraft}
          disabled={loading}
        />
        {step < STEP_COUNT - 1 ? (
          <PrimaryButton title={tc("next")} onPress={goNext} disabled={loading} />
        ) : (
          <PrimaryButton
            title={t("onboarding.reviewSubmit")}
            onPress={handleSubmit}
            disabled={loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Minimal draft slot so the bundle has a kind; partners refine slots in the dashboard. */
function buildPlaceholderSlot(studio: StudioEntity, kind: InventoryKind): TimeSlotInventory {
  const now = new Date().toISOString();
  const cap = 10;
  const publish =
    studio.approvalStatus === "approved"
      ? "live"
      : ("draft" as const);
  return {
    id: createId("slot"),
    title: "Session",
    kind,
    serviceType: studio.serviceTypes[0] ?? "class",
    occursOnDate: null,
    dayOfWeek: 1,
    startTime: "09:00",
    durationMinutes: 60,
    capacityTotal: cap,
    capacityRemaining: cap,
    retailPrice: studio.pricingRules.averageRetailPrice,
    saveItPrice: studio.pricingRules.minimumSaveItPrice,
    isPeak: false,
    isPaused: false,
    publishStatus: publish,
    createdAt: now,
    updatedAt: now,
  };
}

function parseScheduleLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      const day = Number(parts[0]);
      const range = parts.slice(1).join(" ").split("-");
      const startTime = (range[0] ?? "09:00").trim();
      const endTime = (range[1] ?? "10:00").trim();
      return {
        id: createId("sch"),
        dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        startTime,
        endTime,
        label: null,
      };
    })
    .filter((b) => !Number.isNaN(b.dayOfWeek));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  iconBtn: { width: 40, height: 40, justifyContent: "center" },
  progressOuter: {
    height: 6,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressLabel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  block: { gap: spacing.md },
  body: { fontSize: fontSize.md, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.secondaryLight, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextOn: { fontWeight: fontWeight.semibold },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionRowOn: { borderColor: colors.primary, backgroundColor: colors.secondaryLight },
  optionText: { fontSize: fontSize.md, color: colors.text },
  section: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  footer: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
