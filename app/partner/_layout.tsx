/**
 * Partner group - Stack for partner detail screen.
 */

import { Stack } from "expo-router";

export default function PartnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
