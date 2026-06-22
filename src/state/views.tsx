/**
 * View counts — user-scoped tracking per partner id.
 *
 * Storage model (Session 2e+):
 *   - Supabase (public.user_views) is the source of truth when signed in.
 *   - On sign-in: recent views are fetched and counts reconstructed (last 50).
 *   - On sign-out: clear local state.
 *
 * Failure policy for recordView: no rollback. View counts are analytics data;
 * a locally-incremented count that fails to persist to the server is an
 * acceptable discrepancy. The next sign-in re-syncs from the server.
 *
 * Consumer API: viewCounts, incrementView, getViewCount, getTopViewedIds.
 */

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

  // Sign-in / sign-out transitions.
  useEffect(() => {
    const prev = prevUserIdRef.current;
    const curr = effectiveUserId;
    prevUserIdRef.current = curr;

    if (prev && !curr) {
      setViewCounts({});
      return;
    }
    if (curr) {
      void syncFromServer(curr);
    }
  }, [effectiveUserId]);

  async function syncFromServer(uid: string) {
    const views = await fetchRecentViews(uid, 50);
    const counts: ViewCounts = {};
    for (const v of views) {
      counts[v.studioId] = (counts[v.studioId] ?? 0) + 1;
    }
    setViewCounts(counts);
  }

  const incrementView = useCallback((partnerId: string) => {
    const next: ViewCounts = {
      ...viewCountsRef.current,
      [partnerId]: (viewCountsRef.current[partnerId] ?? 0) + 1,
    };
    setViewCounts(next);

    const uid = effectiveUserIdRef.current;
    if (uid) {
      void recordView(uid, partnerId).then((result) => {
        if (!result.ok) {
          console.error("recordView Supabase write failed (view kept locally):", result.error);
        }
      });
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewCounts]
  );

  return <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>;
}

export function useViews(): ViewsContextType {
  const ctx = useContext(ViewsContext);
  if (ctx === undefined) {
    throw new Error("useViews must be used within ViewsProvider");
  }
  return ctx;
}
