/**
 * Shared domain types — English identifiers; user-facing copy lives in i18n.
 */

export type UserRole = "customer" | "partner" | "admin";

export type ApprovalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended";

export type InventoryKind = "class" | "court" | "session" | "other";

export type PricingBehavior = "fixed_discount" | "dynamic_floor" | "manual";

/** Aligns with customer UI categories */
export type StudioCategory =
  | "fitness"
  | "yoga"
  | "pilates"
  | "padel"
  | "recovery"
  | "wellness"
  | "boxing"
  | "beauty"
  | "other";

export interface PartnerProfile {
  userId: string;
  displayName: string | null;
  phone: string | null;
  createdAt: string;
}

export interface StudioLocation {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
}

export interface StudioContact {
  email: string;
  phone: string;
  websiteUrl: string | null;
  instagram: string | null;
  facebook: string | null;
}

export interface TaxLegalPlaceholder {
  businessLegalName: string | null;
  taxIdPlaceholder: string | null;
  notes: string | null;
}

export interface PeakHourBlock {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
}

export interface OffPeakOccupancy {
  typicalPercent: number;
  notes: string | null;
}

export interface DemandBySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timeWindow: string;
  demandLevel: "low" | "medium" | "high";
}

export interface StudioScheduleBlock {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  label: string | null;
}

export interface PricingRules {
  averageRetailPrice: number;
  minimumSaveItPrice: number;
  preferredBehavior: PricingBehavior;
  defaultDiscountPercent: number | null;
}

export interface TimeSlotInventory {
  id: string;
  title: string;
  kind: InventoryKind;
  serviceType: string;
  /** ISO date for one-off, or null if recurring */
  occursOnDate: string | null;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
  startTime: string;
  durationMinutes: number;
  capacityTotal: number;
  capacityRemaining: number;
  retailPrice: number;
  saveItPrice: number;
  isPeak: boolean;
  isPaused: boolean;
  /** draft | pending_review | live — slot-level publish */
  publishStatus: "draft" | "pending_review" | "live";
  createdAt: string;
  updatedAt: string;
}

export interface CancellationRules {
  freeCancelHoursBefore: number;
  notes: string | null;
}

export interface AmenityRef {
  id: string;
  key: string;
}

export interface StudioEntity {
  id: string;
  ownerUserId: string;
  name: string;
  brandName: string | null;
  description: string | null;
  category: StudioCategory;
  serviceTypes: string[];
  amenities: AmenityRef[];
  location: StudioLocation;
  contact: StudioContact;
  logoUri: string | null;
  photoUris: string[];
  averageClassPrice: number;
  pricingRules: PricingRules;
  peakHours: PeakHourBlock[];
  offPeakOccupancy: OffPeakOccupancy;
  demandByDayTime: DemandBySlot[];
  schedules: StudioScheduleBlock[];
  cancellation: CancellationRules;
  taxLegal: TaxLegalPlaceholder;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  /** When true, new slots go live without admin review */
  autoPublishSlots: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  studioId: string;
  slotId: string;
  customerUserId: string;
  customerEmail: string | null;
  quantity: number;
  totalPrice: number;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface AnalyticsSummary {
  studioId: string;
  periodStart: string;
  periodEnd: string;
  bookingsCount: number;
  revenueCents: number;
  occupancyRate: number | null;
}

export interface LocalStudioBundle {
  studio: StudioEntity;
  slots: TimeSlotInventory[];
  bookings: Booking[];
}
