import { db } from "@/lib/db";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Admin-managed gallery items in display order. */
export async function GET() {
  try {
    const items = await db.galleryItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return noStore({
      success: true,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        caption: item.caption,
        image: item.image,
        sortOrder: item.sortOrder,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
    return noStore({ error: "Failed to load gallery" }, 500);
  }
}
