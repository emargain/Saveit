/**
 * Local persistence when Supabase is not configured — MVP-friendly E2E flow.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ApprovalStatus,
  Booking,
  LocalStudioBundle,
  StudioEntity,
  TimeSlotInventory,
} from "../types/domain";
import { createId } from "../utils/id";

const STORAGE_KEY = "@saveit_local_marketplace_v1";

export interface LocalMarketplaceState {
  studios: LocalStudioBundle[];
}

async function loadState(): Promise<LocalMarketplaceState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { studios: [] };
    const parsed = JSON.parse(raw) as LocalMarketplaceState;
    return parsed?.studios ? parsed : { studios: [] };
  } catch {
    return { studios: [] };
  }
}

async function saveState(state: LocalMarketplaceState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getAllLocalBundles(): Promise<LocalStudioBundle[]> {
  const s = await loadState();
  return s.studios;
}

export async function getBundleForOwner(ownerUserId: string): Promise<LocalStudioBundle | null> {
  const s = await loadState();
  return s.studios.find((b) => b.studio.ownerUserId === ownerUserId) ?? null;
}

export async function getBundleByStudioId(studioId: string): Promise<LocalStudioBundle | null> {
  const s = await loadState();
  return s.studios.find((b) => b.studio.id === studioId) ?? null;
}

export async function upsertStudioBundle(bundle: LocalStudioBundle): Promise<void> {
  const s = await loadState();
  const idx = s.studios.findIndex((b) => b.studio.id === bundle.studio.id);
  if (idx >= 0) s.studios[idx] = bundle;
  else s.studios.push(bundle);
  await saveState(s);
}

export async function deleteStudioBundle(studioId: string): Promise<void> {
  const s = await loadState();
  s.studios = s.studios.filter((b) => b.studio.id !== studioId);
  await saveState(s);
}

/** Studios visible on the customer marketplace */
export async function listPublicApprovedStudios(): Promise<LocalStudioBundle[]> {
  const s = await loadState();
  return s.studios.filter((b) => b.studio.approvalStatus === "approved");
}

export async function listPendingForAdmin(): Promise<LocalStudioBundle[]> {
  const s = await loadState();
  return s.studios.filter(
    (b) =>
      b.studio.approvalStatus === "submitted" || b.studio.approvalStatus === "under_review"
  );
}

export async function setStudioApproval(
  studioId: string,
  status: ApprovalStatus,
  rejectionReason: string | null
): Promise<void> {
  const s = await loadState();
  const b = s.studios.find((x) => x.studio.id === studioId);
  if (!b) return;
  b.studio.approvalStatus = status;
  b.studio.rejectionReason = rejectionReason;
  b.studio.reviewedAt = new Date().toISOString();
  await saveState(s);
}

export function createEmptyStudio(ownerUserId: string): StudioEntity {
  const now = new Date().toISOString();
  return {
    id: createId("studio"),
    ownerUserId,
    name: "",
    brandName: null,
    description: null,
    category: "fitness",
    serviceTypes: [],
    amenities: [],
    location: {
      addressLine1: "",
      addressLine2: null,
      city: "",
      region: null,
      postalCode: null,
      country: "Mexico",
      lat: null,
      lng: null,
    },
    contact: {
      email: "",
      phone: "",
      websiteUrl: null,
      instagram: null,
      facebook: null,
    },
    logoUri: null,
    photoUris: [],
    averageClassPrice: 0,
    pricingRules: {
      averageRetailPrice: 0,
      minimumSaveItPrice: 0,
      preferredBehavior: "fixed_discount",
      defaultDiscountPercent: 30,
    },
    peakHours: [],
    offPeakOccupancy: { typicalPercent: 40, notes: null },
    demandByDayTime: [],
    schedules: [],
    cancellation: { freeCancelHoursBefore: 12, notes: null },
    taxLegal: { businessLegalName: null, taxIdPlaceholder: null, notes: null },
    approvalStatus: "draft",
    rejectionReason: null,
    submittedAt: null,
    reviewedAt: null,
    autoPublishSlots: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensureDraftBundle(ownerUserId: string): Promise<LocalStudioBundle> {
  const existing = await getBundleForOwner(ownerUserId);
  if (existing) return existing;
  const bundle: LocalStudioBundle = {
    studio: createEmptyStudio(ownerUserId),
    slots: [],
    bookings: [],
  };
  await upsertStudioBundle(bundle);
  return bundle;
}

export async function saveDraftStudio(studio: StudioEntity): Promise<void> {
  const s = await loadState();
  const idx = s.studios.findIndex((b) => b.studio.id === studio.id);
  studio.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    s.studios[idx].studio = studio;
  } else {
    s.studios.push({ studio, slots: [], bookings: [] });
  }
  await saveState(s);
}

export async function replaceSlots(studioId: string, slots: TimeSlotInventory[]): Promise<void> {
  const s = await loadState();
  const b = s.studios.find((x) => x.studio.id === studioId);
  if (!b) return;
  b.slots = slots;
  b.studio.updatedAt = new Date().toISOString();
  await saveState(s);
}

export async function addBooking(booking: Booking): Promise<void> {
  const s = await loadState();
  const b = s.studios.find((x) => x.studio.id === booking.studioId);
  if (!b) return;
  b.bookings.push(booking);
  const slot = b.slots.find((sl) => sl.id === booking.slotId);
  if (slot) {
    slot.capacityRemaining = Math.max(0, slot.capacityRemaining - booking.quantity);
  }
  await saveState(s);
}

export async function listBookingsForStudio(studioId: string): Promise<Booking[]> {
  const b = await getBundleByStudioId(studioId);
  return b?.bookings ?? [];
}
