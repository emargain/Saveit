/**
 * Favorites state - Persisted favorite partner IDs.
 * Store in AsyncStorage; tap heart to toggle; hearts reflect state across tabs.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

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

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        setFavoriteIds(Array.isArray(ids) ? ids : []);
      } catch {
        setFavoriteIds([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, isLoading]);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const value: FavoritesContextType = {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading,
  };

  return (
    <FavoritesContext.Provider value={value}>
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
