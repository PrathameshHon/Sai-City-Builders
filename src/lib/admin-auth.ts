import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";

/** Cookie name that carries the admin session token */
export const ADMIN_COOKIE = "sgw_admin";
/** Admin session lifetime */
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * HMAC key mixes the server secret with the *current* admin password,
 * so changing the password instantly invalidates every issued session.
 */
async function sessionKey(): Promise<string> {
  const { adminPassword } = await getSettings();
  const secret = process.env.ADMIN_SESSION_SECRET ?? "sgw-royal-admin-secret-v1";
  return `${secret}:${adminPassword}`;
}

/** Issue a signed admin session token: "<expiryMs>.<hmac(expiryMs)>". */
export async function issueAdminSession(): Promise<{ token: string; maxAgeSeconds: number }> {
  const expires = Date.now() + ADMIN_SESSION_TTL_MS;
  const key = await sessionKey();
  const sig = crypto.createHmac("sha256", key).update(String(expires)).digest("hex");
  return { token: `${expires}.${sig}`, maxAgeSeconds: ADMIN_SESSION_TTL_MS / 1000 };
}

/** Constant-time-ish verification of an admin session token. */
export async function verifyAdminToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const expires = Number(expStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const key = await sessionKey();
  const expected = crypto.createHmac("sha256", key).update(expStr).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

/** Guard helper for admin API routes — true when a valid admin cookie is present. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

/**
 * Cookie attributes that survive EVERY delivery context:
 *
 * - HTTPS (incl. cross-site preview iframes): `SameSite=None; Secure;
 *   Partitioned` (CHIPS) — third-party-cookie blocking would otherwise drop
 *   the session inside an embedded preview panel.
 * - Plain HTTP (local dev / direct access): plain `Lax` (top-level context,
 *   where None+Secure would be rejected).
 *
 * HTTPS is detected from X-Forwarded-Proto, Origin or Referer — the sandbox
 * gateway terminates TLS upstream, so the Referer/Origin sent by the browser
 * is the most reliable signal.
 */
export function adminCookieOptions(
  request: NextRequest,
  maxAgeSeconds: number
): {
  httpOnly: true;
  sameSite: "none" | "lax";
  secure: boolean;
  partitioned?: boolean;
  path: string;
  maxAge: number;
} {
  const forwardedProto = (request.headers.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const origin = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";
  const isHttps =
    forwardedProto === "https" ||
    origin.startsWith("https://") ||
    referer.startsWith("https://") ||
    new URL(request.url).protocol === "https:";

  if (isHttps) {
    return {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      maxAge: maxAgeSeconds,
    };
  }
  return { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: maxAgeSeconds };
}
