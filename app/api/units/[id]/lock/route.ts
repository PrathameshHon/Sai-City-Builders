import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireStaleLocks, isValidSession, LOCK_TTL_MINUTES } from "@/lib/booking";

/**
 * Temporarily lock a unit for this session (hold) — atomic, prevents double-booking.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!isValidSession(body?.sessionId)) {
      return NextResponse.json({ error: "Invalid booking session" }, { status: 400 });
    }
    const sessionId = body.sessionId as string;

    await expireStaleLocks();

    // Atomic conditional update — only succeeds if the unit is still AVAILABLE
    const result = await db.flat.updateMany({
      where: { id, status: "AVAILABLE" },
      data: {
        status: "LOCKED",
        lockedUntil: new Date(Date.now() + LOCK_TTL_MINUTES * 60000),
        lockSession: sessionId,
      },
    });

    if (result.count === 0) {
      const flat = await db.flat.findUnique({ where: { id } });
      if (!flat) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
      }
      const mine = flat.status === "LOCKED" && flat.lockSession === sessionId;
      return NextResponse.json(
        {
          error: mine
            ? "You already hold a lock on this unit."
            : "Sorry, this unit was just taken by another buyer. Please pick another one.",
          status: flat.status,
          isMine: mine,
        },
        { status: 409 }
      );
    }

    const flat = await db.flat.findUnique({ where: { id } });
    return NextResponse.json({
      success: true,
      message: `Unit held for you for ${LOCK_TTL_MINUTES} minutes. Complete your booking before the timer ends!`,
      lockedUntil: flat?.lockedUntil?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Lock failed:", error);
    return NextResponse.json({ error: "Failed to lock the unit. Please retry." }, { status: 500 });
  }
}
