/**
 * Auth — session role, optional Supabase later, and auth intent for role switching.
 *
 * - `role`: authenticated account type (customer | partner | admin).
 * - `authIntentRole`: set when user chooses “switch role”; cleared after sign-in/up or sign-out.
 *   Drives login/signup copy and locks role until they authenticate.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getSupabaseClient } from "./services/supabase/client";
import type { UserRole } from "./types/domain";

const AUTH_INTENT_KEY = "@saveit_auth_intent_role";

export type SignUpResult =
  | { ok: true; requiresEmailConfirmation: boolean }
  | { ok: false; error: string };

export type SignInResult = { ok: true } | { ok: false; error: string };

/**
 * Look up a profile row by user id. Returns null on missing row OR query
 * error (errors are logged; callers fall back to a default role).
 * Uses .maybeSingle() so a missing row resolves to null instead of throwing.
 */
async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ email: string | null; role: UserRole } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
  if (!data) return null;
  const role: UserRole =
    data.role === "customer" || data.role === "partner" || data.role === "admin"
      ? data.role
      : "customer";
  return {
    email: typeof data.email === "string" ? data.email : null,
    role,
  };
}

interface AuthState {
  isLoggedIn: boolean;
  userEmail: string | null;
  userId: string | null;
  role: UserRole;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  userId: string | null;
  role: UserRole;
  /** Next sign-in/sign-up role when user switched accounts (null = free choice on auth screens). */
  authIntentRole: UserRole | null;
  isLoading: boolean;
  isBeginningRoleSwitch: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<SignUpResult>;
  signIn: (email: string, password: string, role: UserRole) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** While logged in only — change role without re-auth (avoid for customer/partner; use beginRoleSwitch). */
  setRole: (role: UserRole) => Promise<void>;
  /** Sign out and queue intent so auth screens guide the user. */
  beginRoleSwitch: (target: "customer" | "partner") => Promise<void>;
  /** Clear intent and show full role choice on login/signup (e.g. “Wrong account type?”). */
  clearAuthIntent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseIntent(raw: string | null): UserRole | null {
  if (raw === "customer" || raw === "partner" || raw === "admin") return raw;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    userEmail: null,
    userId: null,
    role: "customer",
  });
  const [authIntentRole, setAuthIntentRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBeginningRoleSwitch, setIsBeginningRoleSwitch] = useState(false);

  // Mirror of state.userId for the onAuthStateChange listener, which captures
  // a stale closure over `state` otherwise. Updated whenever userId changes.
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = state.userId;
  }, [state.userId]);

  useEffect(() => {
    void loadAll();
  }, []);

  // Subscribe to Supabase auth events so external session changes (token
  // refresh, sign-out from another tab, email update) sync into local state.
  // Defensive: any failure inside the handler is logged, never thrown.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        try {
          if (event === "INITIAL_SESSION") {
            // loadAll handles startup hydration — skip to avoid double work.
            return;
          }

          if (event === "SIGNED_OUT" || !session) {
            // Clear state directly; do not call signOut() to avoid recursion.
            applyAuthState({
              isLoggedIn: false,
              userEmail: null,
              userId: null,
              role: "customer",
            });
            return;
          }

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            // No-op if we already reflect this user — avoids redundant fetch.
            if (userIdRef.current === session.user.id) return;
          }

          // SIGNED_IN (new user), TOKEN_REFRESHED (mismatch), or USER_UPDATED:
          // re-pull profile and rewrite state from the session.
          const profile = await fetchProfile(supabase, session.user.id);
          applyAuthState({
            isLoggedIn: true,
            userEmail: profile?.email ?? session.user.email ?? null,
            userId: session.user.id,
            role: profile?.role ?? "customer",
          });
        } catch (err) {
          console.error("onAuthStateChange handler failed:", err);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    try {
      // Role-switch intent is a UI preference, not auth state; lives in AsyncStorage.
      const intentRaw = await AsyncStorage.getItem(AUTH_INTENT_KEY);
      if (intentRaw) {
        setAuthIntentRoleState(parseIntent(intentRaw));
      }

      // Supabase session is the sole source of truth for auth state.
      // getSession() rehydrates from the AsyncStorage adapter on the client.
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Failed to get Supabase session:", error);
        return;
      }
      if (!data.session) return;

      const session = data.session;
      const profile = await fetchProfile(supabase, session.user.id);
      if (!profile) {
        console.error(
          "Authenticated user has no profile row; defaulting role to 'customer'.",
          { userId: session.user.id }
        );
      }
      applyAuthState({
        isLoggedIn: true,
        userEmail: profile?.email ?? session.user.email ?? null,
        userId: session.user.id,
        role: profile?.role ?? "customer",
      });
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const persistIntent = useCallback(async (role: UserRole | null) => {
    if (role == null) {
      await AsyncStorage.removeItem(AUTH_INTENT_KEY);
    } else {
      await AsyncStorage.setItem(AUTH_INTENT_KEY, role);
    }
    setAuthIntentRoleState(role);
  }, []);

  function applyAuthState(newState: AuthState) {
    setState(newState);
  }

  const clearAuthIntent = useCallback(async () => {
    await persistIntent(null);
  }, [persistIntent]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      roleFromForm: UserRole
    ): Promise<SignUpResult> => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { ok: false, error: "Supabase is not configured." };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { ok: false, error: error.message };
      }
      if (!data.user) {
        return {
          ok: false,
          error: "Sign up did not return a user. Please try again.",
        };
      }

      const userId = data.user.id;

      // Email confirmation is on → no session yet → auth.uid() is null on the
      // client. The profile insert relies on a permissive INSERT policy
      // (see supabase/migrations/002_profiles_insert_policy.sql). If the
      // insert fails we log and continue: the user already exists in
      // auth.users and a later sign-in can backfill the profile row.
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          role: roleFromForm,
        });
      if (profileError) {
        console.error(
          "Failed to insert profile during signup:",
          profileError
        );
      }

      // isLoggedIn stays false until the email is confirmed and the user
      // signs in (we surface email/userId in state so the check-email screen
      // can display them; the real session is owned by Supabase).
      applyAuthState({
        isLoggedIn: false,
        userEmail: email,
        userId,
        role: roleFromForm,
      });
      await persistIntent(null);

      return {
        ok: true,
        requiresEmailConfirmation: data.session === null,
      };
    },
    [persistIntent]
  );

  const signIn = useCallback(
    async (
      email: string,
      password: string,
      roleFromForm: UserRole
    ): Promise<SignInResult> => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { ok: false, error: "Supabase is not configured." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      if (!data.user) {
        return {
          ok: false,
          error: "Sign in did not return a user. Please try again.",
        };
      }

      const userId = data.user.id;

      // Look up the existing profile (maybeSingle → null on missing row).
      // Network/DB errors are already logged inside fetchProfile; we proceed
      // with profile=null so the user isn't blocked on a transient failure.
      const profile = await fetchProfile(supabase, userId);

      // Backfill: signUp's profile insert may have failed (network blip, RLS
      // misconfig); first successful sign-in self-heals. Failures here are
      // logged but do not block the user — they're authenticated.
      if (!profile) {
        const { error: backfillError } = await supabase
          .from("profiles")
          .insert({ id: userId, email, role: roleFromForm });
        if (backfillError) {
          console.error(
            "Profile backfill failed during sign-in:",
            backfillError
          );
        }
      }

      // Stored role wins (handles partner who signs in via the customer chip).
      // Form role is the fallback when profile is missing or its role is
      // unreadable (also covers the backfill-just-happened case).
      const effectiveRole: UserRole = profile?.role ?? roleFromForm;

      applyAuthState({
        isLoggedIn: true,
        userEmail: profile?.email ?? email,
        userId,
        role: effectiveRole,
      });
      await persistIntent(null);

      return { ok: true };
    },
    [persistIntent]
  );

  const signOut = useCallback(async () => {
    // Step 1: terminate the Supabase session (invalidates refresh token
    // server-side). Failures are logged but never propagated — local cleanup
    // must always proceed so a sign-out tap is reliable even when offline.
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase signOut failed:", error);
        }
      } catch (err) {
        console.error("Supabase signOut threw:", err);
      }
    }

    // Step 2: clear local state. The onAuthStateChange listener (Session 1c)
    // will also fire SIGNED_OUT and call applyAuthState with the same shape —
    // this direct call is idempotent and covers the "no supabase client"
    // path plus avoids a round-trip wait on the listener.
    applyAuthState({
      isLoggedIn: false,
      userEmail: null,
      userId: null,
      role: "customer",
    });

    // Step 3: clear any pending role-switch intent so the next visit to the
    // auth screens shows the full chip selector instead of a locked role.
    await persistIntent(null);
  }, [persistIntent]);

  const setRole = useCallback(async (role: UserRole) => {
    if (!state.isLoggedIn || !state.userEmail) return;
    applyAuthState({
      ...state,
      role,
    });
  }, [state]);

  const beginRoleSwitch = useCallback(
    async (target: "customer" | "partner") => {
      setIsBeginningRoleSwitch(true);
      try {
        await persistIntent(target);
        applyAuthState({
          isLoggedIn: false,
          userEmail: null,
          userId: null,
          role: "customer",
        });
      } finally {
        setIsBeginningRoleSwitch(false);
      }
    },
    [persistIntent]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      isLoggedIn: state.isLoggedIn,
      userEmail: state.userEmail,
      userId: state.userId,
      role: state.role,
      authIntentRole,
      isLoading,
      isBeginningRoleSwitch,
      signUp,
      signIn,
      signOut,
      setRole,
      beginRoleSwitch,
      clearAuthIntent,
    }),
    [
      state,
      authIntentRole,
      isLoading,
      isBeginningRoleSwitch,
      signUp,
      signIn,
      signOut,
      setRole,
      beginRoleSwitch,
      clearAuthIntent,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
