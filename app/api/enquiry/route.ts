import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  project: z.string().trim().max(150).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(60).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = enquirySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const enquiry = await db.enquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        project: data.project || "General Enquiry",
        budget: data.budget || null,
        message: data.message || null,
        source: data.source || "website",
        status: "new",
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: enquiry.id,
        message: "Enquiry received. Our team will contact you soon.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enquiry submission failed:", error);
    return NextResponse.json(
      { error: "Failed to submit enquiry. Please try again or call us directly." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const enquiries = await db.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, count: enquiries.length, enquiries });
  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 });
  }
}
