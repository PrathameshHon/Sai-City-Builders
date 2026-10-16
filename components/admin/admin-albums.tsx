"use client";

/**
 * Albums moderation — transformation albums with cover photo, approve /
 * unapprove, delete, and a full photo grid dialog with captions.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, Images, User, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AdminAlbum,
  AdminCard,
  ConfirmAction,
  EmptyState,
  ErrorNote,
  TableSkeleton,
  api,
  fmtDateFull,
  toastApiError,
} from "./admin-shared";

type AlbumFilter = "pending" | "approved" | "all";

interface AlbumsSectionProps {
  onDataChanged: () => void;
}

export function AlbumsSection({ onDataChanged }: AlbumsSectionProps) {
  const [albums, setAlbums] = useState<AdminAlbum[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AlbumFilter>("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [openAlbum, setOpenAlbum] = useState<AdminAlbum | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ albums: AdminAlbum[] }>("/api/admin/albums?filter=all");
      setAlbums(res.albums);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load albums");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setApproved(album: AdminAlbum, approved: boolean) {
    setActingId(album.id);
    try {
      await api(`/api/admin/albums/${album.id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      toast({
        title: approved ? "Album approved" : "Album unapproved",
        description: approved ? "Photo story is live on the public site." : "Photo story is hidden from the public site.",
      });
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(album: AdminAlbum) {
    await api(`/api/admin/albums/${album.id}`, { method: "DELETE" });
    toast({ title: "Album deleted" });
    await load();
    onDataChanged();
  }

  if (error) return <ErrorNote message={error} />;
  if (!albums) return <TableSkeleton rows={4} />;

  const pending = albums.filter((a) => !a.approved);
  const approvedList = albums.filter((a) => a.approved);
  const visible = filter === "pending" ? pending : filter === "approved" ? approvedList : albums;

  const chips: { id: AlbumFilter; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "approved", label: "Approved", count: approvedList.length },
    { id: "all", label: "All", count: albums.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Album filters">
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
          title={filter === "pending" ? "No pending albums" : "No albums here"}
          description={
            filter === "pending"
              ? "All transformation albums are moderated."
              : "Visitor-submitted photo stories will appear here."
          }
          icon={<Images />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((album) => (
            <AdminCard
              key={album.id}
              className={cn("p-4 flex flex-col", !album.approved && "border-gold/60 bg-gold-light/25")}
            >
              <button
                type="button"
                onClick={() => setOpenAlbum(album)}
                className="group relative h-40 w-full overflow-hidden rounded-xl border border-sand"
                aria-label={`Open photo grid for ${album.title}`}
              >
                {album.coverPhoto ? (
                  <img
                    src={album.coverPhoto}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-sand/60 text-moss">
                    <Images className="size-8" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-forest-deep/85 to-transparent px-3 pb-2 pt-8 text-xs font-semibold text-cream">
                  {album.photoCount} photo{album.photoCount === 1 ? "" : "s"}
                  <span className="inline-flex items-center gap-1 text-gold-light">
                    View all <ArrowRight className="size-3" />
                  </span>
                </span>
                {!album.approved && (
                  <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest-deep">
                    Pending
                  </span>
                )}
              </button>

              <div className="mt-3 flex-1 space-y-2">
                <h3 className="font-display text-base font-bold leading-snug text-forest">{album.title}</h3>
                <p className="text-xs font-semibold text-gold-deep">
                  {album.projectName ?? "—"}
                  <span className="mx-1 text-moss/50">→</span>
                  {album.flatNo ?? "—"}
                </p>
                {album.ownerName && (
                  <p className="flex items-center gap-1.5 text-xs text-moss">
                    <User className="size-3" /> {album.ownerName}
                  </p>
                )}
                {album.description && (
                  <p className="max-h-16 overflow-y-auto scroll-area-thin text-xs leading-relaxed text-moss/90">
                    {album.description}
                  </p>
                )}
                <p className="text-[11px] text-moss/70">{fmtDateFull(album.createdAt)}</p>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-sand pt-3">
                <Button
                  size="sm"
                  onClick={() => void setApproved(album, !album.approved)}
                  disabled={actingId === album.id}
                  className={cn(
                    "h-8",
                    album.approved
                      ? "bg-transparent border border-forest/30 text-forest hover:bg-forest/10"
                      : "bg-gold text-forest-deep font-semibold hover:bg-gold-deep hover:text-cream"
                  )}
                >
                  {actingId === album.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {album.approved ? "Unapprove" : "Approve"}
                </Button>
                <ConfirmAction
                  triggerLabel="Delete"
                  triggerTitle={`Delete album ${album.title}`}
                  title={`Delete “${album.title}”?`}
                  description={`The album and its ${album.photoCount} photo${album.photoCount === 1 ? "" : "s"} will be removed permanently.`}
                  confirmLabel="Delete Album"
                  busyLabel="Deleting…"
                  onConfirm={() => handleDelete(album)}
                  icon={<Trash2 className="size-3.5" />}
                />
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Full photo grid dialog */}
      <Dialog open={openAlbum !== null} onOpenChange={(open) => !open && setOpenAlbum(null)}>
        <DialogContent className="max-w-2xl w-[94vw] rounded-2xl border-gold/40 bg-pearl p-0 gap-0 overflow-hidden">
          <div className="royal-panel px-5 py-4">
            <DialogTitle className="font-display text-xl font-bold text-cream">
              {openAlbum?.title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-sage/80">
              {openAlbum?.projectName} → {openAlbum?.flatNo}
              {openAlbum?.ownerName ? ` · by ${openAlbum.ownerName}` : ""}
            </DialogDescription>
            <span className="gold-hairline mt-3 block" aria-hidden="true" />
          </div>
          <div className="max-h-[70vh] overflow-y-auto scroll-area-thin p-5">
            {openAlbum && openAlbum.photos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {openAlbum.photos.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-xl border border-sand">
                    <img
                      src={photo.url}
                      alt={photo.caption ?? openAlbum.title}
                      className="h-44 w-full object-cover"
                    />
                    {photo.caption && (
                      <figcaption className="bg-cream px-3 py-2 text-xs text-moss">{photo.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-moss">This album has no photos.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
