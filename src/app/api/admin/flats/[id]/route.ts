import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { formatLakhs } from "@/lib/booking";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["AVAILABLE", "SOLD"], { message: "Status must be AVAILABLE or SOLD" }),
  buyerName: z.string().trim().min(1).max(100).optional(),
  buyerPhone: z.string().trim().min(1).max(20).optional(),
});

/** Admin unit status override (mark sold / release back to market). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const flat = await db.flat.findUnique({ where: { id } });
    if (!flat) {
      return noStore({ error: "Unit not found" }, 404);
    }

    if (data.status === "SOLD") {
      const claim = await db.flat.updateMany({
        where: { id, status: { not: "SOLD" } },
        data: { status: "SOLD", lockedUntil: null, lockSession: null },
      });
      if (claim.count === 0) {
        return noStore({ error: "Unit is already sold" }, 409);
      }
      await db.booking.create({
        data: {
          flatId: id,
          buyerName: data.buyerName || "Admin Marked",
          buyerPhone: data.buyerPhone || "-",
          amountLabel: formatLakhs(flat.priceLakhs),
          status: "confirmed",
        },
      });
      return noStore({
        success: true,
        message: `Unit ${flat.unitNumber} marked as sold.`,
      });
    }

    await db.flat.update({
      where: { id },
      data: { status: "AVAILABLE", lockedUntil: null, lockSession: null },
    });
    const cancelled = await db.booking.updateMany({
      where: { flatId: id, status: "confirmed" },
      data: { status: "cancelled" },
    });

    return noStore({
      success: true,
      message: `Unit ${flat.unitNumber} is back on the market${cancelled.count > 0 ? ` — ${cancelled.count} booking(s) cancelled` : ""}.`,
    });
  } catch (error) {
    console.error("Failed to update unit status:", error);
    return noStore({ error: "Failed to update unit" }, 500);
  }
}
