"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, BedDouble, Ruler, Building2, Phone, Download, ArrowRight,
  Landmark, CalendarDays, FileCheck2, Loader2, TrendingUp, MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnquiry } from "./site-context";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Countdown, parsePossession } from "./countdown";
import { SITE } from "@/lib/site";
import type { SiteProject } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof BedDouble> = {
  Plots: Ruler,
  Villas: Building2,
  Apartments: Building2,
  Commercial: Landmark,
};

function StatusBadge({ status }: { status: SiteProject["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm border",
        status === "Ongoing" && "bg-gold/90 text-forest border-gold/60",
        status === "Completed" && "bg-leaf/90 text-white border-leaf/60",
        status === "Upcoming" && "bg-brick/90 text-white border-brick/60"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "Ongoing" ? "bg-forest" : "bg-white")} aria-hidden="true" />
      {status}
    </span>
  );
}

interface SoldBarProps {
  stats?: { total: number; sold: number; available: number };
  noun: string;
}

function SoldBar({ stats, noun }: SoldBarProps) {
  if (!stats || stats.total === 0) return null;
  const pct = Math.round((stats.sold / stats.total) * 100);
  return (
    <div className="mt-3.5 rounded-xl bg-forest/5 border border-pine/15 px-3 py-2.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-forest">
          <TrendingUp className="h-3.5 w-3.5 text-leaf" aria-hidden="true" />
          {stats.sold} of {stats.total} {noun} sold
        </span>
        <span className="text-gold-deep">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-leaf to-pine transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {stats.available > 0 ? (
        <div className="mt-1.5 text-[10px] font-semibold text-leaf">
          ● {stats.available} {noun} available to book now
        </div>
      ) : (
        <div className="mt-1.5 text-[10px] font-semibold text-brick">
          ● Fully sold out — join the waitlist via enquiry
        </div>
      )}
    </div>
  );
}

const UNIT_NOUN: Record<string, string> = {
  Plots: "plots",
  Villas: "villas",
  Apartments: "flats",
  Commercial: "units",
};

export function Projects({ projects, flatStats }: { projects: SiteProject[]; flatStats?: Record<string, { total: number; sold: number; available: number; locked: number }> }) {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<SiteProject | null>(null);
  const { openEnquiry, goToBooking } = useEnquiry();

  const filtered = useMemo(() => {
    if (filter === "All") return projects;
    if (filter === "Ongoing") return projects.filter((p) => p.status === "Ongoing");
    if (filter === "Completed") return projects.filter((p) => p.status === "Completed");
    return projects.filter((p) => p.status === "Upcoming");
  }, [filter, projects]);

  return (
    <section id="projects" className="bg-sage/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Projects"
          title="Ongoing, Completed & Upcoming Developments"
          subtitle="Explore our portfolio of MahaRERA-registered plots, villas, apartments and commercial spaces — each crafted with the same promise of quality and green living."
        />

        {/* Tabs */}
        <Reveal delay={0.15} className="mt-10 flex justify-center">
          <Tabs value={filter} onValueChange={setFilter} className="w-full max-w-full">
            <TabsList className="bg-white rounded-full p-1.5 h-auto gap-1 shadow-sm border border-border flex-wrap justify-center max-w-full">
              {["All", "Ongoing", "Completed", "Upcoming"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-full px-4 sm:px-7 py-2.5 text-xs sm:text-sm font-semibold data-[state=active]:bg-pine data-[state=active]:text-white text-forest/70"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Reveal>

        {/* Cards grid */}
        <motion.div layout className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => {
              const TypeIcon = TYPE_ICONS[project.type] ?? Building2;
              return (
                <motion.article
                  layout
                  key={project.slug}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col rounded-3xl bg-white overflow-hidden shadow-[0_18px_44px_-26px_rgba(15,61,42,0.4)] hover:shadow-[0_26px_56px_-24px_rgba(15,61,42,0.5)] hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/95 text-xs font-medium">
                      <TypeIcon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      {project.type}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-gold text-forest text-xs font-bold px-2.5 py-1 rounded-md">
                      {project.price}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-display text-xl font-bold text-forest leading-snug">{project.name}</h3>
                    {project.tagline && <p className="mt-1 text-[13px] text-gold-deep font-medium">{project.tagline}</p>}
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-moss">
                      <MapPin className="h-3.5 w-3.5 text-leaf shrink-0" aria-hidden="true" />
                      {project.location}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] text-forest/80">
                      {project.totalUnits && (
                        <span className="inline-flex items-center gap-1 bg-sage rounded-full px-2.5 py-1 font-medium">
                          <BedDouble className="h-3 w-3 text-pine" aria-hidden="true" />
                          {project.totalUnits}
                        </span>
                      )}
                      {project.unitSizes && (
                        <span className="inline-flex items-center gap-1 bg-sage rounded-full px-2.5 py-1 font-medium">
                          <Ruler className="h-3 w-3 text-pine" aria-hidden="true" />
                          {project.unitSizes}
                        </span>
                      )}
                      {project.possessionDate && (
                        <span className="inline-flex items-center gap-1 bg-sage rounded-full px-2.5 py-1 font-medium">
                          <CalendarDays className="h-3 w-3 text-pine" aria-hidden="true" />
                          {project.possessionDate}
                        </span>
                      )}
                    </div>

                    <SoldBar
                      stats={flatStats?.[project.slug]}
                      noun={UNIT_NOUN[project.type] ?? "units"}
                    />

                    <div className="mt-auto pt-5 flex items-center gap-2.5">
                      <Button
                        onClick={() => setSelected(project)}
                        className="flex-1 bg-pine hover:bg-leaf text-white font-semibold rounded-xl h-10"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        onClick={() => goToBooking(project.slug)}
                        variant="outline"
                        className="border-gold-deep/50 text-gold-deep hover:bg-gold/15 font-semibold rounded-xl h-10"
                      >
                        <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                        Book Unit
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-moss">No projects in this category yet. Check back soon!</p>
        )}
      </div>

      {/* Detail dialog */}
      <ProjectDialog
        project={selected}
        onClose={() => setSelected(null)}
        onEnquire={(name) => { setSelected(null); openEnquiry(name); }}
        onBook={(slug) => { setSelected(null); goToBooking(slug); }}
        flatStats={flatStats}
      />
    </section>
  );
}

function ProjectDialog({
  project,
  onClose,
  onEnquire,
  onBook,
  flatStats,
}: {
  project: SiteProject | null;
  onClose: () => void;
  onEnquire: (projectName: string) => void;
  onBook: (projectSlug: string) => void;
  flatStats?: Record<string, { total: number; sold: number; available: number; locked: number }>;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [brochureLoading, setBrochureLoading] = useState(false);
  const images = project?.gallery?.length ? project.gallery : project ? [project.image] : [];
  const possession = project ? parsePossession(project.possessionDate) : null;
  const showCountdown = project?.status === "Ongoing" && possession && possession.getTime() > Date.now();

  const handleBrochure = () => {
    if (!project) return;
    setBrochureLoading(true);
    const msg = encodeURIComponent(`Hello! Please share the brochure and price list for ${project.name} (Sai Green Woods).`);
    window.open(`https://wa.me/${SITE.whatsapp}?text=${msg}`, "_blank", "noopener,noreferrer");
    setTimeout(() => setBrochureLoading(false), 1500);
  };

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden bg-cream p-0 rounded-3xl border-gold/30 gap-0 flex flex-col">
        {project && (
          <>
            <div className="relative bg-forest-deep">
              <img
                src={images[activeImg] ?? project.image}
                alt={`${project.name} gallery`}
                className="h-56 sm:h-72 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="mb-2">
                    <StatusBadge status={project.status} />
                  </div>
                  <DialogTitle className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {project.name}
                  </DialogTitle>
                  <DialogDescription className="text-sage/85 text-sm mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    {project.location}
                  </DialogDescription>
                </div>
                {project.tagline && (
                  <div className="hidden sm:block rounded-xl bg-white/10 backdrop-blur border border-gold/30 px-4 py-2 text-gold text-sm font-medium">
                    {project.tagline}
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-[-26px] right-5 flex gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img + i}
                      onClick={() => setActiveImg(i)}
                      aria-label={`View image ${i + 1}`}
                      className={cn(
                        "h-14 w-20 rounded-lg overflow-hidden border-2 transition-all",
                        activeImg === i ? "border-gold scale-105" : "border-white/40 opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 overflow-y-auto scroll-area-thin">
              <div className="p-5 sm:p-7 grid lg:grid-cols-[1.25fr_1fr] gap-7">
                {/* Left: description + highlights */}
                <div>
                  <h3 className="font-display text-lg font-bold text-forest">About the Project</h3>
                  <p className="mt-2 text-sm text-moss leading-relaxed">{project.description}</p>

                  <h3 className="font-display text-lg font-bold text-forest mt-6">Project Highlights</h3>
                  <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-2.5">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-[13px] text-forest/90">
                        <FileCheck2 className="h-4 w-4 text-leaf shrink-0 mt-0.5" aria-hidden="true" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {project.amenities.length > 0 && (
                    <>
                      <h3 className="font-display text-lg font-bold text-forest mt-6">Amenities</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.amenities.map((a) => (
                          <Badge key={a} variant="secondary" className="bg-sage text-forest font-medium rounded-full px-3">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: spec card */}
                <div className="space-y-5">
                  <div className="rounded-2xl bg-white border border-border shadow-sm p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs uppercase tracking-wider text-moss font-semibold">Starting From</span>
                    </div>
                    <div className="font-display text-2xl font-bold text-pine mt-1">{project.price}</div>

                    <dl className="mt-4 space-y-2.5 text-sm">
                      {[
                        ["Land Area", project.landArea],
                        ["Configuration", project.unitSizes],
                        ["Total Units", project.totalUnits],
                        ["Possession", project.possessionDate],
                      ]
                        .filter(([, v]) => !!v)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
                            <dt className="text-moss">{k}</dt>
                            <dd className="font-semibold text-forest text-right">{v}</dd>
                          </div>
                        ))}
                    </dl>

                    <div className="mt-4 rounded-xl bg-sage px-3.5 py-2.5 text-xs">
                      <span className="text-moss font-semibold uppercase tracking-wide">MahaRERA</span>
                      <div className="text-forest font-bold text-sm mt-0.5">{project.reraNumber}</div>
                    </div>
                  </div>

                  {showCountdown && possession && (
                    <div className="rounded-2xl bg-forest p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold text-center mb-3">
                        Time Left for Possession
                      </div>
                      <Countdown target={possession} />
                    </div>
                  )}

                  {/* Live availability snapshot + booking CTA */}
                  {flatStats?.[project.slug] && flatStats[project.slug].total > 0 && (
                    <div className="rounded-2xl bg-gold-light/40 border border-gold-deep/40 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gold-deep">Live Availability</span>
                        <span className="text-[11px] font-bold text-forest bg-white rounded-full px-2.5 py-0.5 border border-gold-deep/30">
                          {flatStats[project.slug].available > 0
                            ? `${flatStats[project.slug].available} ${UNIT_NOUN[project.type] ?? "units"} open`
                            : "Sold Out"}
                        </span>
                      </div>
                      <Button
                        onClick={() => onBook(project.slug)}
                        className="mt-3.5 w-full h-11 bg-gold hover:bg-gold-deep text-forest font-bold rounded-xl"
                      >
                        <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                        Check Availability &amp; Book Online
                      </Button>
                      <p className="mt-2 text-[11px] text-moss leading-snug">
                        Interactive 2D/3D layout · hold any unit for 10 minutes · instant confirmation
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2.5">
                    <Button onClick={() => onEnquire(project.name)} className="h-11 bg-pine hover:bg-leaf text-white font-bold rounded-xl">
                      Enquire Now
                    </Button>
                    <Button onClick={handleBrochure} variant="outline" className="h-11 border-pine/40 text-pine hover:bg-sage rounded-xl font-semibold">
                      {brochureLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download Brochure
                    </Button>
                    <Button asChild variant="outline" className="h-11 border-brick/40 text-brick hover:bg-brick/10 rounded-xl font-semibold">
                      <a href={`tel:${SITE.phoneRaw}`}>
                        <Phone className="h-4 w-4" />
                        Call {SITE.phone}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
