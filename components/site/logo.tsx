"use client";

import { cn } from "@/lib/utils";
import { useSiteNav } from "./site-context";

/**
 * Brand lockup — the official Sai Green Woods logo (client-provided file)
 * shown in full, with no extra wordmark text beside it.
 */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  const { navigate } = useSiteNav();

  return (
    <button
      type="button"
      onClick={() => navigate("home")}
      className={cn("group text-left", className)}
      aria-label="Sai Green Woods — Home"
    >
      <span className="relative inline-flex shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
        <span
          className={cn(
            "flex items-center justify-center rounded-xl border border-gold/70 bg-white px-2 py-1",
            light ? "shadow-none" : "shadow-sm"
          )}
        >
          {/* Official Sai Green Woods logo (client-provided file) */}
          <img
            src="/logo-lockup.png"
            alt="Sai Green Woods — Sai Towers & Developers, Kopargaon"
            width={166}
            height={100}
            className="h-10 sm:h-11 w-auto object-contain"
            draggable={false}
          />
        </span>
      </span>
    </button>
  );
}
