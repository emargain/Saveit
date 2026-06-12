/**
 * Root layout — customer-only mobile app.
 * No role switching, no partner routes, no admin routes in the navigation tree.
 * Simple auth gate: loading → auth screens → customer tabs.
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "../src/auth-context";
import { I18nGate } from "../src/localization/I18nGate";
import { OnboardingProvider } from "../src/onboarding-context";
import { wipeStaleLocalBlobIfNeeded } from "../src/services/migrations";
import { FavoritesProvider } from "../src/state/favorites";
import { FiltersProvider } from "../src/state/filters";
import { LocationProvider } from "../src/state/location";
import { ViewsProvider } from "../src/state/views";

export default function RootLayout() {
  useEffect(() => {
    void wipeStaleLocalBlobIfNeeded();
  }, []);

  return (
    <I18nGate>
      <AuthProvider>
        <OnboardingProvider>
          <FavoritesProvider>
            <FiltersProvider>
              <ViewsProvider>
                <LocationProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(onboarding)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="partner" />
                    <Stack.Screen name="booking" />
                    <Stack.Screen name="location-picker" />
                    <Stack.Screen name="filters" options={{ presentation: "modal" }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  </Stack>
                  <StatusBar style="dark" />
                </LocationProvider>
              </ViewsProvider>
            </FiltersProvider>
          </FavoritesProvider>
        </OnboardingProvider>
      </AuthProvider>
    </I18nGate>
  );
}
