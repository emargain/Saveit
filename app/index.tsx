/**
 * Entry screen — gates between auth and customer app.
 * No useEffect, no router.replace, no role logic.
 * Just reads auth state and returns a single <Redirect>.
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../src/auth-context";
import { colors } from "../src/ui/theme";

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.babyBlue,
  },
});
