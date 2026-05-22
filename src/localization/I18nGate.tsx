import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { initI18n } from "./i18n";
import { colors } from "../ui/theme";

export function I18nGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initI18n().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.babyBlue,
  },
});
