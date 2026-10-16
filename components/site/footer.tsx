"use client";

import { useState } from "react";
import { Facebook, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, ArrowRight, Loader2, ExternalLink, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { NAV_LINKS, SITE } from "@/lib/site";
import type { SiteProject } from "@/lib/types";
import { Logo } from "./logo";
import { useEnquiry, useSiteNav } from "./site-context";

const SOCIALS = [
  { label: "Facebook", icon: Facebook, href: "https://facebook.com/SAICITY" },
  { label: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { label: "YouTube", icon: Youtube, href: "https://youtube.com" },
  { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
];

export function Footer({ projects }: { projects: SiteProject[] }) {
  const { toast } = useToast();
  const { openEnquiry } = useEnquiry();
  const { navigate } = useSiteNav();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast({
        title: data.alreadySubscribed ? "Already subscribed!" : "Subscribed successfully!",
        description: "You'll now receive updates on new phases & pre-launch offers.",
      });
      setEmail("");
    } catch (err) {
      toast({
        title: "Could not subscribe",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <footer className="bg-forest-deep text-sage/85 relative overflow-hidden">
      <div className="absolute inset-0 pattern-dots opacity-30" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          {/* Brand */}
          <div>
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-sage/70 max-w-sm">
              Building dream homes rooted in nature. Premium NA plots, villas &amp; apartments
              across 60+ green acres in Kopargaon — by Sai Towers &amp; Developers.
            </p>
            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${s.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 border border-white/15 text-sage hover:bg-gold hover:text-forest hover:border-gold transition-all"
                >
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer quick links">
            <h3 className="text-white font-display font-semibold text-lg">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.route}>
                  <button
                    type="button"
                    onClick={() => navigate(link.route)}
                    className="text-sm text-sage/70 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate("projects", { anchor: "booking" })}
                  className="text-sm text-sage/70 hover:text-gold transition-colors"
                >
                  Book a Flat
                </button>
              </li>
            </ul>
          </nav>

          {/* Projects */}
          <nav aria-label="Footer projects">
            <h3 className="text-white font-display font-semibold text-lg">Our Projects</h3>
            <ul className="mt-4 space-y-2.5">
              {projects.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => navigate("projects")}
                    className="text-sm text-sage/70 hover:text-gold transition-colors text-left"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact + newsletter */}
          <div>
            <h3 className="text-white font-display font-semibold text-lg">Stay Updated</h3>
            <p className="mt-2 text-sm text-sage/70">Get pre-launch offers &amp; new phase updates.</p>
            <form onSubmit={handleSubscribe} className="mt-4 flex gap-2" aria-label="Newsletter subscribe">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="h-11 rounded-xl bg-white/10 border-white/15 text-white placeholder:text-sage/40 focus-visible:ring-gold"
              />
              <Button
                type="submit"
                disabled={subscribing}
                className="h-11 w-11 shrink-0 rounded-xl bg-gold hover:bg-gold-deep text-forest p-0"
                aria-label="Subscribe"
              >
                {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`tel:${SITE.phoneRaw}`} className="hover:text-gold transition-colors">{SITE.phone}</a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="hover:text-gold transition-colors break-all">{SITE.email}</a>
              </li>
              <li className="flex gap-2.5">
                <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sage/70">{SITE.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RERA strip */}
        <div className="mt-12 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs leading-relaxed text-sage/60">
            <span className="text-gold font-semibold">MahaRERA Disclaimer:</span> Our projects are registered
            under MahaRERA — Reg. No. {SITE.reraNumbers.join(" & ")}. All plans, images, amenities &amp; specifications
            are indicative. Please refer to the official website for details.
          </p>
          <a
            href={SITE.reraWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-light transition-colors"
          >
            maharera.maharashtra.gov.in
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sage/50">
            © {new Date().getFullYear()} {SITE.developer}. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <button onClick={() => navigate("home")} className="text-sage/50 hover:text-gold transition-colors">Privacy Policy</button>
            <button onClick={() => navigate("home")} className="text-sage/50 hover:text-gold transition-colors">Disclaimer</button>
            <button
              onClick={() => navigate("admin")}
              className="inline-flex items-center gap-1 text-sage/50 hover:text-gold transition-colors"
              aria-label="Admin console"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Admin
            </button>
            <button onClick={() => openEnquiry()} className="text-gold font-semibold hover:text-gold-light transition-colors">
              Enquire Now
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
