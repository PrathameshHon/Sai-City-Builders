"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxPhoto {
  url: string;
  caption: string;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-size photo viewer with prev/next + keyboard support
 * (Escape / ← / →). Mirrors the gallery lightbox pattern.
 */
export function PhotoLightbox({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) {
  const count = photos.length;

  const next = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index + 1) % count);
  }, [index, count, onIndexChange]);

  const prev = useCallback(() => {
    if (count === 0) return;
    onIndexChange((index - 1 + count) % count);
  }, [index, count, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // capture phase + stopPropagation so an open Radix dialog underneath
        // (e.g. an album dialog) does not also close
        e.stopPropagation();
        onClose();
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [next, prev, onClose]);

  if (count === 0) return null;
  const safeIndex = Math.min(Math.max(index, 0), count - 1);
  const photo = photos[safeIndex];

  return (
    <div
      className="fixed inset-0 z-[70] bg-forest-deep/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      <figure className="max-w-5xl w-full">
        <img
          src={photo.url}
          alt={photo.caption}
          className="w-full max-h-[75vh] object-contain rounded-2xl"
        />
        <figcaption className="mt-4 text-center text-sage text-sm flex items-center justify-center gap-3">
          <span className="text-gold font-semibold">
            {safeIndex + 1} / {count}
          </span>
          {photo.caption}
        </figcaption>
      </figure>
    </div>
  );
}
