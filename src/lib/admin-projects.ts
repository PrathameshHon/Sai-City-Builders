import { z } from "zod";
import { db } from "@/lib/db";
import { parseStringArray, slugify } from "@/lib/api-helpers";

/* Shared schema + mapper for admin project routes. */

export const PROJECT_TYPES = ["Plots", "Villas", "Apartments", "Commercial"] as const;
export const PROJECT_STATUSES = ["Ongoing", "Completed", "Upcoming"] as const;

const stringField = (max: number) => z.string().trim().min(1).max(max).optional();

export const adminProjectPatchSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(90).optional(),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
    .optional(),
  tagline: stringField(140),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(120).optional(),
  type: z.enum(PROJECT_TYPES).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  price: stringField(80),
  landArea: stringField(80),
  totalUnits: stringField(40),
  unitSizes: stringField(120),
  reraNumber: stringField(60),
  possessionDate: stringField(60),
  description: z.string().trim().max(4000).optional(),
  highlights: z.array(z.string().trim().min(1).max(160)).max(12).optional(),
  amenities: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
  image: z.string().trim().min(1).max(300).optional(),
  gallery: z.array(z.string().trim().min(1).max(300)).max(16).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const adminProjectCreateSchema = adminProjectPatchSchema.extend({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(90),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(120),
  type: z.enum(PROJECT_TYPES, { message: "Type must be one of Plots, Villas, Apartments, Commercial" }),
  status: z.enum(PROJECT_STATUSES, { message: "Status must be one of Ongoing, Completed, Upcoming" }),
});

export interface ProjectWithCountInput {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  location: string;
  type: string;
  status: string;
  price: string;
  landArea: string | null;
  totalUnits: string | null;
  unitSizes: string | null;
  reraNumber: string | null;
  possessionDate: string | null;
  description: string;
  highlights: string;
  amenities: string | null;
  image: string;
  gallery: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
}

export function toAdminProject(project: ProjectWithCountInput, flatCount: number) {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    location: project.location,
    type: project.type,
    status: project.status,
    price: project.price,
    landArea: project.landArea,
    totalUnits: project.totalUnits,
    unitSizes: project.unitSizes,
    reraNumber: project.reraNumber,
    possessionDate: project.possessionDate,
    description: project.description,
    highlights: parseStringArray(project.highlights),
    amenities: parseStringArray(project.amenities),
    image: project.image,
    gallery: parseStringArray(project.gallery),
    featured: project.featured,
    sortOrder: project.sortOrder,
    flatCount,
    createdAt: project.createdAt.toISOString(),
  };
}

/** Flat counts per project (single groupBy call). */
export async function flatCountByProject(): Promise<Map<string, number>> {
  const groups = await db.flat.groupBy({ by: ["projectId"], _count: { _all: true } });
  return new Map(groups.map((g) => [g.projectId, g._count._all]));
}

/** Find a slug that is not taken (appends -2, -3, … when needed). */
export async function uniqueSlug(
  desired: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(desired) || "project";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const clash = await db.project.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}
