import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";
import { adminProjectPatchSchema, toAdminProject, uniqueSlug } from "@/lib/admin-projects";

export const dynamic = "force-dynamic";

const DEFAULT_IMAGE = "/images/projects/sai-green-woods-02.jpg";

/** Update a project (partial; slug only changes when explicitly sent). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = adminProjectPatchSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return noStore({ error: "Project not found" }, 404);
    }

    const slug =
      data.slug !== undefined ? await uniqueSlug(data.slug, id) : undefined;

    const project = await db.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(data.tagline !== undefined ? { tagline: data.tagline || null } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.price !== undefined ? { price: data.price || "Price on request" } : {}),
        ...(data.landArea !== undefined ? { landArea: data.landArea || null } : {}),
        ...(data.totalUnits !== undefined ? { totalUnits: data.totalUnits || null } : {}),
        ...(data.unitSizes !== undefined ? { unitSizes: data.unitSizes || null } : {}),
        ...(data.reraNumber !== undefined ? { reraNumber: data.reraNumber || null } : {}),
        ...(data.possessionDate !== undefined ? { possessionDate: data.possessionDate || null } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.highlights !== undefined ? { highlights: JSON.stringify(data.highlights) } : {}),
        ...(data.amenities !== undefined ? { amenities: JSON.stringify(data.amenities) } : {}),
        ...(data.image !== undefined ? { image: data.image || DEFAULT_IMAGE } : {}),
        ...(data.gallery !== undefined ? { gallery: JSON.stringify(data.gallery) } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });

    const flatCount = await db.flat.count({ where: { projectId: id } });
    return noStore({ success: true, project: toAdminProject(project, flatCount) });
  } catch (error) {
    console.error("Failed to update project:", error);
    return noStore({ error: "Failed to update project" }, 500);
  }
}

/** Delete a project — cascades to its flats, bookings and payment orders. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const existing = await db.project.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return noStore({ error: "Project not found" }, 404);
    }
    await db.project.delete({ where: { id } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return noStore({ error: "Failed to delete project" }, 500);
  }
}
