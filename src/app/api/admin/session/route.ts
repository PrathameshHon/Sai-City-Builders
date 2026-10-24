import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Check whether the caller has a valid admin session. */
export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequest(request);
  return noStore({ authenticated });
}
