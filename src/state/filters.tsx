/**
 * Filters state - Price range, min rating, tags.
 * Applied to partner list when user taps Apply in filters modal.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Partner } from "../types/partner";

export interface FilterState {
  priceMin: number;
  priceMax: number;
  minRating: number;
  selectedTags: string[];
}

// Price filter ceiling is in MXN. Set high enough to include current seed
// data (max 540 MXN for peak padel) plus headroom for premium studios.
const DEFAULT_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 1000,
  minRating: 0,
  selectedTags: [],
};

interface FiltersContextType {
  filters: FilterState;
  applyFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  matchesFilters: (partner: Partner) => boolean;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function matchesPartnerFilters(partner: Partner, filters: FilterState): boolean {
  if (partner.priceFrom > filters.priceMax || partner.priceTo < filters.priceMin) {
    return false;
  }
  if (partner.rating < filters.minRating) {
    return false;
  }
  if (filters.selectedTags.length > 0) {
    const hasTag = partner.tags.some((t) => filters.selectedTags.includes(t));
    if (!hasTag) return false;
  }
  return true;
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const applyFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const matchesFilters = useCallback(
    (partner: Partner) => matchesPartnerFilters(partner, filters),
    [filters]
  );

  const value = useMemo<FiltersContextType>(
    () => ({ filters, applyFilters, resetFilters, matchesFilters }),
    [filters, applyFilters, resetFilters, matchesFilters]
  );

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextType {
  const ctx = useContext(FiltersContext);
  if (ctx === undefined) {
    throw new Error("useFilters must be used within FiltersProvider");
  }
  return ctx;
}

export { DEFAULT_FILTERS };
