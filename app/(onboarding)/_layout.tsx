/**
 * Onboarding Layout - Contains all onboarding screens
 * 
 * Flow: cookies -> about -> survey-exercise -> survey-frequency -> survey-reasons -> location -> complete
 * 
 * Uses a Stack navigator with no header (screens handle their own UI)
 */

import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="cookies" />
      <Stack.Screen name="about" />
      <Stack.Screen name="survey-exercise" />
      <Stack.Screen name="survey-frequency" />
      <Stack.Screen name="survey-reasons" />
      <Stack.Screen name="location" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
