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

    const albums = await db.album.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { createdAt: "asc" } } },
    });

    return noStore({
      success: true,
      albums: albums.map((album) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        projectName: album.projectName,
        flatNo: album.flatNo,
        ownerName: album.ownerName,
        approved: album.approved,
        coverPhoto: album.coverPhoto ?? album.photos[0]?.url ?? null,
        photoCount: album.photos.length,
        photos: album.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          caption: photo.caption,
        })),
        createdAt: album.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list albums:", error);
    return noStore({ error: "Failed to load albums" }, 500);
  }
}
