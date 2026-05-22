/**
 * Location state - Current city persisted in AsyncStorage.
 * Used by Discover header and location picker. No GPS yet.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const LOCATION_STORAGE_KEY = "@saveit_location";

const DEFAULT_LOCATION = "Mexico City";

interface LocationContextType {
  currentLocation: string;
  setLocation: (city: string) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (saved?.trim()) {
          setCurrentLocation(saved.trim());
        }
      } catch {
        // keep default
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(LOCATION_STORAGE_KEY, currentLocation);
    }
  }, [currentLocation, isLoading]);

  const setLocation = useCallback((city: string) => {
    setCurrentLocation(city);
  }, []);

  const value: LocationContextType = {
    currentLocation,
    setLocation,
    isLoading,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const ctx = useContext(LocationContext);
  if (ctx === undefined) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}
