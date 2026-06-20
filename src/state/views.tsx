/**
 * View counts — user-scoped tracking per partner id.
 *
 * Storage model (Session 2e):
 *   - AsyncStorage (@saveit_views) is a write-through cache for instant UI
 *     on cold start. Still written on every mutation (strangler pattern —
 *     AsyncStorage writes removed in Session 2f).
 *   - Supabase (public.user_views) is the source of truth when a user is
 *     signed in. On sign-in: recent views are fetched and counts are
 *     reconstructed from the server data (last 50 views, which is sufficient
 *     for the piloto's "most visited" analytics).
 *   - On sign-out: local cache is cleared.
 *
 * Failure policy for recordView: no rollback. View counts are analytics data;
 * a locally-incremented count that fails to persist to the server is an
 * acceptable discrepancy. The next sign-in re-syncs from the authoritative
 * server counts.
 *
 * Consumer API (unchanged): viewCounts, incrementView, getViewCount,
 * getTopViewedIds.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { useAuth } from "../auth-context";
import { fetchRecentViews, recordView } from "../services/views-service";

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

  const { userId, isLoggedIn } = useAuth();
  const effectiveUserId = isLoggedIn ? userId : null;

  // Always-fresh refs so incrementView avoids stale closures.
  const viewCountsRef = useRef<ViewCounts>({});
  useEffect(() => {
    viewCountsRef.current = viewCounts;
  }, [viewCounts]);

  const effectiveUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    effectiveUserIdRef.current = effectiveUserId;
  }, [effectiveUserId]);

  const prevUserIdRef = useRef<string | null>(null);

  // Cold-start: load from AsyncStorage immediately for instant UI.
  useEffect(() => {
    void loadFromCache();
  }, []);

  // Sign-in / sign-out transitions.
  useEffect(() => {
    const prev = prevUserIdRef.current;
    const curr = effectiveUserId;
    prevUserIdRef.current = curr;

    if (prev && !curr) {
      void clearLocal();
      return;
    }
    if (curr) {
      void syncFromServer(curr);
    }
  }, [effectiveUserId]);

  async function loadFromCache() {
    try {
      const raw = await AsyncStorage.getItem(VIEWS_STORAGE_KEY);
      const counts = raw ? (JSON.parse(raw) as unknown) : {};
      setViewCounts(
        typeof counts === "object" && counts !== null ? (counts as ViewCounts) : {}
      );
    } catch {
      setViewCounts({});
    } finally {
      setIsLoaded(true);
    }
  }

  async function syncFromServer(uid: string) {
    const views = await fetchRecentViews(uid, 50);
    // Reconstruct counts map from individual view rows.
    const counts: ViewCounts = {};
    for (const v of views) {
      counts[v.studioId] = (counts[v.studioId] ?? 0) + 1;
    }
    setViewCounts(counts);
    void AsyncStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(counts));
  }

  async function clearLocal() {
    await AsyncStorage.removeItem(VIEWS_STORAGE_KEY);
    setViewCounts({});
  }

  const incrementView = useCallback((partnerId: string) => {
    const next: ViewCounts = {
      ...viewCountsRef.current,
      [partnerId]: (viewCountsRef.current[partnerId] ?? 0) + 1,
    };
    setViewCounts(next);
    void AsyncStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(next));

    const uid = effectiveUserIdRef.current;
    if (uid) {
      void recordView(uid, partnerId).then((result) => {
        if (!result.ok) {
          console.error("recordView Supabase write failed (view kept locally):", result.error);
          // No rollback — see failure policy in file header.
        }
      });
    }
  }, []); // Reads from refs — no state/prop deps needed.

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewCounts]
  );

  // Guard against rendering consumers before the cache is loaded.
  if (!isLoaded) {
    return <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>;
  }

  return <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>;
}

export function useViews(): ViewsContextType {
  const ctx = useContext(ViewsContext);
  if (ctx === undefined) {
    throw new Error("useViews must be used within ViewsProvider");
  }
  return ctx;
}
