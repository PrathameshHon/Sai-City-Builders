import { NextResponse } from "next/server";
import { z } from "zod";

/* Shared server-side helpers for the API routes (server only). */

/** JSON response with no-store caching (used by every data route). */
export function noStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** First human-readable message of a failed zod parse (or a fallback). */
export function zodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

/**
 * Photo/image URL validation — only site-local uploads, static images
 * or absolute http(s) URLs are accepted.
 */
export const photoUrlSchema = z
  .string()
  .trim()
  .min(1, "Photo URL is required")
  .max(500, "Photo URL is too long")
  .refine(
    (url) =>
      url.startsWith("/uploads/") ||
      url.startsWith("/api/uploads/") ||
      url.startsWith("/images/") ||
      /^https?:\/\//i.test(url),
    "Image URLs must start with /uploads/, /api/uploads/, /images/ or http(s)://"
  );

/** Indian mobile phone (with optional +91 / 91 prefix). */
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+?91[\s-]?)?[6-9]\d{9}$/,
    "Please enter a valid Indian phone number"
  );

/** Parse a JSON-encoded string column (highlights/amenities/gallery). */
export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** Lowercase slug: only a-z, 0-9 and hyphens. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Map a flat status from the DB (or a raw string) to the tri-state. */
export function flatStatus(status: string): "AVAILABLE" | "LOCKED" | "SOLD" {
  return status === "SOLD" ? "SOLD" : status === "LOCKED" ? "LOCKED" : "AVAILABLE";
}
