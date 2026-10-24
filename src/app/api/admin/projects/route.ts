import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";
import {
  adminProjectCreateSchema,
  flatCountByProject,
  toAdminProject,
  uniqueSlug,
} from "@/lib/admin-projects";

export const dynamic = "force-dynamic";

const DEFAULT_IMAGE = "/images/projects/sai-green-woods-02.jpg";

/** All projects (admin view) with flat counts. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const [projects, counts] = await Promise.all([
      db.project.findMany({ orderBy: { sortOrder: "asc" } }),
      flatCountByProject(),
    ]);

    return noStore({
      success: true,
      projects: projects.map((project) =>
        toAdminProject(project, counts.get(project.id) ?? 0)
      ),
    });
  } catch (error) {
    console.error("Failed to list admin projects:", error);
    return noStore({ error: "Failed to load projects" }, 500);
  }
}

/** Create a project. Arrays are stored as JSON strings. */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = adminProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const slug = await uniqueSlug(data.slug ?? data.name);

    const project = await db.project.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline || null,
        location: data.location,
        type: data.type,
        status: data.status,
        price: data.price || "Price on request",
        landArea: data.landArea || null,
        totalUnits: data.totalUnits || null,
        unitSizes: data.unitSizes || null,
        reraNumber: data.reraNumber || null,
        possessionDate: data.possessionDate || null,
        description: data.description || "",
        highlights: JSON.stringify(data.highlights ?? []),
        amenities: JSON.stringify(data.amenities ?? []),
        image: data.image || DEFAULT_IMAGE,
        gallery: JSON.stringify(data.gallery ?? []),
        featured: data.featured ?? false,
        sortOrder: data.sortOrder ?? 99,
      },
    });

    return noStore({ success: true, project: toAdminProject(project, 0) }, 201);
  } catch (error) {
    console.error("Failed to create project:", error);
    return noStore({ error: "Failed to create project" }, 500);
  }
}
