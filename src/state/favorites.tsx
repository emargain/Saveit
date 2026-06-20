/**
 * Favorites state — user-scoped favorite partner IDs.
 *
 * Storage model (Session 2e):
 *   - AsyncStorage (@saveit_favorites) is a write-through cache for instant
 *     UI on cold start. Still written on every mutation (strangler pattern —
 *     AsyncStorage writes removed in Session 2f).
 *   - Supabase (public.user_favorites) is the source of truth when a user is
 *     signed in. On sign-in: server data overrides local cache.
 *   - On sign-out: local cache is cleared so the next user on the same device
 *     doesn't inherit the previous user's favorites.
 *
 * Consumer API (unchanged): favoriteIds, isFavorite, toggleFavorite, isLoading.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../auth-context";
import {
  addFavorite,
  fetchUserFavorites,
  removeFavorite,
} from "../services/favorites-service";

const FAVORITES_STORAGE_KEY = "@saveit_favorites";

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
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as unknown) : [];
      setFavoriteIds(Array.isArray(ids) ? ids : []);
    } catch {
      setFavoriteIds([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncFromServer(uid: string) {
    const serverIds = await fetchUserFavorites(uid);
    setFavoriteIds(serverIds);
    // Mirror to AsyncStorage so the next cold start shows user-scoped data.
    void AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(serverIds));
  }

  async function clearLocal() {
    await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
    setFavoriteIds([]);
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

        // Optimistic update.
        setFavoriteIds(nextIds);
        void AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextIds));

        if (!effectiveUserId) return; // Not signed in — AsyncStorage only (strangler).

        const result = adding
          ? await addFavorite(effectiveUserId, id)
          : await removeFavorite(effectiveUserId, id);

        if (!result.ok) {
          // Roll back local state and AsyncStorage.
          setFavoriteIds(prevIds);
          void AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(prevIds));
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
