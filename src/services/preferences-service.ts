/**
 * User preferences service — reads and writes against public.user_preferences.
 * Maps snake_case DB columns to camelCase TS fields.
 *
 * Failures are logged via console.error; functions never throw.
 * Returns null/error result objects so callers can branch cleanly.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";
import { getSupabaseClient } from "./supabase/client";

export type OnboardingPreferences = {
  exerciseTypes: string[];
  frequencyPerWeek: number | null;
  motivation: string | null;
};

type UserPreferencesInsert =
  Database["public"]["Tables"]["user_preferences"]["Insert"];

/**
 * The shared client lacks a Database generic; cast at the edge so the rest
 * of this file enjoys fully typed queries. If src/types/supabase.ts is stale
 * or missing, the references to Database elsewhere here will fail at compile
 * time — making schema drift loud.
 */
function getDb(): SupabaseClient<Database> | null {
  return getSupabaseClient() as SupabaseClient<Database> | null;
}

/**
 * Fetch the current user's preferences from Supabase.
 * Returns null if no row exists OR if the client is not configured OR if
 * the query failed (errors are logged inside).
 */
export async function fetchUserPreferences(
  userId: string
): Promise<OnboardingPreferences | null> {
  const supabase = getDb();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("exercise_types, frequency_per_week, motivation")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("fetchUserPreferences failed:", error);
    return null;
  }
  if (!data) return null;

  return {
    exerciseTypes: data.exercise_types ?? [],
    frequencyPerWeek: data.frequency_per_week,
    motivation: data.motivation,
  };
}

/**
 * Upsert preferences for the given user. Uses onConflict on user_id so this
 * is safe to call multiple times. RLS requires auth.uid() = user_id, so a
 * real session must exist on the client for this to succeed.
 */
export async function upsertUserPreferences(
  userId: string,
  prefs: OnboardingPreferences
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getDb();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const payload: UserPreferencesInsert = {
    user_id: userId,
    exercise_types: prefs.exerciseTypes,
    frequency_per_week: prefs.frequencyPerWeek,
    motivation: prefs.motivation,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("upsertUserPreferences failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
