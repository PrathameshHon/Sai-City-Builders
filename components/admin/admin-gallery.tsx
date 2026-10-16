"use client";

/**
 * Gallery manager — the curated public gallery. Grid of items with an
 * add/edit dialog (title, category, caption, image upload, sortOrder).
 */

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  AdminCard,
  AdminGalleryItem,
  ConfirmAction,
  EmptyState,
  ErrorNote,
  TableSkeleton,
  UploadField,
  api,
  toastApiError,
} from "./admin-shared";

const GALLERY_CATEGORIES = ["Site", "Amenities", "Interiors", "Construction", "Community"] as const;

interface GalleryForm {
  title: string;
  category: string;
  caption: string;
  image: string;
  sortOrder: string;
}

const EMPTY_FORM: GalleryForm = {
  title: "",
  category: "Site",
  caption: "",
  image: "",
  sortOrder: "99",
};

interface GallerySectionProps {
  onDataChanged: () => void;
}

export function GallerySection({ onDataChanged }: GallerySectionProps) {
  const [items, setItems] = useState<AdminGalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGalleryItem | null>(null);
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ items: AdminGalleryItem[] }>("/api/admin/gallery");
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gallery");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: AdminGalleryItem) {
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      caption: item.caption ?? "",
      image: item.image,
      sortOrder: String(item.sortOrder),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (saving) return;
    if (form.title.trim().length < 2) {
      toast({ title: "Title required", description: "Title must be at least 2 characters.", variant: "destructive" });
      return;
    }
    if (!form.image.trim()) {
      toast({ title: "Image required", description: "Upload or paste an image URL first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        category: form.category,
        image: form.image.trim(),
        sortOrder: Math.max(0, Math.min(999, Math.round(Number(form.sortOrder) || 0))),
      };
      if (form.caption.trim()) payload.caption = form.caption.trim();

      if (editing) {
        await api(`/api/admin/gallery/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ title: "Gallery photo updated" });
      } else {
        await api("/api/admin/gallery", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Gallery photo added" });
      }
      setDialogOpen(false);
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: AdminGalleryItem) {
    await api(`/api/admin/gallery/${item.id}`, { method: "DELETE" });
    toast({ title: "Gallery photo deleted" });
    await load();
    onDataChanged();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-moss">
          {items ? `${items.length} photo${items.length === 1 ? "" : "s"} in the public gallery` : "Loading gallery…"}
        </p>
        <Button
          onClick={openCreate}
          className="bg-gold font-semibold text-forest-deep hover:bg-gold-deep hover:text-cream"
        >
          <Plus className="size-4" /> Add Photo
        </Button>
      </div>

      {error && <ErrorNote message={error} />}

      {!items ? (
        <TableSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Gallery is empty"
          description="Add photos of the township — gates, gardens, clubhouse, interiors."
          icon={<ImagePlus />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <AdminCard key={item.id} className="p-3 sm:p-4">
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-sand">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                <span className="absolute right-2 top-2 rounded-full bg-forest-deep/85 px-2 py-0.5 text-[10px] font-bold text-gold-light">
                  #{item.sortOrder}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-bold leading-snug text-forest">{item.title}</h3>
                  <Badge variant="outline" className="shrink-0 border-gold/50 bg-gold/10 text-[10px] text-gold-deep">
                    {item.category}
                  </Badge>
                </div>
                {item.caption && (
                  <p className="line-clamp-2 text-xs text-moss">{item.caption}</p>
                )}
                <div className="flex items-center gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit(item)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <ConfirmAction
                    triggerLabel="Delete"
                    triggerTitle={`Delete ${item.title}`}
                    title={`Delete “${item.title}”?`}
                    description="The photo is removed from the public gallery permanently."
                    confirmLabel="Delete Photo"
                    busyLabel="Deleting…"
                    onConfirm={() => handleDelete(item)}
                  />
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-lg w-[94vw] rounded-2xl border-gold/40 bg-pearl p-0 gap-0 overflow-hidden">
          <div className="royal-panel px-5 py-4">
            <DialogTitle className="font-display text-xl font-bold text-cream">
              {editing ? `Edit — ${editing.title}` : "Add Gallery Photo"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-sage/80">
              Curated photographs shown on the public gallery view.
            </DialogDescription>
            <span className="gold-hairline mt-3 block" aria-hidden="true" />
          </div>

          <div className="max-h-[70vh] overflow-y-auto scroll-area-thin px-5 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-title" className="text-forest">Title *</Label>
              <Input
                id="g-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Grand Entrance Gateway"
                className="bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-forest">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GALLERY_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-sort" className="text-forest">Sort order</Label>
                <Input
                  id="g-sort"
                  type="number"
                  min={0}
                  max={999}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="g-caption" className="text-forest">Caption</Label>
              <Textarea
                id="g-caption"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Shown under the photo in the lightbox (max 200 characters)"
                className="min-h-20 bg-white"
              />
            </div>

            <UploadField
              label="Photo"
              required
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
              hint="JPG / PNG / WebP up to 6 MB."
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-sand bg-pearl px-5 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="bg-forest text-cream hover:bg-pine">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? "Save Changes" : "Add Photo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
