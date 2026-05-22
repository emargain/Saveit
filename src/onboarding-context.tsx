/**
 * Onboarding Context — preferences state for the wizard + profile screen.
 *
 * Storage model (Session 2b):
 *   - AsyncStorage is a write-through cache for instant local state, also
 *     used as the staging area for preferences entered before email
 *     confirmation completes (no Supabase session yet).
 *   - Supabase (public.user_preferences) is the source of truth when a user
 *     is signed in. On sign-in: server data overrides local; if server has
 *     none AND local has meaningful data, local is flushed up.
 *   - On sign-out: local cache is wiped so the next user on the same device
 *     doesn't inherit the previous user's preferences.
 *
 * Consumer API (unchanged from pre-2b): onboardingCompleted, profile,
 * setOnboardingCompleted, updateProfile, resetOnboarding.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "./auth-context";
import {
  fetchUserPreferences,
  upsertUserPreferences,
  type OnboardingPreferences,
} from "./services/preferences-service";

const ONBOARDING_COMPLETED_KEY = "@saveit_onboarding_completed";
const ONBOARDING_PROFILE_KEY = "@saveit_onboarding_profile";

export interface OnboardingProfile {
  exerciseTypes: string[];
  /** null = user hasn't picked a frequency yet (distinguishes "default" from "explicit value"). */
  frequency: number | null;
  reasons: string[];
  cookiesAccepted: boolean;
}

const defaultProfile: OnboardingProfile = {
  exerciseTypes: [],
  frequency: null,
  reasons: [],
  cookiesAccepted: false,
};

interface OnboardingContextType {
  onboardingCompleted: boolean;
  isLoading: boolean;
  profile: OnboardingProfile;
  setOnboardingCompleted: () => Promise<void>;
  updateProfile: (updates: Partial<OnboardingProfile>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Project the wizard's OnboardingProfile shape down to what user_preferences
 * stores. `reasons` and `cookiesAccepted` are intentionally client-only —
 * see judgment-call note in the session 2b report.
 */
function profileToPrefs(p: OnboardingProfile): OnboardingPreferences {
  return {
    exerciseTypes: p.exerciseTypes,
    frequencyPerWeek: p.frequency,
    motivation: null,
  };
}

function hasMeaningfulPrefs(p: OnboardingProfile): boolean {
  return p.exerciseTypes.length > 0 || p.frequency !== null;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingCompleted, setCompleted] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  const { userId, isLoggedIn } = useAuth();

  // Mirror profile in a ref so setOnboardingCompleted reads the freshest
  // value when it upserts, avoiding stale-closure issues if the wizard
  // chains updateProfile() and setOnboardingCompleted() in the same tick.
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Track sign-in/sign-out transitions. Only treat a user as "logged in"
  // when both isLoggedIn AND userId are truthy — this matters because
  // signUp sets userId immediately while isLoggedIn stays false until the
  // user confirms their email and explicitly signs in.
  const effectiveUserId = isLoggedIn ? userId : null;
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    void loadFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = previousUserIdRef.current;
    const curr = effectiveUserId;
    previousUserIdRef.current = curr;

    if (prev && !curr) {
      void clearLocal();
      return;
    }
    if (curr) {
      void syncFromServerOrFlush(curr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  async function loadFromCache() {
    try {
      const completedStr = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (completedStr) setCompleted(JSON.parse(completedStr));

      const profileStr = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
      if (profileStr) setProfile(JSON.parse(profileStr));
    } catch (error) {
      console.error("Failed to load onboarding cache:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function clearLocal() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
      setCompleted(false);
      setProfile(defaultProfile);
    } catch (error) {
      console.error("Failed to clear onboarding cache:", error);
    }
  }

  async function syncFromServerOrFlush(uid: string) {
    try {
      const server = await fetchUserPreferences(uid);

      if (server) {
        // Server wins. Override exerciseTypes + frequency; preserve client-
        // only fields (reasons, cookiesAccepted) from whatever is currently
        // in state.
        setProfile((prev) => {
          const merged: OnboardingProfile = {
            ...prev,
            exerciseTypes: server.exerciseTypes,
            frequency: server.frequencyPerWeek ?? prev.frequency,
          };
          // Write-through cache; fire-and-forget.
          void AsyncStorage.setItem(
            ONBOARDING_PROFILE_KEY,
            JSON.stringify(merged)
          );
          return merged;
        });
        return;
      }

      // Server has nothing. Check AsyncStorage directly (not React state) to
      // avoid races with the on-mount loadFromCache effect.
      const localRaw = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
      if (!localRaw) return;
      const local = JSON.parse(localRaw) as OnboardingProfile;
      if (!hasMeaningfulPrefs(local)) return;

      const result = await upsertUserPreferences(uid, profileToPrefs(local));
      if (result.ok) {
        console.info(
          "Flushed pending local preferences to Supabase on sign-in"
        );
      } else {
        console.error(
          "Failed to flush local preferences on sign-in:",
          result.error
        );
      }
    } catch (error) {
      console.error("syncFromServerOrFlush threw:", error);
    }
  }

  async function setOnboardingCompleted() {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, JSON.stringify(true));
      setCompleted(true);
    } catch (error) {
      console.error("Failed to save onboarding completed:", error);
    }

    // Upsert to Supabase only when we have a real signed-in user. If userId
    // is set but isLoggedIn is false (email confirmation pending), skip;
    // the first sign-in will pick this up via syncFromServerOrFlush.
    if (isLoggedIn && userId) {
      const result = await upsertUserPreferences(
        userId,
        profileToPrefs(profileRef.current)
      );
      if (!result.ok) {
        console.error(
          "Failed to upsert preferences on completion:",
          result.error
        );
      }
    }
  }

  async function updateProfile(updates: Partial<OnboardingProfile>) {
    try {
      const newProfile = { ...profile, ...updates };
      await AsyncStorage.setItem(
        ONBOARDING_PROFILE_KEY,
        JSON.stringify(newProfile)
      );
      setProfile(newProfile);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }

  async function resetOnboarding() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
      setCompleted(false);
      setProfile(defaultProfile);
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        onboardingCompleted,
        isLoading,
        profile,
        setOnboardingCompleted,
        updateProfile,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * useOnboarding hook - Access onboarding state and functions
 * Must be used within an OnboardingProvider.
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
