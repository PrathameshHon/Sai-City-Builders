"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamicImport from "next/dynamic";
import type { FlatStats, SiteProject, SiteTestimonial } from "@/lib/types";
import { VIEW_TITLES, type ViewRoute } from "@/lib/site";
import { SiteUIContext } from "./site-context";
import { TopBar } from "./topbar";
import { Header } from "./header";
import { Footer } from "./footer";
import { EnquiryModal } from "./enquiry-modal";
import { FloatingActions } from "./floating-actions";
import { HomeView } from "./views/home-view";
import { AboutView } from "./views/about-view";
import { ProjectsView } from "./views/projects-view";
import { GalleryView } from "./views/gallery-view";
import { ReviewsView } from "./views/reviews-view";
import { ContactView } from "./views/contact-view";

export { useEnquiry, useGoToBooking, useSiteNav } from "./site-context";

// Admin console — loaded lazily, client-only (the #/admin view renders it without site chrome)
const AdminDashboard = dynamicImport(
  () => import("@/components/admin/admin-dashboard").then((m) => m.AdminDashboard),
  { ssr: false }
);

const ROUTES: ViewRoute[] = ["home", "about", "projects", "gallery", "reviews", "contact", "admin"];

function parseHash(hash: string): ViewRoute {
  if (!hash.startsWith("#/")) return "home";
  const segment = hash.slice(2).split("?")[0].replace(/\/$/, "").toLowerCase();
  return (ROUTES as string[]).includes(segment) ? (segment as ViewRoute) : "home";
}

/** Old-style plain anchors (e.g. #booking) → stay on home & scroll to the section */
function legacyAnchor(hash: string): string | null {
  if (!hash || hash.startsWith("#/")) return null;
  return hash.slice(1) || null;
}

export interface SiteShellProps {
  projects: SiteProject[];
  testimonials: SiteTestimonial[];
  flatStats?: Record<string, FlatStats>;
}

export function SiteShell({ projects, testimonials, flatStats }: SiteShellProps) {
  const [route, setRoute] = useState<ViewRoute>("home");
  const routeRef = useRef<ViewRoute>("home");
  const pendingAnchorRef = useRef<string | null>(null);

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryProject, setEnquiryProject] = useState<string | undefined>(undefined);
  const [bookingPreselect, setBookingPreselect] = useState<{ slug: string; nonce: number } | null>(null);

  const scrollToTopInstant = useCallback(() => {
    const html = document.documentElement;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      html.style.scrollBehavior = "";
    });
  }, []);

  const applyPendingAnchor = useCallback(() => {
    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (!anchor) return;
    // wait for the incoming view to mount before scrolling to its section
    window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 500);
  }, []);

  const syncFromHash = useCallback(() => {
    const hash = window.location.hash;
    const next = parseHash(hash);
    const legacy = legacyAnchor(hash);
    if (legacy) pendingAnchorRef.current = legacy;
    if (next !== routeRef.current) {
      routeRef.current = next;
      setRoute(next);
      scrollToTopInstant();
      applyPendingAnchor();
    } else if (legacy) {
      applyPendingAnchor();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [applyPendingAnchor, scrollToTopInstant]);

  // Sync route from the URL hash (initial load uses rAF to stay async-safe)
  useEffect(() => {
    const raf = requestAnimationFrame(() => syncFromHash());
    const onHashChange = () => syncFromHash();
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [syncFromHash]);

  // Keep the document title in sync with the active view
  useEffect(() => {
    document.title = VIEW_TITLES[route];
  }, [route]);

  const navigate = useCallback(
    (target: ViewRoute, opts?: { anchor?: string }) => {
      if (opts?.anchor) pendingAnchorRef.current = opts.anchor;
      const desired = `#/${target}`;
      if (window.location.hash === desired) {
        if (target === routeRef.current) {
          if (pendingAnchorRef.current) {
            applyPendingAnchor();
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
        return;
      }
      window.location.hash = desired;
    },
    [applyPendingAnchor]
  );

  const openEnquiry = useCallback((project?: string) => {
    setEnquiryProject(project);
    setEnquiryOpen(true);
  }, []);

  const goToBooking = useCallback(
    (projectSlug?: string) => {
      if (projectSlug) {
        setBookingPreselect({ slug: projectSlug, nonce: Date.now() });
      }
      navigate("projects", { anchor: "booking" });
    },
    [navigate]
  );

  const ctxValue = { route, navigate, openEnquiry, goToBooking };

  return (
    <SiteUIContext.Provider value={ctxValue}>
      <div className="min-h-screen flex flex-col bg-cream">
        {route !== "admin" && (
          <>
            <TopBar />
            <Header />
          </>
        )}
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {route === "home" && (
                <HomeView projects={projects} testimonials={testimonials} flatStats={flatStats} />
              )}
              {route === "about" && <AboutView />}
              {route === "projects" && (
                <ProjectsView
                  projects={projects}
                  flatStats={flatStats}
                  preselectSlug={bookingPreselect?.slug ?? null}
                />
              )}
              {route === "gallery" && <GalleryView projects={projects} />}
              {route === "reviews" && (
                <ReviewsView testimonials={testimonials} projects={projects} />
              )}
              {route === "contact" && <ContactView projects={projects} />}
              {route === "admin" && (
                <div className="min-h-screen bg-cream">
                  <AdminDashboard />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        {route !== "admin" && (
          <>
            <Footer projects={projects} />
            <EnquiryModal
              key={enquiryProject ?? "general"}
              open={enquiryOpen}
              onOpenChange={setEnquiryOpen}
              project={enquiryProject}
              projects={projects}
            />
            <FloatingActions />
          </>
        )}
      </div>
    </SiteUIContext.Provider>
  );
}
