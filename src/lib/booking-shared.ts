/** Pure/shared booking helpers — safe to import from client components (no DB imports) */

/** How long a temporary hold lasts */
export const LOCK_TTL_MINUTES = 10;

export interface BookingUnit {
  id: string;
  tower: string;
  floor: number;
  floorLabel: string;
  unitNumber: string;
  unitType: string;
  areaSqft: number;
  priceLakhs: number;
  facing: string | null;
  /** effective status after applying lock expiry */
  status: "AVAILABLE" | "LOCKED" | "SOLD";
  lockedUntil: string | null;
  /** true when the current session holds the lock */
  isMine: boolean;
}

export interface UnitsResponse {
  success: boolean;
  project: { slug: string; name: string; type: string };
  units: BookingUnit[];
  stats: { total: number; available: number; locked: number; sold: number };
}

interface FlatRow {
  id: string;
  tower: string;
  floor: number;
  floorLabel: string;
  unitNumber: string;
  unitType: string;
  areaSqft: number;
  priceLakhs: number;
  facing: string | null;
  status: string;
  lockedUntil: Date | null;
  lockSession: string | null;
}

export function toBookingUnit(flat: FlatRow, sessionId: string | null): BookingUnit {
  const activeLock =
    flat.status === "LOCKED" &&
    flat.lockedUntil !== null &&
    flat.lockedUntil.getTime() > Date.now();
  return {
    id: flat.id,
    tower: flat.tower,
    floor: flat.floor,
    floorLabel: flat.floorLabel,
    unitNumber: flat.unitNumber,
    unitType: flat.unitType,
    areaSqft: flat.areaSqft,
    priceLakhs: flat.priceLakhs,
    facing: flat.facing,
    status: activeLock ? "LOCKED" : flat.status === "SOLD" ? "SOLD" : "AVAILABLE",
    lockedUntil: activeLock ? flat.lockedUntil!.toISOString() : null,
    isMine: activeLock && !!sessionId && flat.lockSession === sessionId,
  };
}

export function formatLakhs(v: number): string {
  if (v >= 100) return `₹${(v / 100).toFixed(2)} Cr`;
  return `₹${v.toFixed(2)} L`;
}

export function isValidSession(sessionId: unknown): sessionId is string {
  return typeof sessionId === "string" && sessionId.trim().length >= 8 && sessionId.length <= 80;
}

export function getBookingSession(): string {
  if (typeof window === "undefined") return "";
  try {
    const KEY = "sgw-booking-session";
    let id = window.localStorage.getItem(KEY);
    if (!id || !isValidSession(id)) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}
