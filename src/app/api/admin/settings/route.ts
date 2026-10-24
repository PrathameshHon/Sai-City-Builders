import { NextRequest } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSettings, setSettings, SETTING_KEYS } from "@/lib/settings";
import { noStore, zodError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


const settingsSchema = z.object({
  advanceAmount: z
    .coerce.number({ message: "Advance amount must be a number" })
    .int("Advance amount must be a whole number of rupees")
    .min(1, "Advance amount must be at least ₹1")
    .max(10_000_000, "Advance amount is too large")
    .optional(),
  razorpayKeyId: z.string().trim().max(120, "Razorpay Key ID is too long").optional(),
  razorpayKeySecret: z.string().trim().max(120, "Razorpay Key Secret is too long").optional(),
  adminPassword: z
    .string()
    .min(6, "Admin password must be at least 6 characters")
    .max(120, "Admin password is too long")
    .optional(),
  adminEmail: z.string().trim().email("Enter a valid admin email").max(200).optional(),
});

function settingsPayload(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    advanceAmount: settings.advanceAmount,
    razorpayKeyId: settings.razorpayKeyId,
    razorpayKeySecret: settings.razorpayKeySecret,
    adminPassword: settings.adminPassword,
    adminEmail: settings.adminEmail,
  };
}

/** Full settings (admin sees secret values — it is their dashboard). */
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const settings = await getSettings();
    return noStore({ success: true, settings: settingsPayload(settings) });
  } catch (error) {
    console.error("Failed to read admin settings:", error);
    return noStore({ error: "Failed to load settings" }, 500);
  }
}

/** Update settings (upsert; empty Razorpay keys clear them). */
export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return noStore({ error: "Unauthorized" }, 401);
  }
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return noStore({ error: zodError(parsed.error) }, 400);
    }
    const data = parsed.data;

    const patch: Partial<Record<keyof typeof SETTING_KEYS, string>> = {};
    if (data.advanceAmount !== undefined) {
      patch.advanceAmount = String(data.advanceAmount);
    }
    if (data.razorpayKeyId !== undefined) {
      patch.razorpayKeyId = data.razorpayKeyId;
    }
    if (data.razorpayKeySecret !== undefined) {
      patch.razorpayKeySecret = data.razorpayKeySecret;
    }
    if (data.adminPassword !== undefined) {
      patch.adminPassword = data.adminPassword;
    }
    if (data.adminEmail !== undefined) {
      patch.adminEmail = data.adminEmail.toLowerCase();
    }

    await setSettings(patch);
    const settings = await getSettings();
    return noStore({ success: true, settings: settingsPayload(settings) });
  } catch (error) {
    console.error("Failed to save admin settings:", error);
    return noStore({ error: "Failed to save settings" }, 500);
  }
}
