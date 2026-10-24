import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const subscribeSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid email" },
        { status: 400 }
      );
    }

    const existing = await db.subscriber.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to our updates.",
      });
    }

    await db.subscriber.create({
      data: { email: parsed.data.email.toLowerCase() },
    });

    return NextResponse.json(
      {
        success: true,
        alreadySubscribed: false,
        message: "Subscribed successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
