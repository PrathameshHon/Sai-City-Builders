import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { expireStaleLocks, formatLakhs, isValidSession } from "@/lib/booking";
import { getSettings, isRazorpayConfigured } from "@/lib/settings";
import { indianPhoneSchema, noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const initiateSchema = z.object({
  flatId: z.string().trim().min(1, "Unit is required"),
  sessionId: z.string(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: indianPhoneSchema,
  email: z.string().trim().email("Invalid email address").optional(),
});

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomOrderNumber(): string {
  const uuid = randomUUID().replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ORDER_ALPHABET[parseInt(uuid.slice(i * 2, i * 2 + 2), 16) % ORDER_ALPHABET.length];
  }
  return `SGW-${suffix}`;
}

async function uniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = randomOrderNumber();
    const clash = await db.bookingOrder.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }
  return `SGW-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** Step 1 of booking: create the advance-payment order for a held/available unit. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;
    if (!isValidSession(data.sessionId)) {
      return noStore({ error: "Invalid booking session" }, 400);
    }

    await expireStaleLocks();

    const flat = await db.flat.findUnique({
      where: { id: data.flatId },
      include: { project: true },
    });
    if (!flat || !flat.project) {
      return noStore({ error: "Unit not found" }, 404);
    }

    const heldByMe = flat.status === "LOCKED" && flat.lockSession === data.sessionId;
    if (flat.status === "SOLD") {
      return noStore(
        { error: "Sorry, this unit has already been sold.", status: "SOLD" as const },
        409
      );
    }
    if (flat.status === "LOCKED" && !heldByMe) {
      return noStore(
        {
          error: "This unit is currently held by another buyer. Please try again shortly.",
          status: "LOCKED" as const,
        },
        409
      );
    }

    const orderNumber = await uniqueOrderNumber();
    const settings = await getSettings();
    const amount = settings.advanceAmount;

    let provider: "razorpay" | "demo" = "demo";
    let razorpayOrderId: string | null = null;
    let fallbackMessage: string | undefined;

    if (isRazorpayConfigured(settings)) {
      try {
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic " +
              Buffer.from(`${settings.razorpayKeyId}:${settings.razorpayKeySecret}`).toString("base64"),
          },
          body: JSON.stringify({
            amount: amount * 100, // paise
            currency: "INR",
            receipt: orderNumber,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (response.ok) {
          const rzp: unknown = await response.json();
          const id =
            typeof rzp === "object" && rzp !== null && "id" in rzp
              ? (rzp as { id?: unknown }).id
              : undefined;
          if (typeof id === "string" && id.length > 0) {
            razorpayOrderId = id;
            provider = "razorpay";
          }
        }
        if (!razorpayOrderId) {
          fallbackMessage =
            "Razorpay could not be reached — continuing in secure demo mode.";
        }
      } catch {
        fallbackMessage = "Razorpay could not be reached — continuing in secure demo mode.";
      }
    }

    await db.bookingOrder.create({
      data: {
        flatId: flat.id,
        orderNumber,
        amount,
        currency: "INR",
        provider,
        razorpayOrderId,
        buyerName: data.name,
        buyerPhone: data.phone,
        buyerEmail: data.email || null,
        status: "CREATED",
      },
    });

    return noStore(
      {
        success: true,
        orderNumber,
        amount,
        currency: "INR" as const,
        provider,
        razorpay:
          provider === "razorpay" && razorpayOrderId
            ? {
                keyId: settings.razorpayKeyId,
                orderId: razorpayOrderId,
                amount: amount * 100, // paise
                currency: "INR" as const,
              }
            : null,
        unit: {
          unitNumber: flat.unitNumber,
          project: flat.project.name,
          priceLabel: formatLakhs(flat.priceLakhs),
        },
        ...(fallbackMessage ? { message: fallbackMessage } : {}),
      },
      201
    );
  } catch (error) {
    console.error("Booking initiation failed:", error);
    return noStore({ error: "Failed to start booking. Please try again." }, 500);
  }
}
