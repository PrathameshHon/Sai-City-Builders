import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "qualified", "confirmed"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES, {
    message: "Status must be new, contacted, qualified or confirmed",
  }),
});

/** Update lead status. */
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

    const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true } });
    if (!enquiry) {
      return noStore({ error: "Enquiry not found" }, 404);
    }

    await db.enquiry.update({ where: { id }, data: { status: parsed.data.status } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to update enquiry:", error);
    return noStore({ error: "Failed to update enquiry" }, 500);
  }
}

/** Delete a lead. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const { id } = await params;
    const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true } });
    if (!enquiry) {
      return noStore({ error: "Enquiry not found" }, 404);
    }
    await db.enquiry.delete({ where: { id } });
    return noStore({ success: true });
  } catch (error) {
    console.error("Failed to delete enquiry:", error);
    return noStore({ error: "Failed to delete enquiry" }, 500);
  }
}
