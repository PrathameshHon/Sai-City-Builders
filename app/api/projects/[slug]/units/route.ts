import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireStaleLocks, toBookingUnit } from "@/lib/booking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const sessionId = request.nextUrl.searchParams.get("session");

    const project = await db.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Lazy cleanup of expired locks keeps availability honest
    await expireStaleLocks();

    const flats = await db.flat.findMany({
      where: { projectId: project.id },
      orderBy: [{ tower: "asc" }, { floor: "asc" }, { unitNumber: "asc" }],
    });

    const units = flats.map((f) => toBookingUnit(f, sessionId));

    const stats = {
      total: units.length,
      available: units.filter((u) => u.status === "AVAILABLE").length,
      locked: units.filter((u) => u.status === "LOCKED").length,
      sold: units.filter((u) => u.status === "SOLD").length,
    };

    return NextResponse.json(
      { success: true, project: { slug: project.slug, name: project.name, type: project.type }, units, stats },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to load units:", error);
    return NextResponse.json({ error: "Failed to load units" }, { status: 500 });
  }
}
