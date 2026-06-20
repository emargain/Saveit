/**
 * Views service — reads and writes against public.user_views.
 *
 * Failures are logged via console.error; functions never throw.
 * Returns null/error result objects so callers can branch cleanly.
 *
 * Judgment call — fetchTopViewedStudios aggregates in JS rather than using
 * PostgREST's count:id.count() syntax. The generated types don't include
 * the aggregate column, which would require unsafe casts, and the piloto
 * data scale is small enough that a JS aggregate over the full view set is
 * fine. Revisit if user view history grows large.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";
import { getSupabaseClient } from "./supabase/client";

export type RecentView = {
  id: string;
  studioId: string;
  viewedAt: string; // ISO
};

function getDb(): SupabaseClient<Database> | null {
  return getSupabaseClient() as SupabaseClient<Database> | null;
}

/**
 * Returns the user's most recent N views (default 50), ordered by
 * viewed_at desc. Returns [] on failure.
 */
export async function fetchRecentViews(
  userId: string,
  limit = 50
): Promise<RecentView[]> {
  const supabase = getDb();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_views")
    .select("id, studio_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchRecentViews failed:", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    studioId: row.studio_id,
    viewedAt: row.viewed_at ?? new Date().toISOString(),
  }));
}

/**
 * Inserts a new view row. Always creates a new row — full history per design.
 * Passes the current timestamp for viewed_at.
 */
export async function recordView(
  userId: string,
  studioId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getDb();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { error } = await supabase
    .from("user_views")
    .insert({ user_id: userId, studio_id: studioId, viewed_at: new Date().toISOString() });

  if (error) {
    console.error("recordView failed:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Returns view counts per studio for the user, ordered desc, limited to N
 * (default 5). Aggregates in JS over the full view history.
 */
export async function fetchTopViewedStudios(
  userId: string,
  limit = 5
): Promise<{ studioId: string; count: number }[]> {
  const supabase = getDb();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_views")
    .select("studio_id")
    .eq("user_id", userId);

  if (error) {
    console.error("fetchTopViewedStudios failed:", error);
    return [];
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.studio_id] = (counts[row.studio_id] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([studioId, count]) => ({ studioId, count }));
}
