"use client";

import { useEffect, useState } from "react";
import { Menu, Phone } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE } from "@/lib/site";
import { Logo } from "./logo";
import { useEnquiry, useSiteNav } from "./site-context";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openEnquiry } = useEnquiry();
  const { route, navigate } = useSiteNav();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 border-b",
        scrolled
          ? "glass-card border-gold/25 shadow-[0_10px_36px_-18px_rgba(7,42,31,0.35)]"
          : "bg-cream/85 backdrop-blur-sm border-transparent"
      )}
    >
      {/* Gold hairline under the header — a signature royal detail */}
      <div className={cn("gold-hairline transition-opacity duration-500", scrolled ? "opacity-100" : "opacity-0")} aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn("flex items-center justify-between gap-4 transition-all duration-500", scrolled ? "h-16" : "h-[76px]")}>
          <Logo />

          {/* Desktop view navigation */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = route === link.route;
              return (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => navigate(link.route)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300",
                    active
                      ? "text-forest bg-sage"
                      : "text-forest/75 hover:text-pine hover:bg-sage/60"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-300",
                      active ? "w-8 opacity-100" : "w-0 opacity-0"
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${SITE.phoneRaw}`}
              className="hidden xl:flex items-center gap-2 text-sm font-semibold text-forest hover:text-pine transition-colors"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage">
                <Phone className="h-4 w-4 text-pine" aria-hidden="true" />
              </span>
              {SITE.phone}
            </a>
            <Button
              onClick={() => openEnquiry()}
              className="hidden sm:inline-flex bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep hover:to-gold-deep text-forest font-bold rounded-full px-6 shadow-gold border border-gold-light/40"
            >
              Enquire Now
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden rounded-full border-pine/30" aria-label="Open menu">
                  <Menu className="h-5 w-5 text-forest" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-cream p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <SheetTitle asChild>
                      <div>
                        <Logo />
                      </div>
                    </SheetTitle>
                  </div>
                  <nav className="flex flex-col gap-1 px-4 py-5" aria-label="Mobile navigation">
                    {NAV_LINKS.map((link) => {
                      const active = route === link.route;
                      return (
                        <button
                          key={link.route}
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            navigate(link.route);
                          }}
                          className={cn(
                            "px-4 py-3 text-base font-semibold rounded-xl text-left transition-colors",
                            active ? "bg-sage text-forest border border-gold/30" : "text-forest hover:bg-sage"
                          )}
                        >
                          {link.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="mt-auto p-5 space-y-3 border-t border-border">
                    <Button
                      onClick={() => {
                        setMobileOpen(false);
                        openEnquiry();
                      }}
                      className="w-full bg-gradient-to-b from-gold to-gold-deep hover:from-gold-deep text-forest font-bold rounded-full"
                    >
                      Enquire Now
                    </Button>
                    <a href={`tel:${SITE.phoneRaw}`} className="flex items-center justify-center gap-2 text-sm font-semibold text-forest py-2">
                      <Phone className="h-4 w-4 text-pine" aria-hidden="true" />
                      {SITE.phone}
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
