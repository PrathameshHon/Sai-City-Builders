import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { expireStaleLocks } from "@/lib/booking";
import { flatStatus, noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["AVAILABLE", "LOCKED", "SOLD"]);

/** Inventory browser with filters, search and pagination. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    await expireStaleLocks();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim() || null;
    const status = searchParams.get("status")?.trim().toUpperCase() || null;
    const tower = searchParams.get("tower")?.trim() || null;
    const q = searchParams.get("q")?.trim() || null;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "60", 10) || 60)
    );

    const where: Prisma.FlatWhereInput = {
      ...(projectId ? { projectId } : {}),
      ...(status && VALID_STATUSES.has(status) ? { status } : {}),
      ...(tower ? { tower: { contains: tower } } : {}),
      ...(q ? { unitNumber: { contains: q } } : {}),
    };

    const [total, flats] = await Promise.all([
      db.flat.count({ where }),
      db.flat.findMany({
        where,
        include: { project: { select: { name: true } } },
        orderBy: [
          { project: { name: "asc" } },
          { tower: "asc" },
          { floor: "asc" },
          { unitNumber: "asc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Latest booking per flat (fetched in JS — small page sizes).
    const flatIds = flats.map((flat) => flat.id);
    const bookings = flatIds.length
      ? await db.booking.findMany({
          where: { flatId: { in: flatIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const latestBookingByFlat = new Map<string, (typeof bookings)[number]>();
    for (const booking of bookings) {
      if (!latestBookingByFlat.has(booking.flatId)) {
        latestBookingByFlat.set(booking.flatId, booking);
      }
    }

    return noStore({
      success: true,
      flats: flats.map((flat) => {
        const booking = latestBookingByFlat.get(flat.id) ?? null;
        return {
          id: flat.id,
          unitNumber: flat.unitNumber,
          tower: flat.tower,
          floorLabel: flat.floorLabel,
          unitType: flat.unitType,
          areaSqft: flat.areaSqft,
          priceLakhs: flat.priceLakhs,
          facing: flat.facing,
          status: flatStatus(flat.status),
          lockedUntil: flat.lockedUntil?.toISOString() ?? null,
          projectId: flat.projectId,
          projectName: flat.project?.name ?? null,
          buyer: booking
            ? { name: booking.buyerName, phone: booking.buyerPhone, email: booking.buyerEmail }
            : null,
        };
      }),
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Failed to list flats:", error);
    return noStore({ error: "Failed to load units" }, 500);
  }
}
