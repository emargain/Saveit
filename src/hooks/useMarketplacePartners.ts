import { useCallback, useEffect, useState } from "react";
import type { Partner } from "../data/partners";
import { listMarketplacePartners } from "../services/studio-service";

export function useMarketplacePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listMarketplacePartners();
      setPartners(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { partners, loading, error, refresh };
}
