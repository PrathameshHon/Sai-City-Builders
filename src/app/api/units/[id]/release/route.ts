import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidSession } from "@/lib/booking";

/**
 * Release a temporary hold — only the lock owner can release.
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

    const result = await db.flat.updateMany({
      where: { id, status: "LOCKED", lockSession: sessionId },
      data: { status: "AVAILABLE", lockedUntil: null, lockSession: null },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Could not release — the hold may have expired or belongs to another buyer." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, message: "Hold released. The unit is available again." });
  } catch (error) {
    console.error("Release failed:", error);
    return NextResponse.json({ error: "Failed to release the unit." }, { status: 500 });
  }
}
