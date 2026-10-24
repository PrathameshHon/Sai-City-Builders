"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock3, Loader2, Send } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { SITE } from "@/lib/site";
import type { SiteProject } from "@/lib/types";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function Contact({ projects }: { projects: SiteProject[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", project: "General Enquiry", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.phone.trim().length < 10) {
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
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          project: form.project,
          message: form.message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast({
        title: "Message sent successfully!",
        description: "Our team will get back to you within 24 hours.",
      });
      setForm({ name: "", phone: "", email: "", project: "General Enquiry", message: "" });
    } catch (err) {
      toast({
        title: "Could not send message",
        description: err instanceof Error ? err.message : "Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const infoCards = [
    {
      icon: Phone,
      title: "Call Us",
      lines: [SITE.phone],
      href: `tel:${SITE.phoneRaw}`,
      action: "Call now",
    },
    {
      icon: Mail,
      title: "Email Us",
      lines: [SITE.email],
      href: `mailto:${SITE.email}`,
      action: "Send email",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      lines: ["Sai City Builders, 2nd Floor, MG Road", "Kopargaon, Ahmednagar 423601"],
      href: "https://www.openstreetmap.org/?mlat=19.8876&mlon=74.4750#map=14/19.8876/74.4750",
      action: "Get directions",
    },
    {
      icon: Clock3,
      title: "Working Hours",
      lines: ["Mon – Sat: 9:30 AM – 7:00 PM", "Sunday: By Appointment"],
    },
  ];

  return (
    <section id="contact" className="bg-sage/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contact Us"
          title="We're Here to Help You Find Home"
          subtitle="Get in touch for site visits, pricing, availability or any questions about our projects."
        />

        <div className="mt-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
          {/* Info cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 content-start">
            {infoCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.07}>
                <div className="h-full rounded-2xl bg-white border border-border p-5 shadow-[0_12px_32px_-24px_rgba(15,61,42,0.35)] hover:border-gold/50 transition-colors flex flex-col">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage">
                    <card.icon className="h-5 w-5 text-pine" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold text-forest">{card.title}</h3>
                  {card.lines.map((line) => (
                    <p key={line} className="text-[13px] text-moss mt-1 leading-snug">{line}</p>
                  ))}
                  {card.href && card.action && (
                    <a
                      href={card.href}
                      target={card.href.startsWith("http") ? "_blank" : undefined}
                      rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="mt-3 text-xs font-bold text-pine hover:text-leaf transition-colors mt-auto"
                    >
                      {card.action} &rarr;
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Form */}
          <Reveal delay={0.12}>
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white border border-border shadow-[0_24px_56px_-32px_rgba(15,61,42,0.45)] p-6 sm:p-8"
              aria-label="Contact form"
            >
              <h3 className="font-display text-2xl font-bold text-forest">Send an Enquiry</h3>
              <p className="text-sm text-moss mt-1 mb-6">Fill in the details — we usually respond within a few hours.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-forest text-sm font-medium">
                    Your Name <span className="text-brick">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    required
                    className="h-11 rounded-xl focus-visible:ring-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone" className="text-forest text-sm font-medium">
                    Phone Number <span className="text-brick">*</span>
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+ ]/g, "") })}
                    placeholder="98XXX XXXXX"
                    required
                    className="h-11 rounded-xl focus-visible:ring-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-forest text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl focus-visible:ring-gold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-forest text-sm font-medium">Interested In</Label>
                  <Select value={form.project} onValueChange={(v) => setForm({ ...form, project: v })}>
                    <SelectTrigger className="h-11 rounded-xl focus-visible:ring-gold w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Enquiry">General Enquiry</SelectItem>
                      <SelectItem value="Site Visit">Site Visit Booking</SelectItem>
                      <SelectItem value="Channel Partner">Channel Partner Enquiry</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.slug} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="contact-message" className="text-forest text-sm font-medium">
                    Your Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your requirement — plot size, budget, timeline..."
                    rows={4}
                    className="rounded-xl focus-visible:ring-gold resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full sm:w-auto h-12 px-10 bg-pine hover:bg-leaf text-white font-bold rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
