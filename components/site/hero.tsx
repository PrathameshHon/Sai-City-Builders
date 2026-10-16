"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, ChevronDown, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SITE } from "@/lib/site";
import type { SiteProject } from "@/lib/types";
import { useEnquiry } from "./site-shell";

export function Hero({ projects }: { projects: SiteProject[] }) {
  const { openEnquiry } = useEnquiry();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState<string>("General Enquiry");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 10) {
      toast({
        title: "Please check your details",
        description: "Name and a valid 10-digit phone number are required.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), project }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast({
        title: "Enquiry submitted successfully!",
        description: "Our team will call you back within 24 hours.",
      });
      setName("");
      setPhone("");
      setProject("General Enquiry");
    } catch (err) {
      toast({
        title: "Could not submit enquiry",
        description: err instanceof Error ? err.message : "Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/images/hero.png" alt="Sai Green Woods township aerial view" className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 pattern-dots opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-gold/40 px-4 py-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium text-cream tracking-wide">
                MahaRERA Registered · {SITE.reraNumbers[0]}
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-gold text-sm font-semibold tracking-[0.3em] uppercase"
            >
              By Sat Towers · Kopargaon
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08]"
            >
              Where Nature Meets
              <br />
              Your <span className="text-gold italic">Dream Home</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 max-w-xl text-base sm:text-lg text-sage/90 leading-relaxed"
            >
              Premium NA plots, villas &amp; apartments nestled in 60+ acres of lush green
              landscapes at Kopargaon — with clear titles, quality construction and on-time
              possession, just 15 km from Shirdi.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-deep text-forest font-bold rounded-full px-8 h-12 shadow-[0_12px_32px_-10px_rgba(192,160,84,0.7)]"
              >
                <a href="#projects">Explore Projects</a>
              </Button>
              <Button
                onClick={() => openEnquiry()}
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10 hover:text-white font-semibold rounded-full px-8 h-12 bg-transparent"
              >
                Book a Site Visit
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-8 flex items-center gap-2 text-sm text-sage/80"
            >
              <MapPin className="h-4 w-4 text-gold shrink-0" aria-hidden="true" />
              Shirdi Road, Kopargaon · Ahmednagar, Maharashtra
            </motion.div>
          </div>

          {/* Right: enquiry form */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-gold/40 via-transparent to-gold/20 blur-sm" aria-hidden="true" />
            <form
              onSubmit={handleSubmit}
              className="relative rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-7 shadow-[0_28px_60px_-20px_rgba(10,44,30,0.5)]"
              aria-label="Quick enquiry form"
            >
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck className="h-5 w-5 text-pine" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold text-forest">Enquire Now</h2>
              </div>
              <p className="text-sm text-moss mb-5">Get callback within 24 hours. No spam, promise.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-name" className="text-forest text-sm font-medium">
                    Your Name <span className="text-brick">*</span>
                  </Label>
                  <Input
                    id="hero-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    required
                    className="h-11 rounded-xl border-border focus-visible:ring-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hero-phone" className="text-forest text-sm font-medium">
                    Phone Number <span className="text-brick">*</span>
                  </Label>
                  <Input
                    id="hero-phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9+ ]{10,15}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
                    placeholder="98XXX XXXXX"
                    required
                    className="h-11 rounded-xl border-border focus-visible:ring-gold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-forest text-sm font-medium">Interested In</Label>
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger className="h-11 rounded-xl border-border focus-visible:ring-gold w-full">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Enquiry">General Enquiry</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.slug} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-pine hover:bg-leaf text-white font-bold rounded-xl text-base shadow-[0_10px_24px_-10px_rgba(28,91,63,0.7)]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Enquiry"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="hidden lg:flex absolute -bottom-5 left-1/2 -translate-x-1/2 flex-col items-center text-sage/60 hover:text-gold transition-colors"
          aria-label="Scroll down to about section"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] mb-1">Scroll</span>
          <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  );
}
