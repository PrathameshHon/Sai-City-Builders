"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryItemInfo, SiteProject } from "@/lib/types";
import { GALLERY } from "@/lib/site";
import { ViewHero } from "./view-hero";
import { Gallery, type GalleryEntry } from "../gallery";
import { CommunityAlbums } from "../community-albums";
import { CtaBanner } from "../cta-banner";

export function GalleryView({ projects }: { projects: SiteProject[] }) {
  // null = loading, [] = API returned nothing → static fallback
  const [items, setItems] = useState<GalleryItemInfo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/gallery");
        const data: { success?: boolean; items?: GalleryItemInfo[]; error?: string } = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to load gallery");
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const galleryImages = useMemo<GalleryEntry[] | undefined>(() => {
    if (items === null) return undefined; // still loading
    if (items.length === 0) {
      // fall back to the static gallery set
      return GALLERY.map((g) => ({ ...g, category: "Site" }));
    }
    return items.map((item) => ({
      src: item.image,
      caption: item.caption ?? item.title,
      category: item.category,
    }));
  }, [items]);

  return (
    <>
      <ViewHero
        eyebrow="Gallery"
        title="Life at Sai Green Woods, Framed"
        description="Gates, gardens, clubhouses and tree-lined avenues — a look inside the township before you visit it in person."
      />

      {galleryImages === undefined ? (
        <section className="bg-sage/50 py-20 lg:py-28" aria-label="Loading gallery">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[160px] sm:auto-rows-[200px]">
              {[...Array(8)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={i === 0 ? "col-span-2 row-span-2 rounded-2xl" : "rounded-2xl"}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <Gallery items={galleryImages} />
      )}

      <CommunityAlbums projects={projects} />
      <CtaBanner />
    </>
  );
}
