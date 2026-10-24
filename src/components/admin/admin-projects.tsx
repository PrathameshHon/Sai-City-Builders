"use client";

/**
 * Projects — portfolio cards with inline featured toggle, full add/edit
 * dialog (image upload + gallery manager) and a bulk unit generator.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  MapPin,
  Loader2,
  Upload,
  X,
  Layers,
  RefreshCw,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import {
  AdminCard,
  AdminProject,
  ConfirmAction,
  ErrorNote,
  ProjectStatusBadge,
  TableSkeleton,
  TypeBadge,
  UploadField,
  api,
  linesToArray,
  toastApiError,
} from "./admin-shared";

const PROJECT_TYPES = ["Plots", "Villas", "Apartments", "Commercial"] as const;
const PROJECT_STATUSES = ["Ongoing", "Completed", "Upcoming"] as const;

interface ProjectForm {
  name: string;
  slug: string;
  tagline: string;
  location: string;
  type: string;
  status: string;
  price: string;
  landArea: string;
  totalUnits: string;
  unitSizes: string;
  reraNumber: string;
  possessionDate: string;
  description: string;
  highlights: string;
  amenities: string;
  image: string;
  gallery: string[];
  featured: boolean;
  sortOrder: string;
}

const EMPTY_FORM: ProjectForm = {
  name: "",
  slug: "",
  tagline: "",
  location: "",
  type: "Plots",
  status: "Ongoing",
  price: "",
  landArea: "",
  totalUnits: "",
  unitSizes: "",
  reraNumber: "",
  possessionDate: "",
  description: "",
  highlights: "",
  amenities: "",
  image: "",
  gallery: [],
  featured: false,
  sortOrder: "99",
};

function projectToForm(project: AdminProject): ProjectForm {
  return {
    name: project.name,
    slug: project.slug,
    tagline: project.tagline ?? "",
    location: project.location,
    type: project.type,
    status: project.status,
    price: project.price,
    landArea: project.landArea ?? "",
    totalUnits: project.totalUnits ?? "",
    unitSizes: project.unitSizes ?? "",
    reraNumber: project.reraNumber ?? "",
    possessionDate: project.possessionDate ?? "",
    description: project.description,
    highlights: project.highlights.join("\n"),
    amenities: project.amenities.join("\n"),
    image: project.image,
    gallery: [...project.gallery],
    featured: project.featured,
    sortOrder: String(project.sortOrder),
  };
}

function buildPayload(form: ProjectForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    location: form.location.trim(),
    type: form.type,
    status: form.status,
    description: form.description.trim(),
    highlights: linesToArray(form.highlights),
    amenities: linesToArray(form.amenities),
    gallery: form.gallery.filter((url) => url.trim().length > 0),
    featured: form.featured,
    sortOrder: Math.max(0, Math.min(999, Math.round(Number(form.sortOrder) || 0))),
  };
  const optional: [key: string, value: string][] = [
    ["slug", form.slug.trim()],
    ["tagline", form.tagline.trim()],
    ["price", form.price.trim()],
    ["landArea", form.landArea.trim()],
    ["totalUnits", form.totalUnits.trim()],
    ["unitSizes", form.unitSizes.trim()],
    ["reraNumber", form.reraNumber.trim()],
    ["possessionDate", form.possessionDate.trim()],
    ["image", form.image.trim()],
  ];
  for (const [key, value] of optional) {
    if (value) payload[key] = value;
  }
  return payload;
}

interface GeneratorForm {
  towers: string;
  floors: string;
  unitsPerFloor: string;
  unitType: string;
  areaSqft: string;
  basePriceLakhs: string;
  soldPercent: string;
  replace: boolean;
}

const EMPTY_GENERATOR: GeneratorForm = {
  towers: "Tower A",
  floors: "4",
  unitsPerFloor: "8",
  unitType: "2 BHK Apartment",
  areaSqft: "850",
  basePriceLakhs: "35",
  soldPercent: "20",
  replace: false,
};

interface ProjectsSectionProps {
  onDataChanged: () => void;
  /** increments when the Overview "Add Project" quick action fires */
  createSignal: number;
}

export function ProjectsSection({ onDataChanged, createSignal }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [genProject, setGenProject] = useState<AdminProject | null>(null);
  const [genForm, setGenForm] = useState<GeneratorForm>(EMPTY_GENERATOR);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ projects: AdminProject[] }>("/api/admin/projects");
      setProjects(res.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setForm(EMPTY_FORM);
      setDialogOpen(true);
    }
  }, [createSignal]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(project: AdminProject) {
    setEditing(project);
    setForm(projectToForm(project));
    setDialogOpen(true);
  }

  const setField = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  async function handleSave() {
    if (saving) return;
    if (form.name.trim().length < 3) {
      toast({ title: "Name required", description: "Project name must be at least 3 characters.", variant: "destructive" });
      return;
    }
    if (form.location.trim().length < 2) {
      toast({ title: "Location required", description: "Location must be at least 2 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editing) {
        await api(`/api/admin/projects/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Project updated", description: `${form.name.trim()} saved.` });
      } else {
        await api("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Project created", description: `${form.name.trim()} is now in the portfolio.` });
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

  async function toggleFeatured(project: AdminProject, featured: boolean) {
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, featured } : p)));
    try {
      await api(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ featured }),
      });
      toast({ title: featured ? "Marked as featured" : "Removed from featured", description: project.name });
      onDataChanged();
    } catch (err) {
      setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, featured: !featured } : p)));
      toastApiError(err);
    }
  }

  async function handleDelete(project: AdminProject) {
    await api(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    toast({ title: "Project deleted", description: `${project.name} and its units were removed.` });
    await load();
    onDataChanged();
  }

  async function addGalleryFile(file: File) {
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("/api/upload", { method: "POST", body: fd });
      setForm((f) => ({ ...f, gallery: [...f.gallery, res.url] }));
      toast({ title: "Gallery image added" });
    } catch (err) {
      toastApiError(err);
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGenerate() {
    if (!genProject || generating) return;
    const floors = Math.round(Number(genForm.floors));
    const unitsPerFloor = Math.round(Number(genForm.unitsPerFloor));
    const areaSqft = Math.round(Number(genForm.areaSqft));
    const basePriceLakhs = Number(genForm.basePriceLakhs);
    const soldPercent = Math.round(Number(genForm.soldPercent));

    if (!genForm.towers.trim()) {
      toast({ title: "Tower labels required", description: "Add at least one tower or sector label.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(floors) || floors < 1 || floors > 12) {
      toast({ title: "Floors must be 1–12", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(unitsPerFloor) || unitsPerFloor < 1 || unitsPerFloor > 12) {
      toast({ title: "Units per floor must be 1–12", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(areaSqft) || areaSqft < 200 || areaSqft > 20000) {
      toast({ title: "Area must be 200–20,000 sq.ft", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(basePriceLakhs) || basePriceLakhs < 1 || basePriceLakhs > 500) {
      toast({ title: "Base price must be 1–500 lakhs", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(soldPercent) || soldPercent < 0 || soldPercent > 60) {
      toast({ title: "Pre-sold percent must be 0–60", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const res = await api<{ generated: number }>(`/api/admin/projects/${genProject.id}/generate-units`, {
        method: "POST",
        body: JSON.stringify({
          towers: genForm.towers.trim(),
          floors,
          unitsPerFloor,
          unitType: genForm.unitType.trim() || "Unit",
          areaSqft,
          basePriceLakhs,
          soldPercent,
          ...(genForm.replace ? { replace: true } : {}),
        }),
      });
      toast({ title: `Generated ${res.generated} units`, description: `${genProject.name} inventory is live.` });
      setGenProject(null);
      setGenForm(EMPTY_GENERATOR);
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-moss">
          {projects.length} project{projects.length === 1 ? "" : "s"} · {projects.reduce((sum, p) => sum + p.flatCount, 0).toLocaleString("en-IN")} bookable units
        </p>
        <Button onClick={openCreate} className="bg-gold text-forest-deep font-semibold hover:bg-gold-deep hover:text-cream">
          <Plus className="size-4" /> Add Project
        </Button>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <AdminCard>
          <p className="py-8 text-center text-sm text-moss">
            No projects yet — create your first one to start selling units.
          </p>
        </AdminCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <AdminCard key={project.id} className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative h-40 sm:h-28 sm:w-40 w-full shrink-0 overflow-hidden rounded-xl border border-sand">
                  <img src={project.image} alt={project.name} className="h-full w-full object-cover" />
                  {project.featured && (
                    <span className="absolute left-2 top-2 rounded-full bg-forest-deep/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-light">
                      Featured
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-forest">{project.name}</h3>
                      <p className="flex items-center gap-1 truncate text-xs text-moss">
                        <LinkIcon className="size-3 shrink-0" /> /{project.slug}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Label htmlFor={`featured-${project.id}`} className="text-[11px] text-moss">
                        Featured
                      </Label>
                      <Switch
                        id={`featured-${project.id}`}
                        checked={project.featured}
                        onCheckedChange={(checked) => void toggleFeatured(project, checked)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={project.type} />
                    <ProjectStatusBadge status={project.status} />
                    <span className="rounded-full border border-sand bg-sand/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                      {project.flatCount} units
                    </span>
                    <span className="rounded-full border border-sand bg-cream px-2.5 py-0.5 text-[11px] text-moss">
                      Sort {project.sortOrder}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-moss">
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="size-3 shrink-0 text-gold-deep" />
                      <span className="truncate">{project.location}</span>
                    </span>
                    <span className="font-semibold text-forest">{project.price}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(project)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gold/50 text-gold-deep hover:bg-gold/10 hover:text-gold-deep"
                      onClick={() => {
                        setGenProject(project);
                        setGenForm(EMPTY_GENERATOR);
                      }}
                    >
                      <Layers className="size-3.5" /> Units
                    </Button>
                    <ConfirmAction
                      triggerLabel="Delete"
                      triggerTitle={`Delete ${project.name}`}
                      title={`Delete “${project.name}”?`}
                      description={`Deletes project + all its units/bookings${project.flatCount > 0 ? ` (${project.flatCount} units and their booking records)` : ""}. This cannot be undone.`}
                      confirmLabel="Delete Project"
                      busyLabel="Deleting…"
                      onConfirm={() => handleDelete(project)}
                    />
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-moss/70">
        <RefreshCw className="size-3.5 text-gold-deep" />
        Public site shows project changes on next page load.
      </p>

      {/* ── Add / Edit dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-w-3xl w-[94vw] gap-0 overflow-hidden rounded-2xl border-gold/40 bg-pearl p-0">
          <div className="royal-panel px-5 sm:px-6 py-4">
            <DialogTitle className="font-display text-xl font-bold text-cream">
              {editing ? `Edit — ${editing.name}` : "Add Project"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-sage/80">
              {editing ? "Update the portfolio entry. Slug changes alter the public URL." : "A new portfolio entry for the public site."}
            </DialogDescription>
            <span className="gold-hairline mt-3 block" aria-hidden="true" />
          </div>

          <div className="max-h-[70vh] overflow-y-auto scroll-area-thin px-5 sm:px-6 py-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-name" className="text-forest">Name *</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Sai Green Woods Phase 4" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-slug" className="text-forest">Slug</Label>
                <Input id="p-slug" value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="auto from name" className="bg-white font-mono text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-tagline" className="text-forest">Tagline</Label>
              <Input id="p-tagline" value={form.tagline} onChange={(e) => setField("tagline", e.target.value)} placeholder="A short one-line promise" className="bg-white" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-location" className="text-forest">Location *</Label>
                <Input id="p-location" value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Kopargaon, Ahmednagar" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price" className="text-forest">Price label</Label>
                <Input id="p-price" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="₹18.5 L onwards" className="bg-white" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-forest">Type *</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-forest">Status *</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-land" className="text-forest">Land area</Label>
                <Input id="p-land" value={form.landArea} onChange={(e) => setField("landArea", e.target.value)} placeholder="12 acres" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-total" className="text-forest">Total units (label)</Label>
                <Input id="p-total" value={form.totalUnits} onChange={(e) => setField("totalUnits", e.target.value)} placeholder="108 plots" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sizes" className="text-forest">Unit sizes</Label>
                <Input id="p-sizes" value={form.unitSizes} onChange={(e) => setField("unitSizes", e.target.value)} placeholder="1200 – 2400 sq.ft" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-rera" className="text-forest">MahaRERA number</Label>
                <Input id="p-rera" value={form.reraNumber} onChange={(e) => setField("reraNumber", e.target.value)} placeholder="P52200079044" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-possession" className="text-forest">Possession date</Label>
                <Input id="p-possession" value={form.possessionDate} onChange={(e) => setField("possessionDate", e.target.value)} placeholder="Dec 2026" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sort" className="text-forest">Sort order</Label>
                <Input id="p-sort" type="number" min={0} max={999} value={form.sortOrder} onChange={(e) => setField("sortOrder", e.target.value)} className="bg-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-description" className="text-forest">Description</Label>
              <Textarea id="p-description" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="The story buyers read on the project page…" className="min-h-24 bg-white" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-highlights" className="text-forest">Highlights</Label>
                <Textarea id="p-highlights" value={form.highlights} onChange={(e) => setField("highlights", e.target.value)} placeholder={"One highlight per line\nGated community\nRiver-side plots"} className="min-h-28 bg-white" />
                <p className="text-[11px] text-moss/80">One per line · max 12</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-amenities" className="text-forest">Amenities</Label>
                <Textarea id="p-amenities" value={form.amenities} onChange={(e) => setField("amenities", e.target.value)} placeholder={"One amenity per line\nClubhouse\nSwimming pool"} className="min-h-28 bg-white" />
                <p className="text-[11px] text-moss/80">One per line · max 24</p>
              </div>
            </div>

            <UploadField
              label="Cover image"
              value={form.image}
              onChange={(url) => setField("image", url)}
              hint="JPG / PNG / WebP up to 6 MB. Leave empty to keep the default cover."
            />

            {/* Gallery manager */}
            <div className="space-y-2.5 rounded-xl border border-sand bg-cream/60 p-4">
              <p className="text-sm font-medium text-forest">Gallery images ({form.gallery.length})</p>
              {form.gallery.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.gallery.map((url, index) => (
                    <div key={`${url}-${index}`} className="group relative h-20 overflow-hidden rounded-xl border border-sand">
                      <img src={url} alt={`Gallery image ${index + 1}`} className="h-full w-full object-cover" />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-forest-deep/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-light">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove gallery image ${index + 1}`}
                        onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }))}
                        className="absolute right-1 top-1 rounded-full bg-brick/90 p-1 text-white opacity-90 transition-opacity hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="gallery-upload-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void addGalleryFile(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={galleryUploading}
                  onClick={() => document.getElementById("gallery-upload-input")?.click()}
                >
                  {galleryUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                  Upload photo
                </Button>
                <Input
                  value={galleryUrlDraft}
                  onChange={(e) => setGalleryUrlDraft(e.target.value)}
                  placeholder="…or paste an image URL"
                  className="h-8 flex-1 min-w-40 text-xs bg-white"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => {
                    const url = galleryUrlDraft.trim();
                    if (url) {
                      setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
                      setGalleryUrlDraft("");
                    }
                  }}
                >
                  Add URL
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-sand bg-cream/60 px-4 py-3">
              <Switch id="p-featured" checked={form.featured} onCheckedChange={(checked) => setField("featured", checked)} />
              <Label htmlFor="p-featured" className="text-forest">
                Featured project
                <span className="ml-2 text-xs font-normal text-moss">highlighted on the home page</span>
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-sand bg-pearl px-5 sm:px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="bg-forest text-cream hover:bg-pine">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editing ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Unit generator dialog ─────────────────────────────────── */}
      <Dialog open={genProject !== null} onOpenChange={(open) => !generating && !open && setGenProject(null)}>
        <DialogContent className="max-w-xl w-[94vw] rounded-2xl border-gold/40 bg-pearl p-0 gap-0 overflow-hidden">
          <div className="royal-panel px-5 sm:px-6 py-4">
            <DialogTitle className="font-display text-xl font-bold text-cream">
              Generate Units — {genProject?.name}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-sage/80">
              Bulk-create bookable units with deterministic pre-sold patterns.
            </DialogDescription>
            <span className="gold-hairline mt-3 block" aria-hidden="true" />
          </div>

          <div className="max-h-[70vh] overflow-y-auto scroll-area-thin px-5 sm:px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-towers" className="text-forest">Towers / sectors *</Label>
              <Input id="g-towers" value={genForm.towers} onChange={(e) => setGenForm((f) => ({ ...f, towers: e.target.value }))} placeholder="Tower A, Tower B" className="bg-white" />
              <p className="text-[11px] text-moss/80">Comma-separated labels — unit numbers derive from the last word of each.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="g-floors" className="text-forest">Floors (1–12) *</Label>
                <Input id="g-floors" type="number" min={1} max={12} value={genForm.floors} onChange={(e) => setGenForm((f) => ({ ...f, floors: e.target.value }))} className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-upf" className="text-forest">Units per floor (1–12) *</Label>
                <Input id="g-upf" type="number" min={1} max={12} value={genForm.unitsPerFloor} onChange={(e) => setGenForm((f) => ({ ...f, unitsPerFloor: e.target.value }))} className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-type" className="text-forest">Unit type *</Label>
                <Input id="g-type" value={genForm.unitType} onChange={(e) => setGenForm((f) => ({ ...f, unitType: e.target.value }))} placeholder="2 BHK / Plot" className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-area" className="text-forest">Area (sq.ft) *</Label>
                <Input id="g-area" type="number" min={200} max={20000} value={genForm.areaSqft} onChange={(e) => setGenForm((f) => ({ ...f, areaSqft: e.target.value }))} className="bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-price" className="text-forest">Base price (lakhs) *</Label>
                <Input id="g-price" type="number" min={1} max={500} step="0.05" value={genForm.basePriceLakhs} onChange={(e) => setGenForm((f) => ({ ...f, basePriceLakhs: e.target.value }))} className="bg-white" />
                <p className="text-[11px] text-moss/80">+0.25 L per floor, rounded to 0.05.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-sold" className="text-forest">Pre-sold percent (0–60)</Label>
                <Input id="g-sold" type="number" min={0} max={60} value={genForm.soldPercent} onChange={(e) => setGenForm((f) => ({ ...f, soldPercent: e.target.value }))} className="bg-white" />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-sand bg-cream/60 px-4 py-3.5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="g-replace"
                  checked={genForm.replace}
                  onCheckedChange={(checked) => setGenForm((f) => ({ ...f, replace: checked === true }))}
                  className="mt-0.5"
                />
                <Label htmlFor="g-replace" className="text-forest font-medium">
                  Replace existing units
                  {genProject && genProject.flatCount > 0 && (
                    <span className="ml-1 font-normal text-moss">({genProject.flatCount} units)</span>
                  )}
                </Label>
              </div>
              {genForm.replace && (
                <p className="flex items-start gap-1.5 rounded-lg bg-brick/10 px-3 py-2 text-xs text-brick" role="alert">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Destructive: this deletes the project&apos;s existing units and their booking records before regenerating.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-sand bg-pearl px-5 sm:px-6 py-4">
            <Button variant="outline" onClick={() => setGenProject(null)} disabled={generating}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleGenerate()}
              disabled={generating}
              className={cn(
                "text-cream",
                genForm.replace ? "bg-brick hover:bg-brick/90" : "bg-forest hover:bg-pine"
              )}
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Layers />}
              Generate Units
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
