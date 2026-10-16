import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Merged booking ledger: Booking rows enriched with advance payment info. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const bookings = await db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { flat: { include: { project: { select: { name: true } } } } },
    });

    const flatIds = [...new Set(bookings.map((b) => b.flatId))];
    const paidOrders = flatIds.length
      ? await db.bookingOrder.findMany({
          where: { flatId: { in: flatIds }, status: "PAID" },
          orderBy: { updatedAt: "asc" },
        })
      : [];
    const latestPaidByFlat = new Map<string, (typeof paidOrders)[number]>();
    for (const order of paidOrders) {
      latestPaidByFlat.set(order.flatId, order); // later rows overwrite → latest wins
    }

    return noStore({
      success: true,
      entries: bookings.map((booking) => {
        const advanceOrder = latestPaidByFlat.get(booking.flatId) ?? null;
        return {
          id: booking.id,
          unitNumber: booking.flat?.unitNumber ?? null,
          tower: booking.flat?.tower ?? null,
          projectName: booking.flat?.project?.name ?? null,
          buyerName: booking.buyerName,
          buyerPhone: booking.buyerPhone,
          buyerEmail: booking.buyerEmail,
          priceLabel: booking.amountLabel,
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
          advance: advanceOrder
            ? {
                orderNumber: advanceOrder.orderNumber,
                amount: advanceOrder.amount,
                provider: advanceOrder.provider,
                paymentId: advanceOrder.razorpayPaymentId,
                paidAt: advanceOrder.updatedAt.toISOString(),
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("Failed to list bookings:", error);
    return noStore({ error: "Failed to load bookings" }, 500);
  }
}
