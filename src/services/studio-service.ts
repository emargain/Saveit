/**
 * Unified marketplace + partner operations.
 * Supabase when configured; local AsyncStorage + seed fallback otherwise.
 */

import type { Partner, PartnerCategory } from "../types/partner";
import type {
  ApprovalStatus,
  Booking,
  InventoryKind,
  LocalStudioBundle,
  PricingReason,
  StudioCategory,
  StudioEntity,
  TimeSlotInventory,
} from "../types/domain";
import type { Database, Json } from "../types/supabase";
import { isSupabaseConfigured } from "./env";
import { localBundleToPartner } from "./marketplace-mapper";
import {
  ensureDraftBundle,
  getBundleByStudioId,
  getBundleForOwner,
  listPublicApprovedStudios,
  replaceSlots,
  saveDraftStudio,
  setStudioApproval,
  upsertStudioBundle,
  listBookingsForStudio,
  listPendingForAdmin,
} from "./local-marketplace-store";
import { getSupabaseClient } from "./supabase/client";

type SlotRow = Database["public"]["Tables"]["slots"]["Row"];
type StudioRow = Database["public"]["Tables"]["studios"]["Row"];
type StudioQueryRow = StudioRow & { slots: SlotRow[] | null };

/** Expected shape of studios.payload JSONB (loose — validated at read time). */
interface StudioPayload {
  name?: string;
  brand?: string;
  description?: string;
  category?: string;
  serviceTypes?: string[];
  tags?: string[];
  photos?: string[];
  address?: {
    city?: string;
    region?: string;
    line1?: string;
    postal?: string;
    country?: string;
  };
  coordinates?: { lat?: number; lng?: number };
  contact?: { phone?: string; instagram?: string; email?: string };
  pricing?: {
    avgPriceMxn?: number;
    minPriceMxn?: number;
    defaultDiscountPct?: number;
    behavior?: string;
  };
  rating?: number;
  reviewCount?: number;
}

const STUDIO_WITH_SLOTS_SELECT = `
  id,
  owner_id,
  payload,
  approval_status,
  rejection_reason,
  submitted_at,
  reviewed_at,
  created_at,
  updated_at,
  slots (
    id,
    starts_at,
    duration_minutes,
    capacity,
    reserved_count,
    price_mxn,
    retail_price_mxn,
    status,
    inventory_kind,
    title,
    created_at,
    updated_at
  )
`;

let cachedSupabaseRows: StudioQueryRow[] | null = null;
const cachedBundleById = new Map<string, LocalStudioBundle>();
let cachedPriceMap = new Map<string, PricingResult>();

type PricingResult = {
  slotId: string;
  retailPrice: number;
  dynamicPrice: number;
  discountPct: number;
  reasons: string[];
};

const PRICING_REASONS: PricingReason[] = [
  "peak_hours",
  "off_peak_hours",
  "low_occupancy",
  "last_minute",
  "floor_applied",
  "no_rules_configured",
];

function isPricingReason(value: string): value is PricingReason {
  return (PRICING_REASONS as string[]).includes(value);
}

function pickPrimaryReason(reasons: string[]): PricingReason | null {
  const valid = reasons.filter(isPricingReason);
  if (valid.length === 0) return null;
  if (valid.every((r) => r === "peak_hours" || r === "no_rules_configured")) {
    return null;
  }
  const priority: PricingReason[] = [
    "floor_applied",
    "last_minute",
    "low_occupancy",
    "off_peak_hours",
  ];
  for (const reason of priority) {
    if (valid.includes(reason)) return reason;
  }
  return null;
}

// TODO: replace with a single batch SQL function (e.g. calculate_slot_prices(uuid[]))
// to collapse ~200 RPC calls on full marketplace load into one round trip.
async function computePricesForSlots(
  slotRows: SlotRow[]
): Promise<Map<string, PricingResult>> {
  if (slotRows.length === 0) return new Map();
  const supabase = getSupabaseClient();
  if (!supabase) return new Map();

  const results = await Promise.all(
    slotRows.map(async (slot) => {
      const { data, error } = await supabase.rpc("calculate_slot_price", {
        p_slot_id: slot.id,
      });
      if (error) {
        console.error("calculate_slot_price failed for slot", slot.id, error);
        return {
          slotId: slot.id,
          retailPrice: Number(slot.retail_price_mxn ?? slot.price_mxn),
          dynamicPrice: Number(slot.retail_price_mxn ?? slot.price_mxn),
          discountPct: 0,
          reasons: [] as string[],
        };
      }
      const row = Array.isArray(data) ? data[0] : data;
      return {
        slotId: slot.id,
        retailPrice: Number(row?.out_retail_price ?? slot.retail_price_mxn ?? slot.price_mxn),
        dynamicPrice: Number(row?.out_dynamic_price ?? slot.retail_price_mxn ?? slot.price_mxn),
        discountPct: Number(row?.out_discount_pct ?? 0),
        reasons: (row?.out_reasons ?? []) as string[],
      };
    })
  );

  return new Map(results.map((r) => [r.slotId, r]));
}

function invalidateMarketplaceCache(): void {
  cachedSupabaseRows = null;
  cachedBundleById.clear();
  cachedPriceMap = new Map();
}

export type BookingErrorCode =
  | "NOT_AUTHENTICATED"
  | "INVALID_QUANTITY"
  | "SLOT_NOT_FOUND"
  | "SLOT_NOT_LIVE"
  | "SLOT_IN_PAST"
  | "SLOT_FULL"
  | "UNKNOWN";

function parseBookingErrorCode(message: string): BookingErrorCode {
  if (message.includes("NOT_AUTHENTICATED")) return "NOT_AUTHENTICATED";
  if (message.includes("INVALID_QUANTITY")) return "INVALID_QUANTITY";
  if (message.includes("SLOT_NOT_FOUND")) return "SLOT_NOT_FOUND";
  if (message.includes("SLOT_NOT_LIVE")) return "SLOT_NOT_LIVE";
  if (message.includes("SLOT_IN_PAST")) return "SLOT_IN_PAST";
  if (message.includes("SLOT_FULL")) return "SLOT_FULL";
  return "UNKNOWN";
}

function parsePayload(raw: Json): StudioPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as StudioPayload;
}

function toPartnerCategory(category: string | undefined): PartnerCategory {
  if (!category || typeof category !== "string") return "fitness";
  const slug = category.trim().toLowerCase();
  if (!slug) return "fitness";

  // Legacy aliases → current marketplace slugs.
  if (slug === "recovery") return "wellness";
  if (slug === "yoga") return "yoga_flex";
  if (slug === "boxing") return "boxeo";

  // Pass through known and unknown slugs so new categories (yoga_flex, boxeo,
  // etc.) still render. Do not collapse unknown → fitness.
  // TODO: once all seed studios use public.categories slugs, drop the aliases above.
  return slug;
}

function toStudioCategory(category: string | undefined): StudioCategory {
  const valid: StudioCategory[] = [
    "fitness",
    "yoga",
    "pilates",
    "padel",
    "recovery",
    "wellness",
    "boxing",
    "beauty",
    "other",
  ];
  if (category && valid.includes(category as StudioCategory)) {
    return category as StudioCategory;
  }
  // Unknown payload categories (e.g. yoga_flex, boxeo) are not in StudioCategory;
  // map to the closest domain enum for partner-dashboard shapes only.
  const partner = toPartnerCategory(category);
  if (partner === "padel") return "padel";
  if (partner === "beauty") return "beauty";
  if (partner === "wellness") return "wellness";
  if (partner === "yoga_flex") return "yoga";
  if (partner === "boxeo") return "boxing";
  return "fitness";
}

function toInventoryKind(kind: string): InventoryKind {
  if (kind === "class" || kind === "court" || kind === "session" || kind === "other") {
    return kind;
  }
  return "other";
}

function filterLiveFutureSlots(slots: SlotRow[]): SlotRow[] {
  const now = Date.now();
  return slots
    .filter(
      (s) =>
        s.status === "live" &&
        new Date(s.starts_at).getTime() >= now &&
        s.reserved_count < s.capacity
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

function mapSlotRowToTimeSlotInventory(
  slot: SlotRow,
  serviceTypes: string[],
  pricing?: PricingResult
): TimeSlotInventory {
  const startsAt = new Date(slot.starts_at);
  const pad = (n: number) => String(n).padStart(2, "0");
  const nowIso = new Date().toISOString();
  const fallbackRetail = Number(slot.retail_price_mxn ?? slot.price_mxn);
  const fallbackDynamic = Number(slot.price_mxn);
  const retailPriceMxn = pricing?.retailPrice ?? fallbackRetail;
  const dynamicPriceMxn = pricing?.dynamicPrice ?? fallbackDynamic;
  const discountPct = pricing?.discountPct ?? 0;
  const allReasons = (pricing?.reasons ?? []).filter(isPricingReason);

  return {
    id: slot.id,
    title: slot.title ?? "Session",
    kind: toInventoryKind(slot.inventory_kind),
    serviceType: serviceTypes[0] ?? slot.title ?? "general",
    occursOnDate: slot.starts_at.slice(0, 10),
    dayOfWeek: startsAt.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    startTime: `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())}`,
    durationMinutes: slot.duration_minutes,
    capacityTotal: slot.capacity,
    capacityRemaining: Math.max(0, slot.capacity - slot.reserved_count),
    retailPrice: retailPriceMxn,
    saveItPrice: dynamicPriceMxn,
    retailPriceMxn,
    dynamicPriceMxn,
    priceMxn: dynamicPriceMxn,
    discountPct,
    primaryReason: pickPrimaryReason(pricing?.reasons ?? []),
    allReasons,
    isPeak: allReasons.includes("peak_hours"),
    isPaused: slot.status === "paused",
    publishStatus: slot.status === "draft" ? "draft" : "live",
    createdAt: slot.created_at ?? nowIso,
    updatedAt: slot.updated_at ?? slot.created_at ?? nowIso,
  };
}

function priceRangeFromSlotRows(
  liveSlots: SlotRow[],
  priceMap: Map<string, PricingResult>,
  pricing: StudioPayload["pricing"]
): { from: number; to: number; maxDiscountPct: number } {
  if (liveSlots.length > 0) {
    const dynamicPrices = liveSlots.map(
      (s) => priceMap.get(s.id)?.dynamicPrice ?? Number(s.price_mxn)
    );
    const discountPcts = liveSlots.map((s) => priceMap.get(s.id)?.discountPct ?? 0);
    return {
      from: Math.min(...dynamicPrices),
      to: Math.max(...dynamicPrices),
      maxDiscountPct: Math.max(...discountPcts),
    };
  }
  const min = pricing?.minPriceMxn ?? pricing?.avgPriceMxn ?? 25;
  const avg = pricing?.avgPriceMxn ?? min;
  return {
    from: Math.max(0, min),
    to: Math.max(min, avg),
    maxDiscountPct: pricing?.defaultDiscountPct ?? 0,
  };
}

function discountPercentFromPricing(
  liveSlots: SlotRow[],
  priceMap: Map<string, PricingResult>,
  pricing: StudioPayload["pricing"]
): number {
  const { maxDiscountPct } = priceRangeFromSlotRows(liveSlots, priceMap, pricing);
  if (maxDiscountPct > 0) return maxDiscountPct;
  const configured = pricing?.defaultDiscountPct;
  if (configured != null && configured > 0) return Math.round(configured);
  return 0;
}

function mapStudioRowToBundle(
  row: StudioQueryRow,
  priceMap: Map<string, PricingResult>
): LocalStudioBundle {
  const payload = parsePayload(row.payload);
  const serviceTypes = Array.isArray(payload.serviceTypes)
    ? payload.serviceTypes.filter((s): s is string => typeof s === "string")
    : [];
  const allSlots = Array.isArray(row.slots) ? row.slots : [];
  const liveSlots = filterLiveFutureSlots(allSlots);
  const now = row.created_at ?? new Date().toISOString();
  const updated = row.updated_at ?? now;
  const category = toStudioCategory(payload.category);
  const photos = Array.isArray(payload.photos)
    ? payload.photos.filter((p): p is string => typeof p === "string")
    : [];

  const studio: StudioEntity = {
    id: row.id,
    ownerUserId: row.owner_id,
    name: payload.name ?? "Studio",
    brandName: payload.brand ?? null,
    description: payload.description ?? null,
    category,
    serviceTypes,
    amenities: [],
    location: {
      addressLine1: payload.address?.line1 ?? "",
      addressLine2: null,
      city: payload.address?.city ?? "",
      region: payload.address?.region ?? null,
      postalCode: payload.address?.postal ?? null,
      country: payload.address?.country ?? "MX",
      lat: payload.coordinates?.lat ?? null,
      lng: payload.coordinates?.lng ?? null,
    },
    contact: {
      email: payload.contact?.email ?? "",
      phone: payload.contact?.phone ?? "",
      websiteUrl: null,
      instagram: payload.contact?.instagram ?? null,
      facebook: null,
    },
    logoUri: photos[0] ?? null,
    photoUris: photos,
    averageClassPrice: payload.pricing?.avgPriceMxn ?? payload.pricing?.minPriceMxn ?? 25,
    pricingRules: {
      averageRetailPrice: payload.pricing?.avgPriceMxn ?? 25,
      minimumSaveItPrice: payload.pricing?.minPriceMxn ?? 0,
      preferredBehavior: "fixed_discount",
      defaultDiscountPercent: payload.pricing?.defaultDiscountPct ?? null,
    },
    peakHours: [],
    offPeakOccupancy: { typicalPercent: 0, notes: null },
    demandByDayTime: [],
    schedules: [],
    cancellation: { freeCancelHoursBefore: 24, notes: null },
    taxLegal: { businessLegalName: null, taxIdPlaceholder: null, notes: null },
    approvalStatus: row.approval_status as ApprovalStatus,
    rejectionReason: row.rejection_reason,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    autoPublishSlots: true,
    createdAt: now,
    updatedAt: updated,
  };

  return {
    studio,
    slots: liveSlots.map((s) => mapSlotRowToTimeSlotInventory(s, serviceTypes, priceMap.get(s.id))),
    bookings: [],
  };
}

/** Maps a Supabase studio row (+ nested slots) to the customer Partner card model. */
function mapStudioRowToPartner(
  row: StudioQueryRow,
  priceMap: Map<string, PricingResult>,
  distanceKm = 1
): Partner {
  const payload = parsePayload(row.payload);
  const serviceTypes = Array.isArray(payload.serviceTypes)
    ? payload.serviceTypes.filter((s): s is string => typeof s === "string")
    : [];
  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter((t): t is string => typeof t === "string")
    : [];
  const photos = Array.isArray(payload.photos)
    ? payload.photos.filter((p): p is string => typeof p === "string")
    : [];
  const allSlots = Array.isArray(row.slots) ? row.slots : [];
  const liveSlots = filterLiveFutureSlots(allSlots);
  const { from, to } = priceRangeFromSlotRows(
    liveSlots,
    priceMap,
    payload.pricing
  );
  const category = toPartnerCategory(payload.category);

  return {
    id: row.id,
    name: payload.name ?? "Studio",
    category,
    tags: tags.length > 0 ? tags : serviceTypes.length > 0 ? serviceTypes : [category],
    priceFrom: Math.round(from),
    priceTo: Math.round(to),
    discountPercent: discountPercentFromPricing(liveSlots, priceMap, payload.pricing),
    rating: typeof payload.rating === "number" ? payload.rating : 4.8,
    distanceKm,
    locationName: payload.address?.city ?? payload.address?.region ?? "CDMX",
    lat: payload.coordinates?.lat ?? 0,
    lng: payload.coordinates?.lng ?? 0,
    imageUrl: photos[0] ?? null,
  };
}

async function cacheSupabaseRows(rows: StudioQueryRow[]): Promise<void> {
  cachedSupabaseRows = rows;
  cachedBundleById.clear();

  const allLiveSlots: SlotRow[] = [];
  for (const row of rows) {
    const slots = Array.isArray(row.slots) ? row.slots : [];
    allLiveSlots.push(...filterLiveFutureSlots(slots));
  }
  cachedPriceMap = await computePricesForSlots(allLiveSlots);

  for (const row of rows) {
    cachedBundleById.set(row.id, mapStudioRowToBundle(row, cachedPriceMap));
  }
}

async function fetchApprovedStudiosFromSupabase(): Promise<StudioQueryRow[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("studios")
    .select(STUDIO_WITH_SLOTS_SELECT)
    .eq("approval_status", "approved")
    .order("starts_at", { foreignTable: "slots", ascending: true });

  if (error) {
    console.error("[studio-service] fetch studios failed:", error.message);
    return null;
  }

  return (data ?? []) as StudioQueryRow[];
}

async function fetchStudioByIdFromSupabase(studioId: string): Promise<StudioQueryRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("studios")
    .select(STUDIO_WITH_SLOTS_SELECT)
    .eq("id", studioId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    console.error("[studio-service] fetch studio by id failed:", error.message);
    return null;
  }

  return (data as StudioQueryRow | null) ?? null;
}

async function loadSupabaseMarketplacePartners(): Promise<Partner[]> {
  if (cachedSupabaseRows) {
    return cachedSupabaseRows.map((row) => mapStudioRowToPartner(row, cachedPriceMap));
  }

  const rows = await fetchApprovedStudiosFromSupabase();
  if (rows === null) return [];

  await cacheSupabaseRows(rows);
  return rows.map((row) => mapStudioRowToPartner(row, cachedPriceMap));
}

async function resolveSupabaseBundle(studioId: string): Promise<LocalStudioBundle | null> {
  const cached = cachedBundleById.get(studioId);
  if (cached) return cached;

  if (!cachedSupabaseRows) {
    await loadSupabaseMarketplacePartners();
    const afterList = cachedBundleById.get(studioId);
    if (afterList) return afterList;
  }

  const row = await fetchStudioByIdFromSupabase(studioId);
  if (!row) return null;

  const liveSlots = filterLiveFutureSlots(Array.isArray(row.slots) ? row.slots : []);
  const priceMap = await computePricesForSlots(liveSlots);
  const bundle = mapStudioRowToBundle(row, priceMap);
  cachedBundleById.set(studioId, bundle);
  return bundle;
}

async function listFallbackPartners(): Promise<Partner[]> {
  console.warn("studio-service: Supabase not configured; using local marketplace fallback");
  const approved = await listPublicApprovedStudios();
  return approved.map((b) => localBundleToPartner(b));
}

export async function listMarketplacePartners(): Promise<Partner[]> {
  if (isSupabaseConfigured()) {
    return loadSupabaseMarketplacePartners();
  }
  return listFallbackPartners();
}

export async function getMarketplacePartnerById(id: string): Promise<Partner | null> {
  if (isSupabaseConfigured()) {
    if (cachedSupabaseRows) {
      const row = cachedSupabaseRows.find((r) => r.id === id);
      if (row) return mapStudioRowToPartner(row, cachedPriceMap);
    }
    const row = await fetchStudioByIdFromSupabase(id);
    if (row) {
      const liveSlots = filterLiveFutureSlots(Array.isArray(row.slots) ? row.slots : []);
      const priceMap = await computePricesForSlots(liveSlots);
      cachedBundleById.set(id, mapStudioRowToBundle(row, priceMap));
      return mapStudioRowToPartner(row, priceMap);
    }
    return null;
  }
  const all = await listMarketplacePartners();
  return all.find((p) => p.id === id) ?? null;
}

export async function getLocalBundleForPartnerId(studioId: string): Promise<LocalStudioBundle | null> {
  if (isSupabaseConfigured()) {
    return resolveSupabaseBundle(studioId);
  }
  return getBundleByStudioId(studioId);
}

export async function loadPartnerStudio(userId: string): Promise<LocalStudioBundle | null> {
  if (isSupabaseConfigured()) {
    // Placeholder for Supabase owner lookup
  }
  return getBundleForOwner(userId);
}

export async function savePartnerDraft(studio: StudioEntity): Promise<void> {
  studio.updatedAt = new Date().toISOString();
  await saveDraftStudio(studio);
}

/** MVP: no admin approval — studio goes live for the partner immediately. */
export async function submitPartnerApplication(studio: StudioEntity): Promise<void> {
  const now = new Date().toISOString();
  studio.approvalStatus = "approved";
  studio.submittedAt = now;
  studio.reviewedAt = now;
  studio.rejectionReason = null;
  studio.updatedAt = now;
  const bundle = await getBundleForOwner(studio.ownerUserId);
  const slots = (bundle?.slots ?? []).map((s) => ({
    ...s,
    publishStatus:
      s.publishStatus === "draft" || s.publishStatus === "pending_review"
        ? ("live" as const)
        : s.publishStatus,
  }));
  await upsertStudioBundle({ studio, slots, bookings: bundle?.bookings ?? [] });
}

export async function markPartnerUnderReview(studioId: string): Promise<void> {
  const b = await getBundleByStudioId(studioId);
  if (!b) return;
  b.studio.approvalStatus = "under_review";
  await upsertStudioBundle(b);
}

export async function setApprovalForStudio(
  studioId: string,
  status: ApprovalStatus,
  rejectionReason: string | null
): Promise<void> {
  await setStudioApproval(studioId, status, rejectionReason);
  if (status === "approved") {
    const b = await getBundleByStudioId(studioId);
    if (b) {
      b.slots = b.slots.map((s) => {
        if (s.publishStatus === "pending_review" || s.publishStatus === "draft") {
          return { ...s, publishStatus: "live" as const };
        }
        return s;
      });
      await upsertStudioBundle(b);
    }
  }
}

export async function listAdminPendingStudios(): Promise<LocalStudioBundle[]> {
  return listPendingForAdmin();
}

function resolveSlotPublishStatus(
  studio: StudioEntity,
  slot: TimeSlotInventory
): "live" | "pending_review" | "draft" {
  if (studio.approvalStatus === "approved") return "live";
  if (studio.approvalStatus === "draft" || studio.approvalStatus === "rejected") return "draft";
  // Legacy non-draft statuses: treat as live for MVP (no approval queue).
  return slot.publishStatus === "draft" ? "draft" : "live";
}

export async function upsertInventorySlots(
  studio: StudioEntity,
  slots: TimeSlotInventory[]
): Promise<void> {
  const now = new Date().toISOString();
  const normalized = slots.map((s) => ({
    ...s,
    publishStatus: resolveSlotPublishStatus(studio, s),
    updatedAt: now,
  }));
  await replaceSlots(studio.id, normalized);
}

export async function createCustomerBooking(params: {
  studioId: string;
  slotId: string;
  customerUserId: string;
  customerEmail: string | null;
  quantity: number;
}): Promise<
  | { ok: true; bookingId: string }
  | { ok: false; errorCode: BookingErrorCode; error: string }
> {
  void params.studioId;
  void params.customerUserId;
  void params.customerEmail;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      errorCode: "UNKNOWN",
      error: "Supabase is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("create_booking", {
    p_slot_id: params.slotId,
    p_quantity: params.quantity,
  });

  if (error) {
    const errorCode = parseBookingErrorCode(error.message);
    console.error("[studio-service] create_booking failed:", error);
    return { ok: false, errorCode, error: error.message };
  }

  const row = data?.[0];
  if (!row?.out_booking_id) {
    return {
      ok: false,
      errorCode: "UNKNOWN",
      error: "Empty response from create_booking.",
    };
  }

  invalidateMarketplaceCache();
  return { ok: true, bookingId: row.out_booking_id };
}

export async function getPartnerBookings(studioId: string): Promise<Booking[]> {
  return listBookingsForStudio(studioId);
}

export { ensureDraftBundle };
