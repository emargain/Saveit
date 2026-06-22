/**
 * Customer marketplace partner shape — mapped from Supabase studios + slots.
 */

export type PartnerCategory = "fitness" | "padel" | "beauty" | "wellness";

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
