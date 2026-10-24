import { db } from "@/lib/db";
import { toBookingUnit, type BookingUnit } from "@/lib/booking-shared";

/** Reset any expired locks so inventory is always accurate (cheap lazy cleanup) */
export async function expireStaleLocks(): Promise<void> {
  await db.flat.updateMany({
    where: {
      status: "LOCKED",
      OR: [{ lockedUntil: { lt: new Date() } }, { lockedUntil: null }],
    },
    data: { status: "AVAILABLE", lockedUntil: null, lockSession: null },
  });
}

export { toBookingUnit };
export type { BookingUnit };
export { formatLakhs, isValidSession, LOCK_TTL_MINUTES } from "@/lib/booking-shared";
