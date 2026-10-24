"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Lock, LockOpen, CheckCircle2, Timer, XCircle, Home, TrendingUp,
  Loader2, ShieldCheck, MousePointerClick, IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Tower3D, type FloorGroup } from "./tower-3d";
import { PaymentDialog } from "./payment-dialog";
import {
  getBookingSession, formatLakhs, LOCK_TTL_MINUTES,
  type BookingUnit, type UnitsResponse,
} from "@/lib/booking-shared";
import type { SiteProject } from "@/lib/types";
import { cn } from "@/lib/utils";

const UNIT_NOUN: Record<string, string> = {
  Plots: "plots",
  Villas: "villas",
  Apartments: "flats",
  Commercial: "units",
};

export function BookingSection({ projects, preselectSlug }: { projects: SiteProject[]; preselectSlug?: string | null }) {
  const { toast } = useToast();
  const [session, setSession] = useState<string>("");
  const [slug, setSlug] = useState<string>(projects[0]?.slug ?? "");
  const [tower, setTower] = useState<string>("");
  const [floor, setFloor] = useState<number | null>(null);
  const [units, setUnits] = useState<BookingUnit[]>([]);
  const [stats, setStats] = useState<UnitsResponse["stats"]>({ total: 0, available: 0, locked: 0, sold: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<BookingUnit | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(500);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const sessionRef = useRef("");

  // session bootstrap (client only)
  useEffect(() => {
    const s = getBookingSession();
    sessionRef.current = s;
    setSession(s);
  }, []);

  // payment settings (advance amount + provider) — fetched once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data: { success?: boolean; advanceAmount?: number; razorpayConfigured?: boolean } =
          await res.json();
        if (!res.ok || !data.success) return;
        if (!cancelled) {
          setAdvanceAmount(typeof data.advanceAmount === "number" ? data.advanceAmount : 500);
          setRazorpayConfigured(!!data.razorpayConfigured);
        }
      } catch {
        // defaults (₹500 / demo) are harmless while offline
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // preselect from project dialog CTA
  useEffect(() => {
    if (preselectSlug) {
      setSlug(preselectSlug);
      setTower("");
      setFloor(null);
      setSelectedUnit(null);
    }
  }, [preselectSlug]);

  // ticking clock for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchUnits = useCallback(async (slugToLoad: string, opts?: { silent?: boolean }) => {
    if (!slugToLoad) return;
    // silent = background poll: keep the 3D view & grid mounted (no skeleton flash,
    // no mode/rotation reset); only the initial/project-change fetch shows loading state
    if (!opts?.silent) setLoading(true);
    try {
      const qs = sessionRef.current ? `?session=${encodeURIComponent(sessionRef.current)}` : "";
      const res = await fetch(`/api/projects/${slugToLoad}/units${qs}`, { cache: "no-store" });
      const data: UnitsResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load availability");
      setUnits(data.units);
      setStats(data.stats);
      // pick default tower/floor
      setTower((t) => {
        const towers = [...new Set(data.units.map((u) => u.tower))];
        if (t && towers.includes(t)) return t;
        return towers[0] ?? "";
      });
      setFloor((f) => {
        const floorSet = [...new Set(data.units.map((u) => u.floor))];
        if (f !== null && floorSet.includes(f)) return f;
        return floorSet[0] ?? null;
      });
    } catch (err) {
      toast({
        title: "Could not load availability",
        description: err instanceof Error ? err.message : "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUnits(slug);
  }, [slug, session, fetchUnits]);

  // keep the selected unit fresh after refetches
  useEffect(() => {
    setSelectedUnit((prev) => (prev ? units.find((u) => u.id === prev.id) ?? null : null));
  }, [units]);

  // live polling — keep availability honest for everyone (silent, no UI flash)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchUnits(slug, { silent: true });
    }, 12000);
    return () => clearInterval(id);
  }, [slug, fetchUnits]);

  const towers = useMemo(() => [...new Set(units.map((u) => u.tower))], [units]);
  const floors = useMemo(
    () =>
      [...new Set(units.filter((u) => u.tower === tower).map((u) => u.floor))]
        .sort((a, b) => a - b),
    [units, tower]
  );

  const floorGroups = useMemo<FloorGroup[]>(() => {
    const inTower = units.filter((u) => u.tower === tower);
    const map = new Map<number, FloorGroup>();
    for (const u of inTower) {
      if (!map.has(u.floor)) map.set(u.floor, { floor: u.floor, floorLabel: u.floorLabel, units: [] });
      map.get(u.floor)!.units.push(u);
    }
    return [...map.values()].sort((a, b) => a.floor - b.floor);
  }, [units, tower]);

  const floorUnits = useMemo(
    () => units.filter((u) => u.tower === tower && u.floor === floor),
    [units, tower, floor]
  );

  const soldPct = stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0;
  const noun = UNIT_NOUN[projects.find((p) => p.slug === slug)?.type ?? ""] ?? "units";
  const activeProject = projects.find((p) => p.slug === slug);

  // ── actions ─────────────────────────────────────────────────────────
  async function holdUnit(unit: BookingUnit) {
    if (!session) return;
    setActionBusy(`hold-${unit.id}`);
    try {
      const res = await fetch(`/api/units/${unit.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not hold this unit");
      toast({ title: "Unit held for you!", description: data.message });
      await fetchUnits(slug, { silent: true });
    } catch (err) {
      toast({ title: "Hold failed", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
      await fetchUnits(slug, { silent: true });
    } finally {
      setActionBusy(null);
    }
  }

  async function releaseUnit(unit: BookingUnit) {
    if (!session) return;
    setActionBusy(`release-${unit.id}`);
    try {
      const res = await fetch(`/api/units/${unit.id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not release");
      toast({ title: "Hold released", description: data.message });
      await fetchUnits(slug, { silent: true });
    } catch (err) {
      toast({ title: "Release failed", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
      await fetchUnits(slug, { silent: true });
    } finally {
      setActionBusy(null);
    }
  }

  // advance payment completed — refresh so the unit shows as SOLD
  async function handlePaymentSuccess() {
    setPaymentOpen(false);
    toast({
      title: "Unit booked — congratulations!",
      description: "Your advance payment is received. Our team will call you within 24 hours.",
    });
    await fetchUnits(slug, { silent: true });
  }

  function msLeft(unit: BookingUnit): number {
    if (!unit.lockedUntil) return 0;
    return Math.max(0, new Date(unit.lockedUntil).getTime() - now);
  }

  function fmtCountdown(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <section id="booking" className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Live Availability & Booking"
          title="Pick Your Unit — Sold vs Available"
          subtitle="Explore every tower in interactive 3D & 2D layouts. Hold a unit for 10 minutes, book it online, and never worry about double-booking — availability updates in real time."
        />

        {/* Project selector */}
        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-wrap justify-center gap-2.5">
            {projects.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setSlug(p.slug);
                  setTower("");
                  setFloor(null);
                  setSelectedUnit(null);
                }}
                className={cn(
                  "rounded-full px-4 sm:px-5 py-2.5 text-sm font-semibold border-2 transition-all",
                  slug === p.slug
                    ? "bg-pine text-white border-pine shadow-[0_10px_24px_-12px_rgba(28,91,63,0.7)]"
                    : "bg-white text-forest border-border hover:border-pine/50"
                )}
                aria-pressed={slug === p.slug}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Stats bar */}
        <Reveal delay={0.15} className="mt-8">
          <div className="rounded-3xl bg-forest relative overflow-hidden pattern-dots">
            <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/95 to-pine/90" aria-hidden="true" />
            {loading ? (
              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 bg-white/10 rounded-xl" />)}
              </div>
            ) : (
              <div className="relative p-5 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: `Total ${noun}`, value: stats.total, icon: Building2, color: "text-sage" },
                    { label: "Available", value: stats.available, icon: Home, color: "text-gold" },
                    { label: "Held by Buyers", value: stats.locked, icon: Lock, color: "text-gold" },
                    { label: "Sold Out", value: stats.sold, icon: TrendingUp, color: "text-sage" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/8 border border-white/12 px-4 py-3.5 text-center">
                      <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} aria-hidden="true" />
                      <div className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">{s.value}</div>
                      <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-sage/70 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-gold whitespace-nowrap">{soldPct}% SOLD</span>
                  <Progress value={soldPct} className="h-2.5 bg-white/12 [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-gold-light rounded-full" />
                  <span className="text-[11px] text-sage/70 whitespace-nowrap hidden sm:block">
                    {stats.available} of {stats.total} {noun} still open
                  </span>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* Tower selector */}
        {!loading && towers.length > 1 && (
          <Reveal delay={0.05} className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-moss">Layout:</span>
            {towers.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTower(t);
                  const f = [...new Set(units.filter((u) => u.tower === t).map((u) => u.floor))].sort((a, b) => a - b);
                  setFloor(f[0] ?? null);
                  setSelectedUnit(null);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border transition-all",
                  tower === t ? "bg-gold text-forest border-gold-deep" : "bg-white text-forest border-border hover:border-gold/60"
                )}
                aria-pressed={tower === t}
              >
                {t}
              </button>
            ))}
          </Reveal>
        )}

        {/* Main interactive area */}
        <div className="mt-6 grid lg:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
          {/* 3D / 2D tower */}
          <Reveal className="min-w-0">
            {loading ? (
              <Skeleton className="h-[500px] rounded-3xl" />
            ) : floorGroups.length > 0 ? (
              <Tower3D
                floors={floorGroups}
                towerName={`${tower} — ${activeProject?.name ?? ""}`}
                selectedUnitId={selectedUnit?.id ?? null}
                selectedFloor={floor}
                onSelectUnit={(u) => {
                  setSelectedUnit(u);
                  setFloor(u.floor);
                }}
                onSelectFloor={(f) => setFloor(f)}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center text-moss bg-white">
                No units listed for this project yet.
              </div>
            )}
          </Reveal>

          {/* Floor plan grid + selected unit panel */}
          <Reveal delay={0.1} className="min-w-0">
            <div className="space-y-5">
              {/* Floor chips */}
              {!loading && floors.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {floors.map((f) => {
                    const label = floorGroups.find((g) => g.floor === f)?.floorLabel ?? String(f);
                    const fUnits = units.filter((u) => u.tower === tower && u.floor === f);
                    const avail = fUnits.filter((u) => u.status === "AVAILABLE").length;
                    return (
                      <button
                        key={f}
                        onClick={() => {
                          setFloor(f);
                          setSelectedUnit(null);
                        }}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-bold border-2 transition-all",
                          floor === f ? "bg-forest text-gold border-forest" : "bg-white text-forest border-border hover:border-pine/50"
                        )}
                        aria-pressed={floor === f}
                      >
                        {label === "0" ? "G" : label}
                        <span className="ml-1.5 text-[10px] font-semibold opacity-70">({avail})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Unit grid (2D floor plan) */}
              <div className="rounded-3xl bg-white border border-border shadow-[0_18px_44px_-26px_rgba(15,61,42,0.4)] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-sage/60 flex items-center justify-between">
                  <span className="font-semibold text-forest text-sm">
                    {tower}
                    {floor !== null && (
                      <>
                        {" · "}
                        {floorGroups.find((g) => g.floor === floor)?.floorLabel === "0"
                          ? "Ground Floor"
                          : `Floor ${floorGroups.find((g) => g.floor === floor)?.floorLabel ?? floor}`}
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-moss">
                    <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                    Click a unit to book
                  </span>
                </div>
                {loading ? (
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[380px] overflow-y-auto scroll-area-thin">
                    {floorUnits.map((u) => (
                      <UnitCard
                        key={u.id}
                        unit={u}
                        selected={selectedUnit?.id === u.id}
                        onClick={() => setSelectedUnit(u)}
                      />
                    ))}
                    {floorUnits.length === 0 && (
                      <p className="col-span-full text-center text-moss py-6 text-sm">No units on this level.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected unit panel */}
              {selectedUnit && (
                <SelectedUnitPanel
                  unit={selectedUnit}
                  now={now}
                  busy={actionBusy}
                  advanceAmount={advanceAmount}
                  onHold={() => holdUnit(selectedUnit)}
                  onRelease={() => releaseUnit(selectedUnit)}
                  onPay={() => setPaymentOpen(true)}
                />
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Advance-payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        unit={selectedUnit}
        session={session}
        settings={{ advanceAmount, razorpayConfigured }}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </section>
  );
}

/* ── Unit card (2D grid) ─────────────────────────────────────────── */
function UnitCard({ unit, selected, onClick }: { unit: BookingUnit; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={unit.status === "SOLD"}
      className={cn(
        "relative rounded-xl border-2 p-3 text-left transition-all",
        unit.status === "AVAILABLE" && "bg-sage/50 border-pine/30 hover:border-pine hover:-translate-y-0.5 cursor-pointer",
        unit.status === "LOCKED" && unit.isMine && "bg-gold/25 border-gold-deep/60 hover:border-gold-deep cursor-pointer",
        unit.status === "LOCKED" && !unit.isMine && "bg-gold/15 border-gold-deep/40 opacity-80 cursor-not-allowed",
        unit.status === "SOLD" && "bg-stone-100 border-stone-300 cursor-not-allowed opacity-75",
        selected && "ring-2 ring-brick ring-offset-2 ring-offset-white"
      )}
      aria-pressed={selected}
      aria-label={`Unit ${unit.unitNumber}, ${unit.unitType}, ${unit.areaSqft} sq ft, ${unit.status}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-display font-bold text-base", unit.status === "SOLD" ? "text-stone-400 line-through" : "text-forest")}>
          {unit.unitNumber}
        </span>
        <StatusDot status={unit.status} isMine={unit.isMine} />
      </div>
      <div className={cn("text-[11px] font-medium mt-0.5", unit.status === "SOLD" ? "text-stone-400" : "text-moss")}>
        {unit.unitType} · {unit.areaSqft} sq.ft
      </div>
      <div className={cn("text-[13px] font-bold mt-1.5", unit.status === "SOLD" ? "text-stone-400" : "text-pine")}>
        {formatLakhs(unit.priceLakhs)}
      </div>
      {unit.status === "LOCKED" && (
        <div className={cn("text-[10px] font-bold mt-1 uppercase tracking-wide", unit.isMine ? "text-gold-deep" : "text-gold-deep/70")}>
          {unit.isMine ? "★ Your hold" : "Held by buyer"}
        </div>
      )}
    </button>
  );
}

function StatusDot({ status, isMine }: { status: BookingUnit["status"]; isMine: boolean }) {
  if (status === "SOLD") return <span className="h-2.5 w-2.5 rounded-full bg-stone-400 shrink-0" aria-label="Sold" />;
  if (status === "LOCKED") return <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", isMine ? "bg-gold" : "bg-gold/50")} aria-label="Held" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-leaf shrink-0" aria-label="Available" />;
}

/* ── Selected unit action panel ──────────────────────────────────── */
function SelectedUnitPanel({
  unit, now, busy, advanceAmount, onHold, onRelease, onPay,
}: {
  unit: BookingUnit;
  now: number;
  busy: string | null;
  advanceAmount: number;
  onHold: () => void;
  onRelease: () => void;
  onPay: () => void;
}) {
  const left = unit.lockedUntil ? Math.max(0, new Date(unit.lockedUntil).getTime() - now) : 0;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);

  return (
    <div className={cn(
      "rounded-3xl border-2 p-5 sm:p-6 shadow-[0_18px_44px_-26px_rgba(15,61,42,0.4)]",
      unit.status === "SOLD" && "bg-stone-100 border-stone-300",
      unit.status === "LOCKED" && "bg-gold-light/50 border-gold-deep/50",
      unit.status === "AVAILABLE" && "bg-white border-pine/40"
    )}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-bold text-forest">{unit.unitNumber}</span>
            <Badge className={cn(
              "rounded-full font-bold",
              unit.status === "AVAILABLE" && "bg-leaf text-white",
              unit.status === "LOCKED" && (unit.isMine ? "bg-gold text-forest" : "bg-gold/60 text-forest/70"),
              unit.status === "SOLD" && "bg-stone-400 text-white"
            )}>
              {unit.status === "AVAILABLE" ? "Available" : unit.status === "SOLD" ? "Sold Out" : unit.isMine ? "Your Hold" : "Held by Buyer"}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-moss">Type</span><span className="font-semibold text-forest">{unit.unitType}</span>
            <span className="text-moss">Area</span><span className="font-semibold text-forest">{unit.areaSqft.toLocaleString("en-IN")} sq.ft</span>
            <span className="text-moss">Price</span><span className="font-semibold text-pine">{formatLakhs(unit.priceLakhs)}</span>
            <span className="text-moss">Facing</span><span className="font-semibold text-forest">{unit.facing ?? "—"}</span>
          </div>
        </div>

        {/* Countdown */}
        {unit.status === "LOCKED" && unit.isMine && (
          <div className="text-center rounded-2xl bg-forest text-cream px-5 py-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gold font-bold">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              Hold expires in
            </div>
            <div className="font-display text-3xl font-bold text-gold tabular-nums mt-0.5">
              {m}:{String(s).padStart(2, "0")}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {unit.status === "AVAILABLE" && (
          <>
            <Button
              onClick={onHold}
              disabled={busy === `hold-${unit.id}`}
              className="bg-gold hover:bg-gold-deep text-forest font-bold rounded-xl h-11 px-6"
            >
              {busy === `hold-${unit.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Hold for {LOCK_TTL_MINUTES} min
            </Button>
            <Button
              onClick={onPay}
              className="bg-pine hover:bg-leaf text-white font-bold rounded-xl h-11 px-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              Book Now · ₹{advanceAmount.toLocaleString("en-IN")} Advance
            </Button>
          </>
        )}

        {unit.status === "LOCKED" && unit.isMine && (
          <>
            <Button
              onClick={onPay}
              disabled={left <= 0}
              className="bg-pine hover:bg-leaf text-white font-bold rounded-xl h-11 px-6"
            >
              <CheckCircle2 className="h-4 w-4" />
              Book Now · ₹{advanceAmount.toLocaleString("en-IN")} Advance
            </Button>
            <Button
              onClick={onRelease}
              variant="outline"
              disabled={busy === `release-${unit.id}`}
              className="border-brick/40 text-brick hover:bg-brick/10 font-semibold rounded-xl h-11 px-5"
            >
              {busy === `release-${unit.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
              Release Hold
            </Button>
          </>
        )}

        {unit.status === "LOCKED" && !unit.isMine && (
          <div className="flex items-center gap-2 text-sm font-semibold text-gold-deep bg-gold/15 rounded-xl px-4 py-3">
            <Timer className="h-4 w-4 shrink-0" aria-hidden="true" />
            Another buyer is holding this unit. If their timer expires, it will open up automatically.
          </div>
        )}

        {unit.status === "SOLD" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            This unit is sold out. Explore other units above.
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-moss">
          <ShieldCheck className="h-3.5 w-3.5 text-leaf shrink-0" aria-hidden="true" />
          Server-verified availability — double-booking is impossible. Locks auto-release after {LOCK_TTL_MINUTES} minutes.
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gold-deep">
          <IndianRupee className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Book instantly with a ₹{advanceAmount.toLocaleString("en-IN")} advance payment.
        </div>
      </div>
    </div>
  );
}
