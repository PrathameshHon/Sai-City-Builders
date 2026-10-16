import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  approved: z.boolean({ message: "approved must be true or false" }),
});

/** Approve / reject an album (linked reviews stay independent). */
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

    const album = await db.album.findUnique({ where: { id }, select: { id: true } });
    if (!album) {
      return noStore({ error: "Album not found" }, 404);
    }

    await db.album.update({ where: { id }, data: { approved: parsed.data.approved } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to update album:", error);
    return noStore({ error: "Failed to update album" }, 500);
  }
}

/** Delete an album — photos cascade. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const album = await db.album.findUnique({ where: { id }, select: { id: true } });
    if (!album) {
      return noStore({ error: "Album not found" }, 404);
    }
    await db.album.delete({ where: { id } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to delete album:", error);
    return noStore({ error: "Failed to delete album" }, 500);
  }
}
