import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  approved: z.boolean({ message: "approved must be true or false" }),
});

/** Approve / reject a review — approving also approves its linked album. */
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

    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return noStore({ error: "Review not found" }, 404);
    }

    await db.review.update({ where: { id }, data: { approved: parsed.data.approved } });

    if (parsed.data.approved && review.albumId) {
      await db.album
        .update({ where: { id: review.albumId }, data: { approved: true } })
        .catch(() => {});
    }

    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to update review:", error);
    return noStore({ error: "Failed to update review" }, 500);
  }
}

/** Delete a review (the linked album, if any, is kept). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const review = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!review) {
      return noStore({ error: "Review not found" }, 404);
    }
    await db.review.delete({ where: { id } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return noStore({ error: "Failed to delete review" }, 500);
  }
}
