"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageSquareHeart, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { PublicReview, SiteProject, SiteTestimonial } from "@/lib/types";
import { ViewHero } from "./view-hero";
import { Testimonials } from "../testimonials";
import { CtaBanner } from "../cta-banner";
import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { PhotoLightbox } from "../photo-lightbox";
import { PhotoUploader } from "../photo-uploader";
import { cn } from "@/lib/utils";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewsView({
  testimonials,
  projects,
}: {
  testimonials: SiteTestimonial[];
  projects: SiteProject[];
}) {
  return (
    <>
      <ViewHero
        eyebrow="Reviews"
        title="What Our Families Say"
        description="Unfiltered words from plot owners, villa residents and shopkeepers of Sai Green Woods."
      />
      <VisitorReviews />
      <ShareYourExperience projects={projects} />
      <Testimonials testimonials={testimonials} />
      <CtaBanner />
    </>
  );
}

/* ── Visitor reviews showcase ──────────────────────────────────────── */

function VisitorReviews() {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [lightbox, setLightbox] = useState<{ reviewIndex: number; photoIndex: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews");
        const data: { success?: boolean; reviews?: PublicReview[]; error?: string } = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error ?? "Failed to load reviews");
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lightboxPhotos = useMemo(() => {
    if (!lightbox || !reviews) return [];
    const review = reviews[lightbox.reviewIndex];
    if (!review) return [];
    return review.photos.map((url) => ({
      url,
      caption: review.title ?? `${review.name}'s photos`,
    }));
  }, [lightbox, reviews]);

  return (
    <section id="visitor-reviews" className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Visitor Reviews"
          title="Voices from Our Community"
          subtitle="Moderated reviews from buyers and residents — the good, the honest and everything in between."
        />

        {reviews !== null && reviews.length > 0 && (
          <p className="mt-3 text-center text-sm text-moss">
            <span className="font-bold text-gold-deep">{reviews.length}</span>{" "}
            {reviews.length === 1 ? "family has" : "families have"} shared their story
          </p>
        )}

        {reviews === null && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading reviews">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        )}

        {reviews !== null && reviews.length === 0 && (
          <Reveal className="mt-12">
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-gold/40 bg-sand px-6 py-10 text-center">
              <MessageSquareHeart className="h-8 w-8 text-gold-deep mx-auto mb-3" aria-hidden="true" />
              <p className="font-display text-lg font-bold text-forest">
                No visitor reviews yet
              </p>
              <p className="mt-1 text-sm text-moss">
                Be the first — share your experience in the form below.
              </p>
            </div>
          </Reveal>
        )}

        {reviews !== null && reviews.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <Reveal key={review.id} delay={i * 0.06} className="h-full">
                <article className="flex h-full flex-col rounded-3xl bg-white border border-border shadow-[0_18px_44px_-30px_rgba(15,61,42,0.45)] p-6">
                  <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-4 w-4",
                          s < review.rating ? "fill-gold text-gold" : "fill-transparent text-gold/30"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {review.title && (
                    <h3 className="mt-3 font-display text-lg font-bold text-forest leading-snug">
                      {review.title}
                    </h3>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-moss flex-1">{review.comment}</p>

                  {review.photos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.photos.slice(0, 4).map((url, pi) => (
                        <button
                          key={`${url}-${pi}`}
                          type="button"
                          onClick={() => setLightbox({ reviewIndex: i, photoIndex: pi })}
                          className="h-16 w-24 overflow-hidden rounded-lg border border-border focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                          aria-label={`View photo ${pi + 1} from ${review.name}`}
                        >
                          <img
                            src={url}
                            alt={`Photo shared by ${review.name}`}
                            loading="lazy"
                            className="h-full w-full object-cover hover:scale-110 transition-transform duration-500"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <footer className="mt-4 pt-4 border-t border-sage flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-forest">{review.name}</span>
                    {review.projectName && (
                      <span className="rounded-full bg-sage text-pine px-2.5 py-0.5 text-[11px] font-semibold">
                        {review.projectName}
                      </span>
                    )}
                    {review.flatNo && (
                      <span className="rounded-full bg-sage text-pine px-2.5 py-0.5 text-[11px] font-semibold">
                        Flat {review.flatNo}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-moss/80">
                      {fmtDate(review.createdAt)}
                    </span>
                  </footer>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {lightbox && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          index={lightbox.photoIndex}
          onClose={() => setLightbox(null)}
          onIndexChange={(photoIndex) => setLightbox((l) => (l ? { ...l, photoIndex } : l))}
        />
      )}
    </section>
  );
}

/* ── Share-your-experience submission card ─────────────────────────── */

function ShareYourExperience({ projects }: { projects: SiteProject[] }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [projectName, setProjectName] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedProject = projectName === "Other" ? customProject.trim() : projectName;

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setRating(0);
    setTitle("");
    setComment("");
    setProjectName("");
    setCustomProject("");
    setFlatNo("");
    setPhotos([]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/\s/g, "");

    if (cleanName.length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    if (phone && !/^\+?[0-9]{6,15}$/.test(cleanPhone)) {
      setError("Please enter a valid phone number (digits only).");
      return;
    }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters about your experience.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone || undefined,
          email: cleanEmail || undefined,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          projectName: resolvedProject || undefined,
          flatNo: flatNo.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        }),
      });
      const data: { success?: boolean; message?: string; error?: string } = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Submission failed");
      toast({
        title: "Thank you!",
        description: data.message ?? "Your review is submitted for moderation.",
      });
      resetForm();
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Could not submit review",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="review-form" className="bg-sand py-20 lg:py-24" aria-label="Share your experience">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative royal-panel overflow-hidden rounded-[2.5rem] shadow-royal">
            <div className="absolute inset-0 pattern-dots opacity-30" aria-hidden="true" />
            <div className="absolute -bottom-24 left-[-6rem] h-80 w-80 rounded-full bg-gold/12 blur-3xl" aria-hidden="true" />

            <div className="relative grid lg:grid-cols-[0.85fr_1.15fr] gap-10 p-8 sm:p-12 lg:p-14">
              {/* Copy */}
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-gold">
                  <MessageSquareHeart className="h-3.5 w-3.5" aria-hidden="true" />
                  Share Your Experience
                </span>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-cream leading-tight">
                  Your story helps the next family decide.
                </h2>
                <Quote className="mt-5 h-7 w-7 text-gold/60" aria-hidden="true" />
                <p className="mt-3 text-sage/85 text-base leading-relaxed">
                  Lived with us? Bought a plot? Tell future families how it went — your review
                  appears after a quick moderation.
                </p>
                <p className="mt-4 text-sm text-sage/70 leading-relaxed">
                  Add photos along with your project &amp; flat number, and we&rsquo;ll also create a
                  transformation album for your home in the Gallery.
                </p>
              </div>

              {/* Form */}
              <div>
                {submitted ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-gold/30 bg-white/5 px-6 py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-gold" aria-hidden="true" />
                    <p className="font-display text-xl font-bold text-cream">Review submitted!</p>
                    <p className="text-sm text-sage/80 max-w-sm leading-relaxed">
                      Thank you for sharing your experience. Your review will appear on this page
                      once our team approves it.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      className="rounded-xl border-white/25 bg-white/10 text-cream hover:bg-white/20 hover:text-white h-11 px-6"
                    >
                      Write another review
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="review-name" className="text-sage/85 text-sm font-medium">
                          Name <span className="text-gold">*</span>
                        </Label>
                        <Input
                          id="review-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="review-phone" className="text-sage/85 text-sm font-medium">
                          Phone
                        </Label>
                        <Input
                          id="review-phone"
                          type="tel"
                          inputMode="numeric"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
                          placeholder="98XXX XXXXX (optional)"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="review-email" className="text-sage/85 text-sm font-medium">
                          Email
                        </Label>
                        <Input
                          id="review-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com (optional)"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="review-title" className="text-sage/85 text-sm font-medium">
                          Review Title
                        </Label>
                        <Input
                          id="review-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. A green retreat in Kopargaon"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                          maxLength={80}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span id="review-rating-label" className="block text-sage/85 text-sm font-medium">
                        Your Rating <span className="text-gold">*</span>
                      </span>
                      <div
                        className="flex gap-1"
                        role="radiogroup"
                        aria-labelledby="review-rating-label"
                      >
                        {Array.from({ length: 5 }).map((_, i) => {
                          const value = i + 1;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={rating === value}
                              aria-label={`${value} star${value > 1 ? "s" : ""}`}
                              onClick={() => setRating(value)}
                              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  value <= rating ? "fill-gold text-gold" : "fill-transparent text-gold/40"
                                )}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="review-comment" className="text-sage/85 text-sm font-medium">
                        Your Experience <span className="text-gold">*</span>
                      </Label>
                      <Textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell future families about your visit, purchase or life at Sai Green Woods…"
                        className="min-h-28 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        maxLength={1200}
                      />
                      <p className="text-[11px] text-sage/50 text-right">{comment.length}/1200</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="review-project" className="text-sage/85 text-sm font-medium">
                          Project
                        </Label>
                        <Select value={projectName} onValueChange={setProjectName}>
                          <SelectTrigger
                            id="review-project"
                            className="h-11 rounded-xl bg-white/10 border-white/20 text-white focus-visible:ring-gold [&>span]:truncate"
                          >
                            <SelectValue placeholder="Select a project (optional)" />
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
                      <div className="space-y-1.5">
                        <Label htmlFor="review-flat" className="text-sage/85 text-sm font-medium">
                          Flat / Plot No.
                        </Label>
                        <Input
                          id="review-flat"
                          value={flatNo}
                          onChange={(e) => setFlatNo(e.target.value)}
                          placeholder="e.g. B-07 (optional)"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                    </div>

                    {projectName === "Other" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="review-custom-project" className="text-sage/85 text-sm font-medium">
                          Project Name
                        </Label>
                        <Input
                          id="review-custom-project"
                          value={customProject}
                          onChange={(e) => setCustomProject(e.target.value)}
                          placeholder="Your project / phase name"
                          className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-sage/40 focus-visible:ring-gold"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-sage/85 text-sm font-medium">
                        Photos
                        <span className="ml-1 text-sage/50 font-normal">(max 6, JPG/PNG/WebP ≤ 6 MB)</span>
                      </Label>
                      <PhotoUploader
                        id="review-photos"
                        value={photos}
                        onChange={setPhotos}
                        max={6}
                        disabled={submitting}
                        label="Add Photos"
                      />
                      <p className="text-[11px] text-sage/50 leading-relaxed">
                        With a project &amp; flat number, your photos also become a transformation
                        album in the Gallery.
                      </p>
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
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5 fill-forest" />}
                      Submit Review for Moderation
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
