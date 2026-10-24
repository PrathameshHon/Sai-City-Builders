import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Lead inbox (latest 300). */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const enquiries = await db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return noStore({
      success: true,
      enquiries: enquiries.map((enquiry) => ({
        id: enquiry.id,
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email,
        project: enquiry.project,
        budget: enquiry.budget,
        message: enquiry.message,
        source: enquiry.source,
        status: enquiry.status,
        createdAt: enquiry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list enquiries:", error);
    return noStore({ error: "Failed to load enquiries" }, 500);
  }
}
