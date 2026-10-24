import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatLakhs } from "@/lib/booking";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
});

/** Demo gateway confirm: atomically claim the unit for a CREATED demo order. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const order = await db.bookingOrder.findUnique({
      where: { orderNumber: data.orderNumber },
      include: { flat: { include: { project: true } } },
    });
    if (!order) {
      return noStore({ error: "Order not found" }, 404);
    }
    if (order.provider !== "demo") {
      return noStore({ error: "This order must be completed via Razorpay checkout." }, 400);
    }
    if (order.status === "PAID") {
      return noStore({ error: "This order has already been confirmed." }, 409);
    }
    if (order.status === "FAILED") {
      return noStore(
        { error: "This order failed and cannot be confirmed. Please start a new booking." },
        409
      );
    }

    // Atomic claim — only wins if nobody else claimed the unit meanwhile.
    const claim = await db.flat.updateMany({
      where: { id: order.flatId, status: { not: "SOLD" } },
      data: { status: "SOLD", lockedUntil: null, lockSession: null },
    });
    if (claim.count === 0) {
      await db.bookingOrder
        .update({ where: { id: order.id }, data: { status: "FAILED" } })
        .catch(() => {});
      return noStore(
        { error: "This unit was just taken by another buyer. Your advance will be refunded." },
        409
      );
    }

    const [, booking] = await db.$transaction([
      db.bookingOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          razorpayPaymentId: `demo_${randomBytes(6).toString("hex")}`,
        },
      }),
      db.booking.create({
        data: {
          flatId: order.flatId,
          buyerName: order.buyerName,
          buyerPhone: order.buyerPhone,
          buyerEmail: order.buyerEmail,
          amountLabel: formatLakhs(order.flat.priceLakhs),
          status: "confirmed",
        },
      }),
    ]);

    return noStore({
      success: true,
      bookingId: booking.id,
      orderNumber: order.orderNumber,
      amount: order.amount,
      provider: "demo" as const,
      message: `Advance payment received — Unit ${order.flat.unitNumber} in ${order.flat.project.name} is booked in your name.`,
      unit: { unitNumber: order.flat.unitNumber, project: order.flat.project.name },
    });
  } catch (error) {
    console.error("Demo confirmation failed:", error);
    return noStore({ error: "Failed to confirm booking. Please contact support." }, 500);
  }
}
