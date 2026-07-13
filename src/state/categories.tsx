/**
 * Categories state — global marketplace category list.
 *
 * Fetched once on mount from Supabase (public.categories). Categories change
 * rarely; reload the app to pick up edits. Not user-scoped.
 *
 * Consumer API: categories, isLoading.
 */

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  fetchCategories,
  type Category,
} from "../services/categories-service";

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const list = await fetchCategories();
        setCategories(list);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, isLoading }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextType {
  const ctx = useContext(CategoriesContext);
  if (ctx === undefined) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
}
