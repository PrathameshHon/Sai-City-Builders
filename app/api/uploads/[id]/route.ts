import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serve an uploaded image (see /api/upload). Content is immutable per id, so
 * responses carry far-future caching + a strong ETag.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upload = await db.upload.findUnique({ where: { id } });
    if (!upload) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const bytes = Buffer.from(upload.data, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": upload.mime,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${upload.id}"`,
      },
    });
  } catch (error) {
    console.error("[api/uploads/:id] failed:", error);
    return NextResponse.json({ error: "Could not load the image" }, { status: 500 });
  }
}
