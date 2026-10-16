import { NextRequest } from "next/server";
import { getSettings, isRazorpayConfigured } from "@/lib/settings";
import { noStore } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Public payment settings — advance amount + Razorpay public key only. */
export async function GET(_request: NextRequest) {
  try {
    const settings = await getSettings();
    return noStore({
      success: true,
      advanceAmount: settings.advanceAmount,
      currency: "INR" as const,
      razorpayConfigured: isRazorpayConfigured(settings),
      razorpayKeyId: settings.razorpayKeyId || null,
    });
  } catch (error) {
    console.error("Failed to read public settings:", error);
    return noStore({ error: "Failed to load settings" }, 500);
  }
}
