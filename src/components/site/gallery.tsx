"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { GALLERY } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

/** A single gallery tile (category defaults to "Site" for static entries). */
export interface GalleryEntry {
  src: string;
  caption: string;
  category?: string;
}

interface GalleryProps {
  /** dynamic items (e.g. from /api/gallery); falls back to the static GALLERY set */
  items?: GalleryEntry[];
}

export function Gallery({ items }: GalleryProps) {
  const images: GalleryEntry[] = useMemo(
    () => items ?? GALLERY.map((g) => ({ ...g, category: "Site" })),
    [items]
  );

  const categories = useMemo(
    () => [...new Set(images.map((img) => img.category ?? "Site"))],
    [images]
  );

  const [category, setCategory] = useState<string | null>(null);
  const visible = useMemo(
    () => (category ? images.filter((img) => (img.category ?? "Site") === category) : images),
    [images, category]
  );

  const [lightbox, setLightbox] = useState<number | null>(null);

  const next = useCallback(
    () => setLightbox((i) => (i === null ? null : (i + 1) % visible.length)),
    [visible.length]
  );
  const prev = useCallback(
    () => setLightbox((i) => (i === null ? null : (i - 1 + visible.length) % visible.length)),
    [visible.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  function selectCategory(nextCategory: string | null) {
    setCategory(nextCategory);
    setLightbox(null);
  }

  return (
    <section id="gallery" className="bg-sage/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Gallery"
          title="A Glimpse of Green Living"
          subtitle="Walk through the landscapes, avenues and lifestyle spaces of Sai Green Woods."
        />

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div
            className="mt-8 flex flex-wrap justify-center gap-2"
            role="group"
            aria-label="Filter gallery by category"
          >
            <button
              type="button"
              onClick={() => selectCategory(null)}
              aria-pressed={category === null}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold border transition-all",
                category === null
                  ? "bg-gold text-forest border-gold-deep"
                  : "bg-white text-forest border-border hover:border-gold/60"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border transition-all",
                  category === c
                    ? "bg-gold text-forest border-gold-deep"
                    : "bg-white text-forest border-border hover:border-gold/60"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[160px] sm:auto-rows-[200px]">
          {visible.map((img, i) => (
            <Reveal
              key={img.src}
              delay={i * 0.05}
              className={cn(
                i === 0 && "col-span-2 row-span-2",
                i === 3 && "col-span-2",
                i === 6 && "col-span-2"
              )}
            >
              <button
                onClick={() => setLightbox(i)}
                className="group relative h-full w-full overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                aria-label={`Open image: ${img.caption}`}
              >
                <img
                  src={img.src}
                  alt={img.caption}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="text-white text-xs sm:text-sm font-medium truncate">{img.caption}</span>
                  <Expand className="h-4 w-4 text-gold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && visible[lightbox] && (
        <div
          className="fixed inset-0 z-[60] bg-forest-deep/95 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <figure className="max-w-5xl w-full">
            <img
              src={visible[lightbox].src}
              alt={visible[lightbox].caption}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <figcaption className="mt-4 text-center text-sage text-sm flex items-center justify-center gap-3">
              <span className="text-gold font-semibold">{lightbox + 1} / {visible.length}</span>
              {visible[lightbox].caption}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
