/**
 * Onboarding Context - Manages onboarding state and user profile data
 * 
 * Provides:
 * - onboardingCompleted: boolean indicating if user finished onboarding
 * - isLoading: true while loading state from AsyncStorage
 * - profile: user's survey answers (exercise types, frequency, reasons)
 * - setOnboardingCompleted(): mark onboarding as done
 * - updateProfile(): save survey answers
 * - resetOnboarding(): clear onboarding state (for testing)
 */

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const ONBOARDING_COMPLETED_KEY = "@saveit_onboarding_completed";
const ONBOARDING_PROFILE_KEY = "@saveit_onboarding_profile";

// User's onboarding profile from surveys
export interface OnboardingProfile {
  exerciseTypes: string[];    // e.g., ["Yoga", "HIIT", "Cycling"]
  frequency: number;          // 1-7 days per week
  reasons: string[];          // e.g., ["Saving money", "Flexibility"]
  cookiesAccepted: boolean;   // Did user accept cookies
}

// Default empty profile
const defaultProfile: OnboardingProfile = {
  exerciseTypes: [],
  frequency: 3,
  reasons: [],
  cookiesAccepted: false,
};

// Shape of the context value
interface OnboardingContextType {
  onboardingCompleted: boolean;
  isLoading: boolean;
  profile: OnboardingProfile;
  setOnboardingCompleted: () => Promise<void>;
  updateProfile: (updates: Partial<OnboardingProfile>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * OnboardingProvider - Wrap your app with this to provide onboarding state
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingCompleted, setCompleted] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from AsyncStorage on mount
  useEffect(() => {
    loadOnboardingState();
  }, []);

  async function loadOnboardingState() {
    try {
      // Load completed status
      const completedStr = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (completedStr) {
        setCompleted(JSON.parse(completedStr));
      }

      // Load profile data
      const profileStr = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
      if (profileStr) {
        setProfile(JSON.parse(profileStr));
      }
    } catch (error) {
      console.error("Failed to load onboarding state:", error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Mark onboarding as completed
   * Call this after the user finishes the location screen
   */
  async function setOnboardingCompleted() {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, JSON.stringify(true));
      setCompleted(true);
    } catch (error) {
      console.error("Failed to save onboarding completed:", error);
    }
  }

  /**
   * Update the user's profile with survey answers
   * Pass partial updates - they will be merged with existing data
   */
  async function updateProfile(updates: Partial<OnboardingProfile>) {
    try {
      const newProfile = { ...profile, ...updates };
      await AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }

  /**
   * Reset onboarding state (useful for testing)
   */
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
 * Must be used within an OnboardingProvider
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
