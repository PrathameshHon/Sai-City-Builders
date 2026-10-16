import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { noStore, photoUrlSchema, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().email("Invalid email address").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{6,15}$/, "Please enter a valid phone number")
    .optional(),
  rating: z
    .number({ message: "Rating must be a number between 1 and 5" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating can be at most 5 stars"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80).optional(),
  comment: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(1200, "Review must be 1200 characters or fewer"),
  projectName: z.string().trim().min(1).max(120).optional(),
  flatNo: z.string().trim().min(1).max(20).optional(),
  photos: z
    .array(photoUrlSchema, { message: "Photos must be a list of image URLs" })
    .max(12, "At most 12 photos are allowed")
    .optional(),
});

/** Approved visitor reviews (newest first) with album photo previews. */
export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { album: { include: { photos: true } } },
    });

    return noStore({
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        name: review.name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        projectName: review.projectName,
        flatNo: review.flatNo,
        albumId: review.albumId,
        photos: (review.album?.photos ?? []).slice(0, 4).map((p) => p.url),
        createdAt: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return noStore({ error: "Failed to load reviews" }, 500);
  }
}

/** Visitor submits a review (moderated). Photos + project + flat also create
 *  a linked transformation album awaiting approval. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;
    const photos = data.photos ?? [];

    let albumId: string | null = null;
    if (photos.length > 0 && data.projectName && data.flatNo) {
      const album = await db.album.create({
        data: {
          title: `${data.projectName} — ${data.flatNo} Transformation`,
          ownerName: data.name,
          projectName: data.projectName,
          flatNo: data.flatNo,
          approved: false,
          coverPhoto: photos[0],
          photos: {
            create: photos.map((url) => ({ url })),
          },
        },
      });
      albumId = album.id;
    }

    await db.review.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
        projectName: data.projectName || null,
        flatNo: data.flatNo || null,
        albumId,
        approved: false,
      },
    });

    return noStore(
      { success: true, message: "Thank you! Your review is submitted for moderation." },
      201
    );
  } catch (error) {
    console.error("Review submission failed:", error);
    return noStore({ error: "Failed to submit review. Please try again." }, 500);
  }
}
