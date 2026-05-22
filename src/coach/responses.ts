/**
 * Coach responses - Deterministic, no API.
 * Intent detection by keyword; responses from onboarding, favorites, location, partners.
 * Replace with LLM later by swapping getCoachResponse implementation.
 */

import type { OnboardingProfile } from "../onboarding-context";
import type { Partner } from "../data/partners";
import { partners } from "../data/partners";

const EXERCISE_LABELS: Record<string, string> = {
  yoga: "Yoga",
  pilates: "Pilates",
  cycling: "Cycling",
  hiit: "HIIT",
  outdoor: "Outdoor",
  other: "Other",
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface CoachContext {
  profile: OnboardingProfile;
  favoriteIds: string[];
  currentLocation: string;
  partners: Partner[];
}

/** Detect intent from user message (lowercase, simple substring). */
export function detectIntent(message: string): "workout_plan" | "recommend_studios" | "near_me" | null {
  const lower = message.trim().toLowerCase();
  if (lower.includes("workout plan") || (lower.includes("workout") && lower.includes("plan"))) return "workout_plan";
  if (lower.includes("recommend studios") || lower.includes("recommend studio") || lower.includes("studio recommendations") || lower.includes("recommendations")) return "recommend_studios";
  if (lower.includes("near me") || lower.includes("nearby") || lower.includes("close to me")) return "near_me";
  return null;
}

/** Build 7-day plan from onboarding frequency and exercise types. Deterministic. */
export function buildWorkoutPlan(profile: OnboardingProfile): string {
  const frequency = Math.min(7, Math.max(1, profile.frequency ?? 3));
  const types = profile.exerciseTypes?.length ? profile.exerciseTypes : ["yoga", "pilates", "hiit"];
  const labels = types.map((id) => EXERCISE_LABELS[id] ?? id);

  const lines: string[] = ["Here’s a 7-day plan based on your profile:\n"];
  let dayIndex = 0;
  for (let i = 0; i < 7; i++) {
    const dayName = DAY_NAMES[i];
    const isActiveDay = dayIndex < frequency;
    const activity = isActiveDay ? labels[dayIndex % labels.length] : "Rest or light stretch";
    lines.push(`${dayName}: ${activity}`);
    if (isActiveDay) dayIndex++;
  }
  lines.push(`\nYou said you work out ${frequency} day(s) per week — the active days above match that.`);
  return lines.join("\n");
}

/** Top 5 partners: favorites first, then by distance, then category match to profile. */
export function buildStudioRecommendations(
  partnerList: Partner[],
  favoriteIds: string[],
  profile: OnboardingProfile
): string {
  const favoriteSet = new Set(favoriteIds);
  const exerciseSet = new Set(profile.exerciseTypes ?? []);

  const scored = partnerList
    .map((p) => {
      const isFavorite = favoriteSet.has(p.id);
      const tagMatch = p.tags.some((t) => exerciseSet.has(t));
      return { partner: p, isFavorite, tagMatch, distance: p.distanceKm };
    })
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.tagMatch !== b.tagMatch) return a.tagMatch ? -1 : 1;
      return b.partner.rating - a.partner.rating;
    });

  const top5 = scored.slice(0, 5).map(({ partner }) => partner);
  if (top5.length === 0) return "I don’t have any partners to recommend right now. Try Discover or Browse!";

  const lines = ["Here are my top 5 picks for you:\n"];
  top5.forEach((p, i) => {
    const fav = favoriteSet.has(p.id) ? " ♥" : "";
    lines.push(`${i + 1}. ${p.name}${fav} — ${p.distanceKm} km, ${p.category} (${p.rating}★)`);
  });
  return lines.join("\n");
}

/** Partners in selected city, sorted by distance. */
export function buildNearMe(partnerList: Partner[], city: string): string {
  const inCity = partnerList.filter((p) => p.locationName === city);
  const byDistance = [...inCity].sort((a, b) => a.distanceKm - b.distanceKm);
  const top5 = byDistance.slice(0, 5);

  if (top5.length === 0) {
    return `I don’t see any partners in ${city} right now. Try another city in the location picker, or check back later.`;
  }

  const lines = [`Near you in ${city} (closest first):\n`];
  top5.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name} — ${p.distanceKm} km`);
  });
  return lines.join("\n");
}

const FALLBACK =
  "I can help with: workout plan (7-day plan from your profile), recommend studios (top 5 for you), or near me (closest in your city). Try one of those!";

/** Single entry point: user message + context → coach reply. Deterministic; swap for LLM later. */
export function getCoachResponse(message: string, context: CoachContext): string {
  const intent = detectIntent(message);
  if (intent === "workout_plan") return buildWorkoutPlan(context.profile);
  if (intent === "recommend_studios") return buildStudioRecommendations(context.partners, context.favoriteIds, context.profile);
  if (intent === "near_me") return buildNearMe(context.partners, context.currentLocation);
  return FALLBACK;
}
