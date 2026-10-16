"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, Home, Images, Loader2, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { PublicAlbum, SiteProject } from "@/lib/types";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { PhotoLightbox } from "./photo-lightbox";
import { PhotoUploader } from "./photo-uploader";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Community transformation albums, grouped by project, + submission card. */
export function CommunityAlbums({ projects }: { projects: SiteProject[] }) {
  const [albums, setAlbums] = useState<PublicAlbum[] | null>(null);
  const [openAlbum, setOpenAlbum] = useState<PublicAlbum | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/albums");
        const data: { success?: boolean; albums?: PublicAlbum[]; error?: string } = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to load albums");
        if (!cancelled) setAlbums(data.albums ?? []);
      } catch {
        if (!cancelled) setAlbums([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    if (!albums) return [] as [string, PublicAlbum[]][];
    const map = new Map<string, PublicAlbum[]>();
    for (const album of albums) {
      const list = map.get(album.projectName);
      if (list) list.push(album);
      else map.set(album.projectName, [album]);
    }
    return [...map.entries()];
  }, [albums]);

  function closeAlbum() {
    setOpenAlbum(null);
    setPhotoIndex(null);
  }

  return (
    <>
      <section id="albums" className="bg-cream py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Community Albums"
            title="Home Transformations — By Our Owners"
            subtitle="Real homes, real journeys. Albums shared by the families of Sai Green Woods, from bare walls to beautiful living."
          />

          <div className="mt-12 space-y-10">
            {albums === null && (
              <div className="flex flex-wrap gap-5" aria-label="Loading albums">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-44 w-64 rounded-2xl" />
                ))}
              </div>
            )}

            {albums !== null && albums.length === 0 && (
              <Reveal>
                <div className="rounded-3xl border border-dashed border-gold/40 bg-sand px-6 py-10 text-center">
                  <Camera className="h-8 w-8 text-gold-deep mx-auto mb-3" aria-hidden="true" />
                  <p className="font-display text-lg font-bold text-forest">
                    No transformation albums yet
                  </p>
                  <p className="mt-1 text-sm text-moss">
                    Be the first — share your flat&rsquo;s journey in the form below.
                  </p>
                </div>
              </Reveal>
            )}

            {groups.map(([projectName, projectAlbums]) => (
              <Reveal key={projectName}>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-gold-deep/50" aria-hidden="true" />
                    <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-gold-deep">
                      {projectName}
                    </h3>
                    <span className="text-[11px] text-moss">
                      {projectAlbums.length} {projectAlbums.length === 1 ? "album" : "albums"}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-5">
                    {projectAlbums.map((album) => (
                      <button
                        key={album.id}
                        type="button"
                        onClick={() => setOpenAlbum(album)}
                        className="group relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl shadow-royal focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                        aria-label={`Open album: ${album.title}`}
                      >
                        {album.coverPhoto ? (
                          <img
                            src={album.coverPhoto}
                            alt={`${album.title} cover`}
                            loading="lazy"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="h-full w-full bg-forest flex items-center justify-center">
                            <Home className="h-10 w-10 text-gold/60" aria-hidden="true" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
                        <div className="absolute inset-x-3 bottom-3 text-left">
                          <p className="font-display text-sm font-bold text-white leading-snug line-clamp-2">
                            {album.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-gold/90 text-forest text-[10px] font-bold px-2 py-0.5">
                              Flat {album.flatNo}
                            </span>
                            <span className="rounded-full bg-white/15 text-white text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm">
                              {album.ownerName}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 text-white text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm">
                              <Images className="h-3 w-3" aria-hidden="true" />
                              {album.photoCount}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Album viewer */}
        <Dialog open={!!openAlbum} onOpenChange={(o) => !o && closeAlbum()}>
          <DialogContent className="max-w-4xl w-[94vw] bg-cream rounded-3xl p-0 overflow-hidden">
            {openAlbum && (
              <>
                <div className="bg-forest px-6 py-5">
                  <DialogTitle className="font-display text-xl font-bold text-white">
                    {openAlbum.title}
                  </DialogTitle>
                  <DialogDescription className="text-sage/75 text-sm mt-1">
                    {openAlbum.projectName} · Flat {openAlbum.flatNo} · by {openAlbum.ownerName} ·{" "}
                    {fmtDate(openAlbum.createdAt)}
                  </DialogDescription>
                </div>
                <div className="p-6">
                  {openAlbum.description && (
                    <p className="mb-5 text-sm text-moss leading-relaxed">
                      &ldquo;{openAlbum.description}&rdquo;
                    </p>
                  )}
                  <div className="max-h-[60vh] overflow-y-auto scroll-area-thin pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {openAlbum.photos.map((photo, i) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          className="group text-left focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none rounded-xl"
                          aria-label={`Open photo ${i + 1} of ${openAlbum.photos.length}`}
                        >
                          <div className="overflow-hidden rounded-xl">
                            <img
                              src={photo.url}
                              alt={photo.caption ?? `${openAlbum.title} — photo ${i + 1}`}
                              loading="lazy"
                              className="h-36 sm:h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-moss truncate">
                            {photo.caption ?? `Photo ${i + 1}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {photoIndex !== null && (
                  <PhotoLightbox
                    photos={openAlbum.photos.map((p) => ({
                      url: p.url,
                      caption: p.caption ?? openAlbum.title,
                    }))}
                    index={photoIndex}
                    onClose={() => setPhotoIndex(null)}
                    onIndexChange={setPhotoIndex}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </section>

      <ShareTransformation projects={projects} />
    </>
  );
}

/* ── Share-your-transformation submission card ─────────────────────── */

function ShareTransformation({ projects }: { projects: SiteProject[] }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedProject = projectName === "Other" ? customProject.trim() : projectName;

  function resetForm() {
    setTitle("");
    setProjectName("");
    setCustomProject("");
    setFlatNo("");
    setOwnerName("");
    setDescription("");
    setPhotos([]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 4) {
      setError("Album title must be at least 4 characters.");
      return;
    }
    if (!projectName) {
      setError("Please select your project.");
      return;
    }
    if (projectName === "Other" && resolvedProject.length < 2) {
      setError("Please enter your project's name.");
      return;
    }
    if (!flatNo.trim()) {
      setError("Please enter your flat / plot number.");
      return;
    }
    if (ownerName.trim().length < 2) {
      setError("Your name must be at least 2 characters.");
      return;
    }
    if (photos.length === 0) {
      setError("Please add at least one photo of your home.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          projectName: resolvedProject,
          flatNo: flatNo.trim(),
          ownerName: ownerName.trim(),
          photos: photos.map((url) => ({ url })),
        }),
      });
      const data: { success?: boolean; message?: string; error?: string } = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Submission failed");
      toast({
        title: "Thank you!",
        description: data.message ?? "Your transformation album is submitted for moderation.",
      });
      resetForm();
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Could not submit album",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-sand py-20 lg:py-24" aria-label="Share your transformation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative royal-panel overflow-hidden rounded-[2.5rem] shadow-royal">
            <div className="absolute inset-0 pattern-dots opacity-30" aria-hidden="true" />
            <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-gold/12 blur-3xl" aria-hidden="true" />

            <div className="relative grid lg:grid-cols-[0.85fr_1.15fr] gap-10 p-8 sm:p-12 lg:p-14">
              {/* Copy */}
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-gold">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Share Your Transformation
                </span>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-cream leading-tight">
                  Moved in and made it yours?
                </h2>
                <Quote className="mt-5 h-7 w-7 text-gold/60" aria-hidden="true" />
                <p className="mt-3 text-sage/85 text-base leading-relaxed">
                  Create an album of your flat&rsquo;s journey — it becomes a separate album under
                  your project and flat number, shown after moderation.
                </p>
                <p className="mt-4 text-sm text-sage/70 leading-relaxed">
                  Photos of your interiors, garden, balcony garden or shopfront inspire the next
                  family choosing their home at Sai Green Woods.
                </p>
              </div>

              {/* Form */}
              <div>
                {submitted ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-gold/30 bg-white/5 px-6 py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-gold" aria-hidden="true" />
                    <p className="font-display text-xl font-bold text-cream">Album submitted!</p>
                    <p className="text-sm text-sage/80 max-w-sm leading-relaxed">
                      Thank you for sharing your home. Your album will appear under your project
                      once our team approves it.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      className="rounded-xl border-white/25 bg-white/10 text-cream hover:bg-white/20 hover:text-white h-11 px-6"
                    >
                      Create another album
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="album-title" className="text-sage/85 text-sm font-medium">
                          Album Title <span className="text-gold">*</span>
                        </Label>
                        <Input
                          id="album-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Our Phase 2 villa journey"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="album-project" className="text-sage/85 text-sm font-medium">
                          Project <span className="text-gold">*</span>
                        </Label>
                        <Select value={projectName} onValueChange={setProjectName}>
                          <SelectTrigger
                            id="album-project"
                            className="h-11 rounded-xl bg-white/10 border-white/20 text-white focus-visible:ring-gold [&>span]:truncate"
                          >
                            <SelectValue placeholder="Select your project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p.slug} value={p.name}>
                                {p.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {projectName === "Other" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="album-custom-project" className="text-sage/85 text-sm font-medium">
                          Project Name <span className="text-gold">*</span>
                        </Label>
                        <Input
                          id="album-custom-project"
                          value={customProject}
                          onChange={(e) => setCustomProject(e.target.value)}
                          placeholder="Your project / phase name"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="album-flat" className="text-sage/85 text-sm font-medium">
                          Flat / Plot No. <span className="text-gold">*</span>
                        </Label>
                        <Input
                          id="album-flat"
                          value={flatNo}
                          onChange={(e) => setFlatNo(e.target.value)}
                          placeholder="e.g. B-07"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="album-owner" className="text-sage/85 text-sm font-medium">
                          Your Name <span className="text-gold">*</span>
                        </Label>
                        <Input
                          id="album-owner"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Rahul Patil"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="album-description" className="text-sage/85 text-sm font-medium">
                        Description (optional)
                      </Label>
                      <Textarea
                        id="album-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell future neighbours about your journey…"
                        className="min-h-20 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        maxLength={600}
                      />
                      <p className="text-[11px] text-sage/50 text-right">
                        {description.length}/600
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sage/85 text-sm font-medium">
                        Photos <span className="text-gold">*</span>
                        <span className="ml-1 text-sage/50 font-normal">(1–8, JPG/PNG/WebP ≤ 6 MB)</span>
                      </Label>
                      <PhotoUploader
                        id="album-photos"
                        value={photos}
                        onChange={setPhotos}
                        max={8}
                        disabled={submitting}
                        label="Add Photos"
                      />
                    </div>

                    {error && (
                      <p
                        className="text-sm font-medium text-gold-light bg-brick/20 border border-brick/40 rounded-xl px-4 py-2.5"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 bg-gold hover:bg-gold-deep text-forest font-bold rounded-xl"
                    >
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                      Submit Album for Moderation
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
