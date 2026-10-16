"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import dynamicImport from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, ChevronDown, MapPin, Star, TrendingUp, MousePointerClick,
  Sparkles, Quote, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";
import { Counter } from "../counter";
import { CtaBanner } from "../cta-banner";
import { useSiteNav } from "../site-context";
import { EXPERIENCE_RAIL, EXPERIENCE_STEPS, SITE, STATS } from "@/lib/site";
import type { FlatStats, SiteProject, SiteTestimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

const SceneCanvas = dynamicImport(() => import("../experience/scene-canvas"), { ssr: false });

/* Step section heights (vh) — tuned so text holds while the camera travels */
const STEP_HEIGHTS = [280, 210, 170, 130];

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/* ── Error boundary: if WebGL fails, degrade to a static premium hero ── */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/* ── Side progress rail (desktop) ─────────────────────────────────── */
const RAIL_TARGETS = ["exp-hero", "exp-step-0", "exp-step-1", "exp-step-2", "exp-step-3", "exp-final"];

function ExperienceRail({ wrapRef }: { wrapRef: RefObject<HTMLDivElement | null> }) {
  const [state, setState] = useState({ visible: false, active: 0 });
  const stateRef = useRef({ visible: false, active: 0 });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = wrapRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const visible = rect.top <= 0 && rect.bottom >= vh;
        const total = Math.max(rect.height - vh, 1);
        const p = clamp01(-rect.top / total);
        let active = 0;
        EXPERIENCE_RAIL.forEach((item, i) => {
          if (p >= item.threshold) active = i;
        });
        if (visible !== stateRef.current.visible || active !== stateRef.current.active) {
          stateRef.current = { visible, active };
          setState({ visible, active });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [wrapRef]);

  return (
    <nav
      aria-label="Experience progress"
      className={cn(
        "fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-4 transition-all duration-500",
        state.visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {EXPERIENCE_RAIL.map((item, i) => {
        const active = state.active === i;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => document.getElementById(RAIL_TARGETS[i])?.scrollIntoView({ behavior: "smooth" })}
            className="group flex items-center justify-end gap-3"
            aria-label={`Jump to ${item.label}`}
          >
            <span
              className={cn(
                "whitespace-nowrap text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-300",
                active ? "text-gold opacity-100 translate-x-0" : "text-cream/70 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "rounded-full transition-all duration-300",
                active
                  ? "h-2.5 w-2.5 bg-gold shadow-[0_0_12px_rgba(200,168,100,0.9)]"
                  : "h-1.5 w-1.5 bg-cream/50 group-hover:bg-gold/70"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </nav>
  );
}

/* ── Overlay: hero ─────────────────────────────────────────────────── */
function ExperienceHero() {
  const { openEnquiry } = useSiteNav();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -90]);

  return (
    <section ref={ref} id="exp-hero" className="h-screen relative">
      <motion.div style={{ opacity, y }} className="sticky top-0 h-screen flex items-center justify-center px-4 sm:px-8 pointer-events-none">
        <div className="w-full max-w-2xl text-center -translate-y-12">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-caption rounded-[2rem] px-6 py-8 sm:px-12 sm:py-10 pointer-events-auto"
          >
            <p className="overline-royal text-gold flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
              {SITE.name} Presents · Kopargaon
              <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
            </p>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl font-bold text-cream leading-[1.05]">
              Sai <span className="italic text-gold-light">Green Woods</span>
            </h1>
            <p className="mt-4 text-sage/85 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              A royal green address where emerald landscapes meet champagne sunsets —
              60 acres of NA plots, villas and garden avenues, crafted by {SITE.developer}.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => document.getElementById("exp-step-0")?.scrollIntoView({ behavior: "smooth" })}
                size="lg"
                className="bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep text-forest font-bold rounded-full px-8 h-12 shadow-gold border border-gold-light/40"
              >
                Begin the Tour
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                onClick={() => openEnquiry()}
                size="lg"
                variant="outline"
                className="border-gold/50 bg-white/5 text-cream hover:bg-cream hover:text-forest font-semibold rounded-full px-8 h-12 backdrop-blur-sm"
              >
                Book a Site Visit
              </Button>
            </div>
            <p className="mt-5 text-[10px] tracking-[0.22em] uppercase text-sage/60 font-semibold">
              MahaRERA P52200079044 · P52200077262
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.button
        type="button"
        onClick={() => document.getElementById("exp-step-0")?.scrollIntoView({ behavior: "smooth" })}
        aria-label="Scroll to begin the tour"
        className="absolute bottom-40 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-cream/80 hover:text-gold transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <span className="text-[10px] font-semibold tracking-[0.3em] uppercase">Scroll</span>
        <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </motion.span>
      </motion.button>
    </section>
  );
}

/* ── Overlay: one cinematic step ───────────────────────────────────── */
function ExperienceStep({ step, index, heightVh }: { step: (typeof EXPERIENCE_STEPS)[number]; index: number; heightVh: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [70, 0, 0, -70]);
  const side = index % 2 === 0 ? "left" : "right";

  return (
    <section ref={ref} id={`exp-step-${index}`} className="relative pointer-events-none" style={{ height: `${heightVh}vh` }}>
      <motion.div style={{ opacity, y }} className="sticky top-0 h-screen flex items-center px-4 sm:px-10">
        <div className={cn("w-full max-w-md", side === "right" && "ml-auto")}>
          <div className="glass-caption rounded-[1.75rem] p-6 sm:p-8 pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="font-display italic text-3xl font-semibold text-gold-light/90 leading-none">{step.index}</span>
              <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
              <span className="overline-royal text-gold">{step.id.replace("-", " ")}</span>
            </div>
            <h2 className="mt-4 font-display text-2xl sm:text-[2rem] font-bold text-cream leading-snug">
              {step.title}
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] text-sage/85 leading-relaxed">{step.copy}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {step.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-gold/45 bg-gold/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-light"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Overlay: final CTA hold ───────────────────────────────────────── */
function ExperienceFinal() {
  const { navigate, openEnquiry } = useSiteNav();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.22, 0.9, 1], [0, 1, 1, 0.4]);

  return (
    <section ref={ref} id="exp-final" className="h-[130vh] relative pointer-events-none">
      <motion.div style={{ opacity }} className="sticky top-0 h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-xl text-center glass-caption rounded-[2rem] px-6 py-9 sm:px-12 sm:py-12 pointer-events-auto">
          <p className="overline-royal text-gold flex items-center justify-center gap-3">
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            The Journey Ends Where Yours Begins
          </p>
          <h2 className="mt-4 font-display text-3xl sm:text-5xl font-bold text-cream leading-tight">
            Your chapter begins <span className="italic text-gold-light">here.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-sage/85 leading-relaxed max-w-md mx-auto">
            Choose from 400+ plots, villas and homes — check live availability and book
            your favourite online in minutes.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate("projects", { anchor: "booking" })}
              size="lg"
              className="bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep text-forest font-bold rounded-full px-8 h-12 shadow-gold border border-gold-light/40"
            >
              Choose Your Home
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => openEnquiry()}
              size="lg"
              variant="outline"
              className="border-gold/50 bg-white/5 text-cream hover:bg-cream hover:text-forest font-semibold rounded-full px-8 h-12 backdrop-blur-sm"
            >
              Book a Site Visit
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Reduced-motion / no-WebGL fallback hero ───────────────────────── */
function FallbackHero() {
  const { openEnquiry } = useSiteNav();
  return (
    <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
      <img
        src="/images/hero.png"
        alt="Sai Green Woods township aerial view"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 hero-overlay" aria-hidden="true" />
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="glass-caption rounded-[2rem] max-w-2xl px-6 py-9 sm:px-12 text-center">
          <p className="overline-royal text-gold">{SITE.name} Presents · Kopargaon</p>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-bold text-cream leading-[1.05]">
            Sai <span className="italic text-gold-light">Green Woods</span>
          </h1>
          <p className="mt-4 text-sage/85 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            A royal green address — 60 acres of NA plots, villas and garden avenues by {SITE.developer}.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={() => openEnquiry()}
              size="lg"
              className="bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep text-forest font-bold rounded-full px-8 h-12 shadow-gold"
            >
              Book a Site Visit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Teasers after the 3D experience ───────────────────────────────── */
function LiveBookingBand({ flatStats }: { flatStats?: Record<string, FlatStats> }) {
  const { navigate } = useSiteNav();
  const totals = useMemo(() => {
    let total = 0, sold = 0, available = 0, locked = 0;
    Object.values(flatStats ?? {}).forEach((s) => {
      total += s.total; sold += s.sold; available += s.available; locked += s.locked;
    });
    return { total, sold, available, locked };
  }, [flatStats]);
  const claimed = totals.sold + totals.locked;
  const pct = totals.total ? Math.round((claimed / totals.total) * 100) : 0;

  return (
    <section className="relative bg-cream canvas-overlap -mt-[1px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Reveal>
          <div className="relative royal-panel rounded-[2.5rem] overflow-hidden px-6 py-10 sm:px-12 sm:py-12">
            <div className="absolute inset-0 pattern-dots opacity-40" aria-hidden="true" />
            <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />

            <div className="relative grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
              <div>
                <p className="overline-royal text-gold">Live Inventory · Updates in Real Time</p>
                <h2 className="mt-3 font-display text-2xl sm:text-4xl font-bold text-cream leading-tight">
                  {claimed.toLocaleString("en-IN")} of {totals.total.toLocaleString("en-IN")} homes already claimed
                </h2>
                <p className="mt-3 text-sm sm:text-base text-sage/80 leading-relaxed max-w-lg">
                  Pick your exact plot, villa or flat from the interactive tower layout — hold it
                  for 10 minutes, then confirm instantly. No queues, no double bookings.
                </p>
                <div className="mt-6 max-w-md">
                  <div className="flex justify-between text-xs font-bold text-sage/70">
                    <span>{pct}% claimed</span>
                    <span className="text-gold">{totals.available.toLocaleString("en-IN")} still available</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-forest-deep/60 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-light transition-all duration-700"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => navigate("projects", { anchor: "booking" })}
                  size="lg"
                  className="mt-7 bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep text-forest font-bold rounded-full px-7 h-12 shadow-gold"
                >
                  <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                  Open the Booking Studio
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/8 border border-gold/25 px-5 py-6 text-center backdrop-blur-sm">
                    <div className="font-display text-3xl sm:text-4xl font-bold text-gold-light">
                      <Counter to={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="mt-1.5 text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-sage/75">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturedProjects({ projects, flatStats }: { projects: SiteProject[]; flatStats?: Record<string, FlatStats> }) {
  const { navigate } = useSiteNav();
  const featured = useMemo(() => {
    const list = projects.filter((p) => p.featured);
    return (list.length >= 3 ? list : [...list, ...projects.filter((p) => !p.featured)]).slice(0, 3);
  }, [projects]);

  return (
    <section className="bg-cream py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Signature Addresses"
          title="Featured Developments"
          subtitle="MahaRERA-registered communities carrying the Sai Towers promise — clear titles, green master plans and on-time possession."
        />

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((project, i) => {
            const stats = flatStats?.[project.slug];
            const pct = stats && stats.total ? Math.round((stats.sold / stats.total) * 100) : null;
            return (
              <Reveal key={project.slug} delay={i * 0.08}>
                <button
                  type="button"
                  onClick={() => navigate("projects")}
                  className="group w-full text-left rounded-3xl bg-pearl overflow-hidden shadow-royal hover:shadow-gold border border-gold/25 hover:-translate-y-1.5 transition-all duration-300"
                  aria-label={`Explore ${project.name}`}
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/75 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-gold/95 text-forest">
                      {project.status}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-forest/90 text-gold-light text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-sm">
                      {project.price}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-forest">{project.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-moss">
                      <MapPin className="h-3.5 w-3.5 text-leaf shrink-0" aria-hidden="true" />
                      {project.location}
                    </p>
                    {stats && stats.total > 0 && pct !== null && (
                      <div className="mt-4 rounded-xl bg-sage/70 border border-pine/15 px-3 py-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1.5 text-forest">
                            <TrendingUp className="h-3.5 w-3.5 text-leaf" aria-hidden="true" />
                            {stats.sold} of {stats.total} sold
                          </span>
                          <span className="text-gold-deep">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-white overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-leaf to-pine"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pine group-hover:text-gold-deep transition-colors">
                      Explore &amp; Book
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialPreview({ testimonials }: { testimonials: SiteTestimonial[] }) {
  const { navigate } = useSiteNav();
  const quotes = testimonials.slice(0, 3);
  if (quotes.length === 0) return null;

  return (
    <section className="bg-sand/60 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Word of Mouth"
          title="Families Who Already Call It Home"
        />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {quotes.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <figure className="h-full rounded-3xl bg-pearl border border-gold/25 p-6 shadow-royal flex flex-col">
                <Quote className="h-7 w-7 text-gold/70" aria-hidden="true" />
                <blockquote className="mt-3 text-sm text-forest/85 leading-relaxed flex-1">
                  &ldquo;{t.comment}&rdquo;
                </blockquote>
                <div className="mt-5 pt-4 border-t border-gold/20 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full royal-panel font-display font-bold text-gold-light">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <figcaption className="text-sm font-bold text-forest">{t.name}</figcaption>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <Star key={s} className="h-3 w-3 fill-gold text-gold" aria-hidden="true" />
                      ))}
                      <span className="ml-1 text-[11px] text-moss font-semibold">{t.role}</span>
                    </div>
                  </div>
                </div>
              </figure>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="mt-10 text-center">
          <Button
            onClick={() => navigate("reviews")}
            variant="outline"
            size="lg"
            className="rounded-full border-gold-deep/50 text-gold-deep hover:bg-gold/15 font-bold px-8 h-11"
          >
            Read All Reviews
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Home view ─────────────────────────────────────────────────────── */
interface HomeViewProps {
  projects: SiteProject[];
  testimonials: SiteTestimonial[];
  flatStats?: Record<string, FlatStats>;
}

export function HomeView({ projects, testimonials, flatStats }: HomeViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const raf = requestAnimationFrame(() => setReduced(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <>
      {reduced ? (
        <FallbackHero />
      ) : (
        <div ref={wrapRef} className="relative bg-[#F2E9D8]">
          {/* Sticky 3D canvas — the camera flies through as you scroll */}
          <div className="sticky top-0 h-screen w-full overflow-hidden grain">
            <SceneBoundary>
              <SceneCanvas wrapRef={wrapRef} />
            </SceneBoundary>
            <div className="absolute inset-0 vignette pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-forest-deep/35 to-transparent pointer-events-none" aria-hidden="true" />
          </div>

          {/* Scroll-linked overlay journey — pulled up over the canvas */}
          <div className="relative z-10 -mt-[100vh]">
            <ExperienceHero />
            {EXPERIENCE_STEPS.map((step, i) => (
              <ExperienceStep key={step.id} step={step} index={i} heightVh={STEP_HEIGHTS[i]} />
            ))}
            <ExperienceFinal />
          </div>

          <ExperienceRail wrapRef={wrapRef} />
        </div>
      )}

      {/* Premium flow continues over the canvas */}
      <LiveBookingBand flatStats={flatStats} />
      <FeaturedProjects projects={projects} flatStats={flatStats} />
      <TestimonialPreview testimonials={testimonials} />
      <CtaBanner />
    </>
  );
}
