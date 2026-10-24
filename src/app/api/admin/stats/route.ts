import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Dashboard overview: counts + latest orders & enquiries. */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }

  try {
    const [
      projects,
      flatGroups,
      enquiryTotal,
      enquiryNew,
      reviewTotal,
      reviewApproved,
      albumTotal,
      albumApproved,
      galleryItems,
      orderTotal,
      orderPaidAggregate,
      recentOrders,
      recentEnquiries,
    ] = await Promise.all([
      db.project.count(),
      db.flat.groupBy({ by: ["status"], _count: { _all: true } }),
      db.enquiry.count(),
      db.enquiry.count({ where: { status: "new" } }),
      db.review.count(),
      db.review.count({ where: { approved: true } }),
      db.album.count(),
      db.album.count({ where: { approved: true } }),
      db.galleryItem.count(),
      db.bookingOrder.count(),
      db.bookingOrder.aggregate({ where: { status: "PAID" }, _count: true, _sum: { amount: true } }),
      db.bookingOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { flat: { include: { project: true } } },
      }),
      db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    const statusCount = (status: string): number =>
      flatGroups.find((g) => g.status === status)?._count._all ?? 0;

    return noStore({
      success: true,
      stats: {
        projects,
        flats: {
          total: flatGroups.reduce((sum, g) => sum + g._count._all, 0),
          available: statusCount("AVAILABLE"),
          locked: statusCount("LOCKED"),
          sold: statusCount("SOLD"),
        },
        enquiries: { total: enquiryTotal, new: enquiryNew },
        reviews: { total: reviewTotal, approved: reviewApproved, pending: reviewTotal - reviewApproved },
        albums: { total: albumTotal, approved: albumApproved, pending: albumTotal - albumApproved },
        galleryItems,
        orders: {
          total: orderTotal,
          paid: orderPaidAggregate._count ?? 0,
          revenue: orderPaidAggregate._sum.amount ?? 0,
        },
      },
      recentOrders: recentOrders.map((order) => ({
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        amount: order.amount,
        provider: order.provider,
        status: order.status,
        unitNumber: order.flat?.unitNumber ?? null,
        projectName: order.flat?.project?.name ?? null,
        createdAt: order.createdAt.toISOString(),
      })),
      recentEnquiries: recentEnquiries.map((enquiry) => ({
        id: enquiry.id,
        name: enquiry.name,
        phone: enquiry.phone,
        project: enquiry.project,
        status: enquiry.status,
        createdAt: enquiry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to build admin stats:", error);
    return noStore({ error: "Failed to load stats" }, 500);
  }
}
