import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { expireStaleLocks, isValidSession, formatLakhs } from "@/lib/booking";

const purchaseSchema = z.object({
  sessionId: z.string().trim().min(8).max(80),
  name: z.string().trim().min(2, "Buyer name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

/**
 * Purchase (book) a unit — atomic. Only succeeds when the unit is AVAILABLE
 * or LOCKED by this very session. This is the hard guarantee against double-booking.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = purchaseSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError?.message ?? "Invalid input" }, { status: 400 });
    }
    const { sessionId, name, phone, email } = parsed.data;

    await expireStaleLocks();

    const flat = await db.flat.findUnique({ where: { id }, include: { project: true } });
    if (!flat) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Atomic conditional transition: AVAILABLE, or LOCKED by *this* session
    const result = await db.flat.updateMany({
      where: {
        id,
        OR: [{ status: "AVAILABLE" }, { status: "LOCKED", lockSession: sessionId }],
      },
      data: { status: "SOLD", lockedUntil: null, lockSession: null },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          error:
            flat.status === "SOLD"
              ? "This unit has already been sold."
              : "Another buyer is currently holding this unit. Please try again later or pick another unit.",
          status: flat.status,
        },
        { status: 409 }
      );
    }

    // Record the booking (same transaction guarantees the flat belongs to this purchase)
    const booking = await db.booking.create({
      data: {
        flatId: id,
        buyerName: name,
        buyerPhone: phone,
        buyerEmail: email || null,
        amountLabel: formatLakhs(flat.priceLakhs),
        status: "confirmed",
      },
    });

    return NextResponse.json(
      {
        success: true,
        bookingId: booking.id,
        message: `Congratulations! Unit ${flat.unitNumber} is now booked in your name.`,
        unit: { unitNumber: flat.unitNumber, project: flat.project.name, amount: formatLakhs(flat.priceLakhs) },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Purchase failed:", error);
    return NextResponse.json({ error: "Failed to complete booking. Please retry." }, { status: 500 });
  }
}
