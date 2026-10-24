import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, photoUrlSchema, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(80),
  category: z.string().trim().min(2, "Category must be at least 2 characters").max(40).optional(),
  caption: z.string().trim().max(200, "Caption must be 200 characters or fewer").optional(),
  image: photoUrlSchema,
  sortOrder: z.number().int().min(0).max(999).optional(),
});

function toItem(row: {
  id: string;
  title: string;
  category: string;
  caption: string | null;
  image: string;
  sortOrder: number;
}) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    caption: row.caption,
    image: row.image,
    sortOrder: row.sortOrder,
  };
}

/** All gallery items in display order. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const items = await db.galleryItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return noStore({ success: true, items: items.map(toItem) });
  } catch (error) {
    console.error("Failed to list gallery items:", error);
    return noStore({ error: "Failed to load gallery" }, 500);
  }
}

/** Add a gallery item. */
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const item = await db.galleryItem.create({
      data: {
        title: data.title,
        category: data.category || "Site",
        caption: data.caption || null,
        image: data.image,
        sortOrder: data.sortOrder ?? 99,
      },
    });

    return noStore({ success: true, item: toItem(item) }, 201);
  } catch (error) {
    console.error("Failed to create gallery item:", error);
    return noStore({ error: "Failed to create gallery item" }, 500);
  }
}
