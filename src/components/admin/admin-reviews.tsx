"use client";

/**
 * Reviews moderation — pending/approved/all chips, royal review cards
 * with photo lightbox, approve/unapprove + delete.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, Star, Mail, Phone, MapPin, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AdminCard,
  AdminReview,
  ConfirmAction,
  EmptyState,
  ErrorNote,
  StarsRow,
  TableSkeleton,
  api,
  fmtDateFull,
  toastApiError,
} from "./admin-shared";

type ReviewFilter = "pending" | "approved" | "all";

interface ReviewsSectionProps {
  onDataChanged: () => void;
}

export function ReviewsSection({ onDataChanged }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; caption: string | null; alt: string } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ reviews: AdminReview[] }>("/api/admin/reviews?filter=all");
      setReviews(res.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setApproved(review: AdminReview, approved: boolean) {
    setActingId(review.id);
    try {
      await api(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      toast({
        title: approved ? "Review approved" : "Review unapproved",
        description: approved
          ? "It is now live on the public site."
          : "It is hidden from the public site.",
      });
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(review: AdminReview) {
    await api(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
    toast({ title: "Review deleted" });
    await load();
    onDataChanged();
  }

  if (error) return <ErrorNote message={error} />;
  if (!reviews) return <TableSkeleton rows={4} />;

  const pending = reviews.filter((r) => !r.approved);
  const approvedList = reviews.filter((r) => r.approved);
  const visible = filter === "pending" ? pending : filter === "approved" ? approvedList : reviews;

  const chips: { id: ReviewFilter; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "approved", label: "Approved", count: approvedList.length },
    { id: "all", label: "All", count: reviews.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Review filters">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={filter === chip.id}
            onClick={() => setFilter(chip.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === chip.id
                ? "border-gold bg-gold/20 text-gold-deep"
                : "border-sand bg-pearl text-moss hover:border-gold/50 hover:text-forest"
            )}
          >
            {chip.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[11px] font-bold",
                chip.id === "pending" && chip.count > 0
                  ? "bg-brick/15 text-brick"
                  : filter === chip.id
                    ? "bg-gold text-forest-deep"
                    : "bg-sand text-moss"
              )}
            >
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={filter === "pending" ? "No pending reviews" : "No reviews here"}
          description={
            filter === "pending"
              ? "You're all caught up — new visitor reviews await moderation here."
              : "Visitor reviews submitted from the public site will appear here."
          }
          icon={<Star />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((review) => (
            <AdminCard
              key={review.id}
              className={cn("p-4 sm:p-5", !review.approved && "border-gold/60 bg-gold-light/25")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <StarsRow rating={review.rating} />
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug text-forest">
                    {review.title ?? "Untitled review"}
                  </h3>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    review.approved ? "bg-leaf/15 text-leaf" : "bg-gold/25 text-gold-deep"
                  )}
                >
                  {review.approved ? "Approved" : "Pending"}
                </span>
              </div>

              <p className="mt-2 max-h-40 overflow-y-auto scroll-area-thin text-sm leading-relaxed text-moss">
                {review.comment}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {review.projectName && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sand bg-sand/50 px-2.5 py-0.5 text-[11px] font-medium text-forest">
                    <MapPin className="size-3" /> {review.projectName}
                  </span>
                )}
                {review.flatNo && (
                  <span className="rounded-full border border-sand bg-sand/50 px-2.5 py-0.5 text-[11px] font-medium text-forest">
                    Flat {review.flatNo}
                  </span>
                )}
                {review.albumId && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold-deep">
                    <Camera className="size-3" /> {review.photos.length} photos
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-0.5 text-xs text-moss/80">
                <p className="font-semibold text-forest">{review.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {review.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" /> {review.email}
                    </span>
                  )}
                  {review.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" /> {review.phone}
                    </span>
                  )}
                </div>
                <p className="pt-1 text-[11px] text-moss/70">{fmtDateFull(review.createdAt)}</p>
              </div>

              {review.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {review.photos.slice(0, 8).map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() =>
                        setLightbox({ url: photo.url, caption: photo.caption, alt: `Photo from ${review.name}` })
                      }
                      className="group relative h-16 overflow-hidden rounded-lg border border-sand"
                      aria-label={`Open photo ${photo.caption ?? ""}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? "Review photo"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-sand pt-3">
                <Button
                  size="sm"
                  onClick={() => void setApproved(review, !review.approved)}
                  disabled={actingId === review.id}
                  className={cn(
                    "h-8",
                    review.approved
                      ? "bg-transparent border border-forest/30 text-forest hover:bg-forest/10"
                      : "bg-gold text-forest-deep font-semibold hover:bg-gold-deep hover:text-cream"
                  )}
                >
                  {actingId === review.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {review.approved ? "Unapprove" : "Approve"}
                </Button>
                <ConfirmAction
                  triggerLabel="Delete"
                  triggerTitle={`Delete review by ${review.name}`}
                  title={`Delete review by ${review.name}?`}
                  description="The review is removed permanently. Its linked album (if any) stays intact."
                  confirmLabel="Delete Review"
                  busyLabel="Deleting…"
                  onConfirm={() => handleDelete(review)}
                  icon={<Trash2 className="size-3.5" />}
                />
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      <Dialog open={lightbox !== null} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-2xl w-[94vw] rounded-2xl border-gold/40 bg-forest-deep p-0 gap-0 overflow-hidden [&>button]:text-gold-light">
          <DialogTitle className="sr-only">Review photo</DialogTitle>
          {lightbox && (
            <figure className="p-2">
              <img
                src={lightbox.url}
                alt={lightbox.caption ?? lightbox.alt}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
              {lightbox.caption && (
                <figcaption className="px-2 py-3 text-center text-sm text-sage">{lightbox.caption}</figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
