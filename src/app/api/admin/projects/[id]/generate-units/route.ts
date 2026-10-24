import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const FACINGS = ["North", "East", "West", "South", "North-East", "South-West"] as const;

const generateSchema = z.object({
  towers: z
    .string()
    .trim()
    .min(1, "Add at least one tower/sector label")
    .max(200, "Tower list is too long"),
  floors: z.number().int().min(1, "Floors must be between 1 and 12").max(12, "Floors must be between 1 and 12"),
  unitsPerFloor: z
    .number()
    .int()
    .min(1, "Units per floor must be between 1 and 12")
    .max(12, "Units per floor must be between 1 and 12"),
  unitType: z.string().trim().min(1, "Unit type is required").max(30),
  areaSqft: z.number().int().min(200, "Area must be at least 200 sq.ft").max(20000, "Area is too large"),
  basePriceLakhs: z
    .number()
    .min(1, "Base price must be at least 1 lakh")
    .max(500, "Base price must be at most 500 lakhs"),
  soldPercent: z.number().int().min(0).max(60, "Pre-sold percent can be at most 60").optional(),
  replace: z.boolean().optional(),
});

/** Deterministic LCG seeded from the project id — stable regeneration. */
function makeRng(seedSource: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seedSource.length; i++) {
    state ^= seedSource.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  state >>>= 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Round to the nearest 0.05 lakh. */
function roundTo5Paise(value: number): number {
  return Math.round(value * 20) / 20;
}

/** Bulk-generate bookable units for a project. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const project = await db.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) {
      return noStore({ error: "Project not found" }, 404);
    }

    const existingCount = await db.flat.count({ where: { projectId: id } });
    if (existingCount > 0 && data.replace !== true) {
      return noStore(
        {
          error: `Project already has ${existingCount} units. Send replace: true to regenerate (this deletes existing units & their bookings).`,
        },
        409
      );
    }

    if (data.replace === true) {
      await db.flat.deleteMany({ where: { projectId: id } });
    }

    const towers = data.towers
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const rng = makeRng(id);
    const soldRatio = (data.soldPercent ?? 20) / 100;

    interface NewFlat {
      projectId: string;
      tower: string;
      floor: number;
      floorLabel: string;
      unitNumber: string;
      unitType: string;
      areaSqft: number;
      priceLakhs: number;
      facing: string;
      status: string;
    }
    const rows: NewFlat[] = [];
    let facingSeq = 0;

    for (const tower of towers) {
      const prefix = tower.split(/\s+/).pop() ?? tower;
      for (let floor = 0; floor < data.floors; floor++) {
        const floorLabel = floor === 0 ? "G" : String(floor);
        for (let pos = 1; pos <= data.unitsPerFloor; pos++) {
          const unitNumber =
            data.floors > 1
              ? `${prefix}-${floorLabel}${String(pos).padStart(2, "0")}`
              : `${prefix}-${String(pos).padStart(2, "0")}`;
          const sold = rng() < soldRatio;
          rows.push({
            projectId: id,
            tower,
            floor,
            floorLabel,
            unitNumber,
            unitType: data.unitType,
            areaSqft: data.areaSqft,
            priceLakhs: roundTo5Paise(data.basePriceLakhs + floor * 0.25),
            facing: FACINGS[facingSeq++ % FACINGS.length]!,
            status: sold ? "SOLD" : "AVAILABLE",
          });
        }
      }
    }

    if (rows.length === 0) {
      return noStore({ error: "No tower labels provided" }, 400);
    }

    const result = await db.flat.createMany({ data: rows });

    return noStore({ success: true, generated: result.count }, 201);
  } catch (error) {
    console.error("Failed to generate units:", error);
    return noStore({ error: "Failed to generate units" }, 500);
  }
}
