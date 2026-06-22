/**
 * Favorites state — user-scoped favorite partner IDs.
 *
 * Storage model (Session 2e+):
 *   - Supabase (public.user_favorites) is the source of truth when signed in.
 *   - On sign-in: fetch from server into React context.
 *   - On sign-out: clear local state.
 *   - Optimistic UI on toggle; rolls back on Supabase write failure.
 *
 * Consumer API: favoriteIds, isFavorite, toggleFavorite, isLoading.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../auth-context";
import {
  addFavorite,
  fetchUserFavorites,
  removeFavorite,
} from "../services/favorites-service";

interface FavoritesContextType {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { userId, isLoggedIn } = useAuth();
  const effectiveUserId = isLoggedIn ? userId : null;

  // Always-fresh ref so toggleFavorite can read current ids without stale closure.
  const favoriteIdsRef = useRef<string[]>([]);
  useEffect(() => {
    favoriteIdsRef.current = favoriteIds;
  }, [favoriteIds]);

  const prevUserIdRef = useRef<string | null>(null);

  // Sign-in / sign-out transitions.
  useEffect(() => {
    const prev = prevUserIdRef.current;
    const curr = effectiveUserId;
    prevUserIdRef.current = curr;

    if (prev && !curr) {
      setFavoriteIds([]);
      setIsLoading(false);
      return;
    }
    if (curr) {
      void syncFromServer(curr);
      return;
    }
    setIsLoading(false);
  }, [effectiveUserId]);

  async function syncFromServer(uid: string) {
    setIsLoading(true);
    try {
      const serverIds = await fetchUserFavorites(uid);
      setFavoriteIds(serverIds);
    } finally {
      setIsLoading(false);
    }
  }

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      void (async () => {
        const prevIds = favoriteIdsRef.current;
        const adding = !prevIds.includes(id);
        const nextIds = adding
          ? [...prevIds, id]
          : prevIds.filter((x) => x !== id);

        setFavoriteIds(nextIds);

        if (!effectiveUserId) return;

        const result = adding
          ? await addFavorite(effectiveUserId, id)
          : await removeFavorite(effectiveUserId, id);

        if (!result.ok) {
          setFavoriteIds(prevIds);
          console.error("toggleFavorite Supabase write failed, rolled back:", result.error);
          // TODO: surface this failure as a toast/alert before piloto launch
        }
      })();
    },
    [effectiveUserId]
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorite, toggleFavorite, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (ctx === undefined) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
