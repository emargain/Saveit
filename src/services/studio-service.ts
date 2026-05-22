/**
 * Unified marketplace + partner operations.
 * Local AsyncStorage when Supabase is not configured; extend with Supabase sync later.
 */

import { partners as seedPartners } from "../data/partners";
import type { Partner } from "../data/partners";
import type {
  ApprovalStatus,
  Booking,
  LocalStudioBundle,
  StudioEntity,
  TimeSlotInventory,
} from "../types/domain";
import { createId } from "../utils/id";
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
  addBooking,
  listBookingsForStudio,
  listPendingForAdmin,
} from "./local-marketplace-store";

export async function listMarketplacePartners(): Promise<Partner[]> {
  if (isSupabaseConfigured()) {
    // Placeholder: wire supabase.from('studios').select() when payload mapping is added
  }
  const approved = await listPublicApprovedStudios();
  const dynamic = approved.map((b) => localBundleToPartner(b));
  const existingIds = new Set(dynamic.map((p) => p.id));
  const merged = [
    ...dynamic,
    ...seedPartners.filter((p) => !existingIds.has(p.id)),
  ];
  return merged;
}

export async function getMarketplacePartnerById(id: string): Promise<Partner | null> {
  const all = await listMarketplacePartners();
  return all.find((p) => p.id === id) ?? null;
}

export async function getLocalBundleForPartnerId(studioId: string): Promise<LocalStudioBundle | null> {
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
}): Promise<{ ok: boolean; error?: string }> {
  const bundle = await getBundleByStudioId(params.studioId);
  if (!bundle) return { ok: false, error: "studio_not_found" };
  if (bundle.studio.approvalStatus !== "approved") return { ok: false, error: "not_public" };
  const slot = bundle.slots.find((s) => s.id === params.slotId);
  if (!slot || slot.publishStatus !== "live" || slot.isPaused)
    return { ok: false, error: "slot_unavailable" };
  if (slot.capacityRemaining < params.quantity) return { ok: false, error: "capacity" };

  const booking: Booking = {
    id: createId("book"),
    studioId: params.studioId,
    slotId: params.slotId,
    customerUserId: params.customerUserId,
    customerEmail: params.customerEmail,
    quantity: params.quantity,
    totalPrice: slot.saveItPrice * params.quantity,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  await addBooking(booking);
  return { ok: true };
}

export async function getPartnerBookings(studioId: string): Promise<Booking[]> {
  return listBookingsForStudio(studioId);
}

export { ensureDraftBundle };
