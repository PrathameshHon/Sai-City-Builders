import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simple local memory cache (60s) to avoid hammering SQLite on every request
let cache: { data: unknown; expiry: number } | null = null;
const CACHE_TTL_MS = 60_000;

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    if (cache && Date.now() < cache.expiry) {
      return NextResponse.json(
        { success: true, cached: true, projects: cache.data },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const projects = await db.project.findMany({ orderBy: { sortOrder: "asc" } });

    const mapped = projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      location: p.location,
      type: p.type,
      status: p.status,
      price: p.price,
      landArea: p.landArea,
      totalUnits: p.totalUnits,
      unitSizes: p.unitSizes,
      reraNumber: p.reraNumber,
      possessionDate: p.possessionDate,
      description: p.description,
      highlights: parseJsonArray(p.highlights),
      amenities: parseJsonArray(p.amenities),
      image: p.image,
      gallery: parseJsonArray(p.gallery),
      featured: p.featured,
    }));

    cache = { data: mapped, expiry: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(
      { success: true, cached: false, projects: mapped },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
