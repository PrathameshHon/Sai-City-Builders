import { db } from "@/lib/db";

export interface SiteSettings {
  /** Advance booking amount in whole rupees (editable from admin dashboard) */
  advanceAmount: number;
  /** Admin console login email (changeable from admin dashboard) */
  adminEmail: string;
  /** Admin console password (changeable from admin dashboard) */
  adminPassword: string;
  /** Razorpay Key ID (public — safe to expose to checkout) */
  razorpayKeyId: string;
  /** Razorpay Key Secret (server-side only, never sent to client) */
  razorpayKeySecret: string;
}

/** Setting keys stored in the Setting table */
export const SETTING_KEYS = {
  advanceAmount: "advance_amount",
  adminEmail: "admin_email",
  adminPassword: "admin_password",
  razorpayKeyId: "razorpay_key_id",
  razorpayKeySecret: "razorpay_key_secret",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.advanceAmount]: "500",
  [SETTING_KEYS.adminEmail]: "adminid",
  [SETTING_KEYS.adminPassword]: "password",
  [SETTING_KEYS.razorpayKeyId]: "",
  [SETTING_KEYS.razorpayKeySecret]: "",
};

const ADVANCE_MIN = 1;
const ADVANCE_MAX = 10_000_000;

/** Read all settings, applying defaults for any missing rows (lazy bootstrap). */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const val = (key: string): string => {
    const v = map.get(key);
    if (v === undefined || v === "") return DEFAULTS[key] ?? "";
    return v;
  };
  const parsedAmount = Number.parseInt(val(SETTING_KEYS.advanceAmount), 10);
  const advanceAmount = Number.isFinite(parsedAmount)
    ? Math.min(ADVANCE_MAX, Math.max(ADVANCE_MIN, parsedAmount))
    : Number(DEFAULTS[SETTING_KEYS.advanceAmount]);

  return {
    advanceAmount,
    adminEmail: val(SETTING_KEYS.adminEmail).trim().toLowerCase() || DEFAULTS[SETTING_KEYS.adminEmail]!,
    adminPassword: val(SETTING_KEYS.adminPassword) || DEFAULTS[SETTING_KEYS.adminPassword]!,
    razorpayKeyId: val(SETTING_KEYS.razorpayKeyId).trim(),
    razorpayKeySecret: val(SETTING_KEYS.razorpayKeySecret).trim(),
  };
}

/** Persist a partial settings patch (upsert semantics). Empty string clears a key. */
export async function setSettings(patch: Partial<Record<keyof typeof SETTING_KEYS, string>>): Promise<void> {
  const entries = Object.entries(patch) as [keyof typeof SETTING_KEYS, string | undefined][];
  for (const [key, value] of entries) {
    if (typeof value !== "string") continue;
    const dbKey = SETTING_KEYS[key];
    await db.setting.upsert({
      where: { key: dbKey },
      update: { value },
      create: { key: dbKey, value },
    });
  }
}

/** Whether real Razorpay checkout is usable (both key parts configured). */
export function isRazorpayConfigured(settings: SiteSettings): boolean {
  return settings.razorpayKeyId.length > 0 && settings.razorpayKeySecret.length > 0;
}
