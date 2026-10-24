import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, photoUrlSchema, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(80).optional(),
  category: z.string().trim().min(2, "Category must be at least 2 characters").max(40).optional(),
  caption: z.string().trim().max(200, "Caption must be 200 characters or fewer").optional(),
  image: photoUrlSchema.optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

/** Partially update a gallery item. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const existing = await db.galleryItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return noStore({ error: "Gallery item not found" }, 404);
    }

    await db.galleryItem.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.caption !== undefined ? { caption: data.caption || null } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });

    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to update gallery item:", error);
    return noStore({ error: "Failed to update gallery item" }, 500);
  }
}

/** Delete a gallery item. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const existing = await db.galleryItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return noStore({ error: "Gallery item not found" }, 404);
    }
    await db.galleryItem.delete({ where: { id } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to delete gallery item:", error);
    return noStore({ error: "Failed to delete gallery item" }, 500);
  }
}
