/**
 * View counts - Local tracking per partner id, persisted in AsyncStorage.
 * Used when user opens partner details; powers Profile analytics.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

const VIEWS_STORAGE_KEY = "@saveit_views";

export type ViewCounts = Record<string, number>;

interface ViewsContextType {
  viewCounts: ViewCounts;
  incrementView: (partnerId: string) => void;
  getViewCount: (partnerId: string) => number;
  getTopViewedIds: (limit: number) => string[];
}

const ViewsContext = createContext<ViewsContextType | undefined>(undefined);

export function ViewsProvider({ children }: { children: ReactNode }) {
  const [viewCounts, setViewCounts] = useState<ViewCounts>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(VIEWS_STORAGE_KEY);
        const counts = raw ? JSON.parse(raw) : {};
        setViewCounts(typeof counts === "object" && counts !== null ? counts : {});
      } catch {
        setViewCounts({});
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(viewCounts));
  }, [viewCounts, isLoaded]);

  const incrementView = useCallback((partnerId: string) => {
    setViewCounts((prev) => ({
      ...prev,
      [partnerId]: (prev[partnerId] ?? 0) + 1,
    }));
  }, []);

  const getViewCount = useCallback(
    (partnerId: string) => viewCounts[partnerId] ?? 0,
    [viewCounts]
  );

  const getTopViewedIds = useCallback(
    (limit: number) => {
      return Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);
    },
    [viewCounts]
  );

  const value = useMemo<ViewsContextType>(
    () => ({ viewCounts, incrementView, getViewCount, getTopViewedIds }),
    [viewCounts, incrementView, getViewCount, getTopViewedIds]
  );

  return (
    <ViewsContext.Provider value={value}>
      {children}
    </ViewsContext.Provider>
  );
}

export function useViews(): ViewsContextType {
  const ctx = useContext(ViewsContext);
  if (ctx === undefined) {
    throw new Error("useViews must be used within ViewsProvider");
  }
  return ctx;
}
