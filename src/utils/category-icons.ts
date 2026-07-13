/**
 * Maps categories.icon_name (DB) → Ionicons glyph names used in the app.
 * Ionicons does not ship exact matches for every DB value; closest equivalents below.
 */

import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const ICON_MAP: Record<string, IoniconName> = {
  dumbbell: "barbell-outline",
  yoga: "body-outline",
  "tennis-ball": "tennisball-outline",
  "boxing-glove": "pulse-outline", // Ionicons has no boxing glove; pulse matches intensity theme
  flower: "flower-outline",
  leaf: "leaf-outline",
};

const FALLBACK_ICON: IoniconName = "grid-outline";

export function resolveCategoryIcon(iconName: string | null | undefined): IoniconName {
  if (!iconName) return FALLBACK_ICON;
  return ICON_MAP[iconName] ?? FALLBACK_ICON;
}
