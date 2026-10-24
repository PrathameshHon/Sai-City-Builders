import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { noStore, photoUrlSchema, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const albumSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(120),
  description: z.string().trim().max(600, "Description must be 600 characters or fewer").optional(),
  projectName: z.string().trim().min(2, "Project name must be at least 2 characters").max(120),
  flatNo: z.string().trim().min(1, "Flat / plot number is required").max(20),
  ownerName: z.string().trim().min(2, "Your name must be at least 2 characters").max(60),
  photos: z
    .array(
      z.object({
        url: photoUrlSchema,
        caption: z.string().trim().min(1).max(120).optional(),
      })
    )
    .min(1, "Add at least one photo")
    .max(12, "At most 12 photos are allowed"),
});

/** Approved transformation albums (newest first). */
export async function GET() {
  try {
    const albums = await db.album.findMany({
      where: { approved: true },
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
        coverPhoto: album.coverPhoto ?? album.photos[0]?.url ?? null,
        photoCount: album.photos.length,
        photos: album.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption })),
        createdAt: album.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch albums:", error);
    return noStore({ error: "Failed to load albums" }, 500);
  }
}

/** Visitor submits a transformation album (moderated). */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = albumSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    await db.album.create({
      data: {
        title: data.title,
        description: data.description || null,
        projectName: data.projectName,
        flatNo: data.flatNo,
        ownerName: data.ownerName,
        approved: false,
        coverPhoto: data.photos[0]?.url ?? null,
        photos: {
          create: data.photos.map((photo) => ({
            url: photo.url,
            caption: photo.caption || null,
          })),
        },
      },
    });

    return noStore(
      {
        success: true,
        message: "Thank you! Your transformation album is submitted for moderation.",
      },
      201
    );
  } catch (error) {
    console.error("Album submission failed:", error);
    return noStore({ error: "Failed to submit album. Please try again." }, 500);
  }
}
