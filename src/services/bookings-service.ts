/**
 * Customer booking reads — writes go through create_booking RPC in studio-service.
 */

import type { InventoryKind } from "../types/domain";
import type { Json } from "../types/supabase";
import { getSupabaseClient } from "./supabase/client";

export type CustomerBookingRow = {
  id: string;
  status: "confirmed" | "cancelled" | "no_show" | "completed";
  quantity: number;
  priceMxn: number;
  createdAt: string;
  cancelledAt: string | null;
  slot: {
    id: string;
    startsAt: string;
    durationMinutes: number;
    inventoryKind: InventoryKind;
    title: string | null;
  };
  studio: {
    id: string;
    name: string;
    address: { city: string | null; region: string | null; line1: string | null };
    category: string | null;
  };
};

// TODO: consolidate with studio-service parsePayload during service-layer cleanup.
interface StudioPayload {
  name?: string;
  category?: string;
  address?: {
    city?: string;
    region?: string;
    line1?: string;
  };
}

const BOOKING_SELECT = `
  id,
  status,
  quantity,
  price_mxn,
  created_at,
  cancelled_at,
  slot:slots!inner (
    id,
    starts_at,
    duration_minutes,
    inventory_kind,
    title,
    studio:studios!inner (
      id,
      payload
    )
  )
`;

type SlotQueryRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  inventory_kind: string;
  title: string | null;
  studio: StudioQueryRow | StudioQueryRow[] | null;
};

type StudioQueryRow = {
  id: string;
  payload: Json;
};

type BookingQueryRow = {
  id: string;
  status: string;
  quantity: number;
  price_mxn: number;
  created_at: string | null;
  cancelled_at: string | null;
  slot: SlotQueryRow | SlotQueryRow[] | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseStudioPayload(raw: Json): StudioPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as StudioPayload;
}

function toInventoryKind(kind: string): InventoryKind {
  if (kind === "class" || kind === "court" || kind === "session" || kind === "other") {
    return kind;
  }
  return "other";
}

function toBookingStatus(status: string): CustomerBookingRow["status"] {
  if (
    status === "confirmed" ||
    status === "cancelled" ||
    status === "no_show" ||
    status === "completed"
  ) {
    return status;
  }
  return "confirmed";
}

function mapBookingRow(row: BookingQueryRow): CustomerBookingRow | null {
  const slot = unwrapOne(row.slot);
  const studio = slot ? unwrapOne(slot.studio) : null;
  if (!slot || !studio) return null;

  const payload = parseStudioPayload(studio.payload);
  return {
    id: row.id,
    status: toBookingStatus(row.status),
    quantity: row.quantity,
    priceMxn: Number(row.price_mxn),
    createdAt: row.created_at ?? new Date().toISOString(),
    cancelledAt: row.cancelled_at,
    slot: {
      id: slot.id,
      startsAt: slot.starts_at,
      durationMinutes: slot.duration_minutes,
      inventoryKind: toInventoryKind(slot.inventory_kind),
      title: slot.title,
    },
    studio: {
      id: studio.id,
      name: payload.name ?? "Studio",
      address: {
        city: payload.address?.city ?? null,
        region: payload.address?.region ?? null,
        line1: payload.address?.line1 ?? null,
      },
      category: payload.category ?? null,
    },
  };
}

export async function fetchCustomerBookings(userId: string): Promise<CustomerBookingRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[bookings-service] fetchCustomerBookings failed:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as BookingQueryRow[];
  const mapped = rows.map(mapBookingRow).filter((b): b is CustomerBookingRow => b != null);
  mapped.sort(
    (a, b) => new Date(b.slot.startsAt).getTime() - new Date(a.slot.startsAt).getTime()
  );
  return mapped;
}

export async function fetchCustomerBookingById(
  bookingId: string
): Promise<CustomerBookingRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[bookings-service] fetchCustomerBookingById failed:", error);
    return null;
  }

  if (!data) return null;
  return mapBookingRow(data as unknown as BookingQueryRow);
}
