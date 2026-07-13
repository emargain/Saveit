/**
 * Categories service — reads from public.categories.
 *
 * Failures are logged via console.error; fetchCategories never throws.
 *
 * TODO: display_name is Spanish-only today. Add display_name_es / display_name_en
 * columns (or a jsonb locale map) when bilingual category labels are needed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";
import { getSupabaseClient } from "./supabase/client";

export type Category = {
  slug: string;
  displayName: string;
  displayOrder: number;
  iconName: string | null;
  colorHex: string | null;
  isActive: boolean;
};

function getDb(): SupabaseClient<Database> | null {
  return getSupabaseClient() as SupabaseClient<Database> | null;
}

/**
 * Returns active categories ordered by display_order.
 * On error or missing client, returns [] and logs.
 */
export async function fetchCategories(): Promise<Category[]> {
  const supabase = getDb();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("slug, display_name, display_order, icon_name, color_hex, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("fetchCategories failed:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    displayName: row.display_name,
    displayOrder: row.display_order,
    iconName: row.icon_name,
    colorHex: row.color_hex,
    isActive: row.is_active,
  }));
}
