import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, issueAdminSession } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings";
import { zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function safeEqual(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a); // burn a comparison to keep timing flat
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Admin console login — email + password must both match, then the signed httpOnly session cookie is set. */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }

    const settings = await getSettings();
    const emailOk = safeEqual(settings.adminEmail, parsed.data.email.toLowerCase());
    const passwordOk = safeEqual(settings.adminPassword, parsed.data.password);
    if (!emailOk || !passwordOk) {
      // Deliberately vague — never reveal which half was wrong
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, maxAgeSeconds } = await issueAdminSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(request, maxAgeSeconds));
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
