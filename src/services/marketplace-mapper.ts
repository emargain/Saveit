import type { Partner, PartnerCategory } from "../types/partner";
import type { LocalStudioBundle, StudioCategory } from "../types/domain";

function mapCategory(c: StudioCategory): PartnerCategory {
  switch (c) {
    case "padel":
      return "padel";
    case "beauty":
      return "beauty";
    case "wellness":
    case "recovery":
      return "wellness";
    default:
      return "fitness";
  }
}

function priceRangeFromSlots(bundle: LocalStudioBundle): { from: number; to: number } {
  const live = bundle.slots.filter((s) => s.publishStatus === "live" && !s.isPaused);
  if (live.length === 0) {
    const avg = bundle.studio.pricingRules.averageRetailPrice || bundle.studio.averageClassPrice;
    return { from: Math.max(0, avg * 0.5), to: avg || 25 };
  }
  const prices = live.map((s) => s.dynamicPriceMxn ?? s.saveItPrice);
  return { from: Math.min(...prices), to: Math.max(...prices) };
}

function discountPercent(bundle: LocalStudioBundle): number {
  const live = bundle.slots.filter((s) => s.publishStatus === "live" && !s.isPaused);
  const fromSlots = live.length > 0 ? Math.max(...live.map((s) => s.discountPct ?? 0)) : 0;
  if (fromSlots > 0) return fromSlots;
  const d = bundle.studio.pricingRules.defaultDiscountPercent;
  if (d != null && d > 0) return Math.round(d);
  return 0;
}

/**
 * Maps an approved local studio bundle to the customer `Partner` card model.
 */
export function localBundleToPartner(bundle: LocalStudioBundle, distanceKm = 1): Partner {
  const { from, to } = priceRangeFromSlots(bundle);
  const s = bundle.studio;
  return {
    id: s.id,
    name: s.name || "Studio",
    category: mapCategory(s.category),
    tags: s.serviceTypes.length > 0 ? s.serviceTypes : [s.category],
    priceFrom: Math.round(from),
    priceTo: Math.round(to),
    discountPercent: discountPercent(bundle),
    rating: 4.8,
    distanceKm,
    locationName: s.location.city || s.location.country,
    lat: s.location.lat ?? 0,
    lng: s.location.lng ?? 0,
    imageUrl: s.photoUris[0] ?? s.logoUri,
  };
}
