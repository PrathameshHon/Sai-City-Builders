"use client";

/**
 * FROZEN CONTRACT — named export `AdminDashboard`, no props.
 * Imported dynamically (ssr: false) from site-shell for the #/admin route.
 *
 * Shell responsibilities: session gate (login card), royal sidebar /
 * mobile tab bar, stats badge counts, and tab switching between the
 * admin sections (each section owns its own data fetching).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Home,
  Star,
  Images,
  Image as ImageIcon,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Globe,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ADMIN_401_EVENT,
  api,
  toastApiError,
  type AdminStats,
  type AdminTab,
} from "./admin-shared";
import { OverviewSection } from "./admin-overview";
import { ProjectsSection } from "./admin-projects";
import { FlatsSection } from "./admin-flats";
import { ReviewsSection } from "./admin-reviews";
import { AlbumsSection } from "./admin-albums";
import { GallerySection } from "./admin-gallery";
import { EnquiriesSection } from "./admin-enquiries";
import { SettingsSection } from "./admin-settings";

const TAB_META: Record<
  AdminTab,
  { label: string; short: string; title: string; description: string; icon: typeof LayoutDashboard }
> = {
  overview: {
    label: "Overview",
    short: "Overview",
    title: "Overview",
    description: "A live pulse of the township — inventory, leads and advance collections.",
    icon: LayoutDashboard,
  },
  projects: {
    label: "Projects",
    short: "Projects",
    title: "Projects",
    description: "Curate the portfolio shown on the public site.",
    icon: Building2,
  },
  units: {
    label: "Units & Bookings",
    short: "Units",
    title: "Units & Bookings",
    description: "Inventory control and the advance-payment ledger.",
    icon: Home,
  },
  reviews: {
    label: "Reviews",
    short: "Reviews",
    title: "Reviews",
    description: "Moderate visitor reviews before they appear on the public site.",
    icon: Star,
  },
  albums: {
    label: "Albums",
    short: "Albums",
    title: "Transformation Albums",
    description: "Approve homeowner photo stories grouped by project and flat.",
    icon: Images,
  },
  gallery: {
    label: "Gallery",
    short: "Gallery",
    title: "Gallery",
    description: "Photographs shown in the public gallery view.",
    icon: ImageIcon,
  },
  enquiries: {
    label: "Enquiries",
    short: "Leads",
    title: "Enquiries",
    description: "Sales leads submitted from the public site.",
    icon: MessageSquare,
  },
  settings: {
    label: "Settings",
    short: "Settings",
    title: "Settings",
    description: "Booking advance, Razorpay keys and admin access.",
    icon: SettingsIcon,
  },
};

const TAB_ORDER: AdminTab[] = [
  "overview",
  "projects",
  "units",
  "reviews",
  "albums",
  "gallery",
  "enquiries",
  "settings",
];

/* ── Login gate ────────────────────────────────────────────────────── */

/**
 * Private admin gate — the exact admin-defined email AND password are both
 * required (verified server-side). No hints, no defaults, no other way in.
 * Wrong credentials shake the card, exactly like a PIN pad.
 */
function LoginGate({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onLogin(email.trim(), password);
      // success is handled by the parent (phase swap) — on throw we shake
    } catch {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-forest-deep pattern-dots px-4 py-10">
      <div
        className={cn(
          "w-full max-w-sm rounded-3xl border border-gold/45 bg-forest/60 p-8 shadow-royal backdrop-blur-sm transition-transform",
          shake && "animate-[shake_0.4s_ease-in-out]"
        )}
      >
        <div className="flex justify-center">
          <Logo light />
        </div>
        <div className="gold-hairline my-6" aria-hidden="true" />
        <h1 className="text-center font-display text-3xl font-bold text-cream">
          Admin <span className="text-gold">Console</span>
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.25em] text-sage/70">
          Private · Staff only
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/90">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" aria-hidden="true" />
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="h-11 border-gold/30 bg-pearl pl-9 text-forest"
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/90">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" aria-hidden="true" />
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className={cn("h-11 border-gold/30 bg-pearl pl-9 text-forest", shake && "border-red-400/70")}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="h-11 w-full bg-gold font-semibold text-forest-deep hover:bg-gold-deep hover:text-cream"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {busy ? "Unlocking…" : "Unlock Console"}
          </Button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-sage/70">
        Authorised personnel only. Credentials are set by the administrator.
      </p>
    </div>
  );
}

/* ── Shell ─────────────────────────────────────────────────────────── */

export function AdminDashboard() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  /* Mirror of phase for event listeners — updaters must stay pure (no toast inside) */
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsNonce, setStatsNonce] = useState(0);
  const [createProjectNonce, setCreateProjectNonce] = useState(0);

  /* Session check on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let authenticated = false;
      try {
        const res = await api<{ authenticated: boolean }>("/api/admin/session");
        authenticated = res.authenticated;
      } catch {
        /* network hiccup → login gate */
      }
      if (cancelled) return;
      setPhase(authenticated ? "ready" : "login");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Any admin endpoint returning 401 drops back to the login gate */
  useEffect(() => {
    const onUnauthorized = () => {
      /* Toast OUTSIDE the state updater — updaters run during render and
         must never setState another component (the Toaster) there. */
      if (phaseRef.current === "ready") {
        toast({ title: "Session expired", description: "Please sign in again." });
      }
      setPhase((current) => (current === "ready" ? "login" : current));
      setStats(null);
    };
    window.addEventListener(ADMIN_401_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_401_EVENT, onUnauthorized);
  }, []);

  /* Stats (drives overview + pending badges) */
  useEffect(() => {
    if (phase !== "ready") return;
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    (async () => {
      try {
        const res = await api<AdminStats>("/api/admin/stats");
        if (!cancelled) setStats(res);
      } catch (error) {
        if (!cancelled) {
          setStats(null);
          if (!(error instanceof Error && error.name === "ApiError" && error.message.includes("Unauthorized"))) {
            setStatsError(error instanceof Error ? error.message : "Failed to load stats");
          }
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, statsNonce]);

  const refreshStats = useCallback(() => setStatsNonce((n) => n + 1), []);

  const handleAuthenticated = useCallback(() => {
    setStats(null);
    setStatsNonce((n) => n + 1);
    setTab("overview");
    setPhase("ready");
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      handleAuthenticated();
      toast({ title: "Welcome back", description: "Admin console unlocked." });
    } catch (error) {
      toastApiError(error, "Invalid email or password");
      throw error; // re-throw so the gate shakes
    }
  }, [handleAuthenticated]);

  const handleLogout = useCallback(async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } catch {
      /* best effort */
    }
    setStats(null);
    setPhase("login");
    toast({ title: "Signed out" });
  }, []);

  const navigateToSite = useCallback(() => {
    window.location.hash = "#/home";
  }, []);

  const badges = useMemo(
    () => ({
      reviews: stats?.stats.reviews.pending ?? 0,
      albums: stats?.stats.albums.pending ?? 0,
      enquiries: stats?.stats.enquiries.new ?? 0,
    }),
    [stats]
  );

  if (phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forest-deep pattern-dots">
        <div className="flex flex-col items-center gap-3 text-sage">
          <Loader2 className="size-7 animate-spin text-gold" />
          <p className="text-xs uppercase tracking-[0.3em]">Checking session…</p>
        </div>
      </div>
    );
  }

  if (phase === "login") {
    return <LoginGate onLogin={handleLogin} />;
  }

  const meta = TAB_META[tab];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Mobile tab bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-forest-deep shadow-royal">
        <nav
          className="flex gap-1 overflow-x-auto scroll-area-thin px-3 py-2.5"
          aria-label="Admin sections"
        >
          {TAB_ORDER.map((id) => {
            const item = TAB_META[id];
            const Icon = item.icon;
            const badge = id === "reviews" ? badges.reviews : id === "albums" ? badges.albums : id === "enquiries" ? badges.enquiries : 0;
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active ? "bg-gold text-forest-deep" : "text-sage/80 hover:bg-white/10 hover:text-cream"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-3.5" />
                {item.short}
                {badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold",
                      active ? "bg-forest-deep text-gold-light" : "bg-gold text-forest-deep"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 min-w-0">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-forest-deep text-sage">
          <div className="px-5 pt-6 pb-4">
            <Logo light />
          </div>
          <div className="gold-hairline mx-5" aria-hidden="true" />
          <nav className="flex-1 overflow-y-auto scroll-area-thin px-2 py-4 space-y-1" aria-label="Admin sections">
            {TAB_ORDER.map((id) => {
              const item = TAB_META[id];
              const Icon = item.icon;
              const badge = id === "reviews" ? badges.reviews : id === "albums" ? badges.albums : id === "enquiries" ? badges.enquiries : 0;
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-gold bg-white/10 text-gold"
                      : "border-transparent text-sage/80 hover:bg-white/5 hover:text-cream"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-forest-deep">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4 space-y-2">
            <button
              type="button"
              onClick={navigateToSite}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sage/80 transition-colors hover:bg-white/5 hover:text-cream"
            >
              <Globe className="size-4" /> View Site
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gold/80 transition-colors hover:bg-gold/10 hover:text-gold-light"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-forest">{meta.title}</h1>
                <p className="mt-1 text-sm text-moss">{meta.description}</p>
              </div>
              <p className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-gold-deep/70">
                Sai Green Woods · Admin
              </p>
            </div>
            <div className="gold-hairline mt-4" aria-hidden="true" />
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-10">
            {tab === "overview" && (
              <OverviewSection
                stats={stats}
                loading={statsLoading}
                error={statsError}
                onNavigate={setTab}
                onAddProject={() => {
                  setCreateProjectNonce((n) => n + 1);
                  setTab("projects");
                }}
              />
            )}
            {tab === "projects" && (
              <ProjectsSection onDataChanged={refreshStats} createSignal={createProjectNonce} />
            )}
            {tab === "units" && <FlatsSection onDataChanged={refreshStats} />}
            {tab === "reviews" && <ReviewsSection onDataChanged={refreshStats} />}
            {tab === "albums" && <AlbumsSection onDataChanged={refreshStats} />}
            {tab === "gallery" && <GallerySection onDataChanged={refreshStats} />}
            {tab === "enquiries" && <EnquiriesSection onDataChanged={refreshStats} />}
            {tab === "settings" && <SettingsSection onDataChanged={refreshStats} />}
          </main>

          {/* Bottom mini-bar (sticky-footer rule) */}
          <footer className="mt-auto border-t border-sand bg-pearl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-moss">Sai Green Woods · Admin Console</p>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-brick hover:underline"
              >
                <LogOut className="size-3.5" /> Logout
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
