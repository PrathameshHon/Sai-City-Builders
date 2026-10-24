import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Moderation list — pending / approved / all. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter")?.trim() ?? "all";

    const where = filter === "pending" ? { approved: false } : filter === "approved" ? { approved: true } : {};

    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { album: { include: { photos: { orderBy: { createdAt: "asc" } } } } },
    });

    return noStore({
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        name: review.name,
        email: review.email,
        phone: review.phone,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        projectName: review.projectName,
        flatNo: review.flatNo,
        approved: review.approved,
        albumId: review.albumId,
        albumTitle: review.album?.title ?? null,
        photos: (review.album?.photos ?? []).map((photo) => ({
          id: photo.id,
          url: photo.url,
          caption: photo.caption,
        })),
        createdAt: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list reviews:", error);
    return noStore({ error: "Failed to load reviews" }, 500);
  }
}
