import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatLakhs } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  razorpay_order_id: z.string().trim().min(1, "Razorpay order id is required"),
  razorpay_payment_id: z.string().trim().min(1, "Razorpay payment id is required"),
  razorpay_signature: z.string().trim().min(1, "Razorpay signature is required"),
});

function signaturesMatch(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function markFailed(orderId: string): Promise<void> {
  await db.bookingOrder.update({ where: { id: orderId }, data: { status: "FAILED" } }).catch(() => {});
}

/** Step 2 of booking: verify the Razorpay callback, atomically claim the unit. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = verifySchema.safeParse(body);
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

    if (order.status === "PAID") {
      // Idempotent replay of a successful callback.
      const booking = await db.booking.findFirst({
        where: { flatId: order.flatId, status: "confirmed" },
        orderBy: { createdAt: "desc" },
      });
      return noStore({
        success: true,
        bookingId: booking?.id ?? null,
        orderNumber: order.orderNumber,
        amount: order.amount,
        provider: "razorpay" as const,
        message: `Payment already verified — Unit ${order.flat.unitNumber} in ${order.flat.project.name} is booked in your name.`,
        unit: { unitNumber: order.flat.unitNumber, project: order.flat.project.name },
      });
    }
    if (order.status === "FAILED") {
      return noStore({ error: "This order failed and cannot be verified. Please start a new booking." }, 409);
    }

    if (order.provider !== "razorpay" || order.razorpayOrderId !== data.razorpay_order_id) {
      await markFailed(order.id);
      return noStore(
        { error: "Payment does not match this order. Your advance will be refunded." },
        400
      );
    }

    const settings = await getSettings();
    const expected = createHmac("sha256", settings.razorpayKeySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (!signaturesMatch(expected, data.razorpay_signature)) {
      await markFailed(order.id);
      return noStore({ error: "Payment signature verification failed" }, 400);
    }

    // Atomic claim — only wins if nobody else claimed the unit meanwhile.
    const claim = await db.flat.updateMany({
      where: { id: order.flatId, status: { not: "SOLD" } },
      data: { status: "SOLD", lockedUntil: null, lockSession: null },
    });
    if (claim.count === 0) {
      await markFailed(order.id);
      return noStore(
        { error: "This unit was just taken by another buyer. Your advance will be refunded." },
        409
      );
    }

    const [updatedOrder, booking] = await db.$transaction([
      db.bookingOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
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
    void updatedOrder;

    return noStore({
      success: true,
      bookingId: booking.id,
      orderNumber: order.orderNumber,
      amount: order.amount,
      provider: "razorpay" as const,
      message: `Payment verified — Unit ${order.flat.unitNumber} in ${order.flat.project.name} is booked in your name.`,
      unit: { unitNumber: order.flat.unitNumber, project: order.flat.project.name },
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return noStore({ error: "Failed to verify payment. Please contact support." }, 500);
  }
}
