/**
 * Customer marketplace partner shape — mapped from Supabase studios + slots.
 *
 * PartnerCategory is a free-form slug from studios.payload.category (and now
 * from public.categories). Known values include fitness, padel, beauty,
 * wellness, yoga_flex, boxeo — plus legacy yoga/boxing. Unknown values pass
 * through so new category tiles keep working.
 */

export type PartnerCategory = string;

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  tags: string[];
  priceFrom: number;
  priceTo: number;
  discountPercent: number;
  rating: number;
  distanceKm: number;
  locationName: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}
