/**
 * Auth Layout - Contains login and signup screens
 * Uses a Stack navigator with no header (screens handle their own UI)
 */

import { Stack } from "expo-router";
import { useEffect } from "react";

import { isSupabaseConfigured } from "@/src/services/env";
import { getSupabaseClient } from "@/src/services/supabase/client";

export default function AuthLayout() {
  useEffect(() => {
    console.log("Supabase configured?", isSupabaseConfigured());
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log("Session check: no client (env vars not loaded)");
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Session check:", { data, error });
    });
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="check-email" />
    </Stack>
  );
}

