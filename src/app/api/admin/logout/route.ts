import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Admin console logout — clears the session cookie. */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", adminCookieOptions(request, 0));
  return response;
}
