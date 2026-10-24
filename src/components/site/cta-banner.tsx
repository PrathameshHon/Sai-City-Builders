"use client";

import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { useEnquiry } from "./site-context";
import { SITE } from "@/lib/site";

export function CtaBanner() {
  const { openEnquiry } = useEnquiry();

  return (
    <section className="bg-cream py-20 lg:py-24" aria-label="Call to action">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pine via-forest to-forest-deep px-8 py-14 sm:px-14 sm:py-16 lg:px-20">
            <div className="absolute inset-0 pattern-dots opacity-50" aria-hidden="true" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold/15 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />

            <div className="relative max-w-2xl">
              <p className="text-gold text-xs font-semibold tracking-[0.3em] uppercase">Experience Green Living</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.8rem] font-bold text-white leading-tight">
                Secure Your Spot in Sai Green Woods Today
              </h2>
              <p className="mt-4 text-sage/85 text-base sm:text-lg leading-relaxed max-w-xl">
                Limited inventory across Phases 1 &amp; 2. Book a free site visit, get the complete
                price list, and choose from prime plots &amp; villas before they&rsquo;re gone.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => openEnquiry()}
                  size="lg"
                  className="bg-gold hover:bg-gold-deep text-forest font-bold rounded-full px-8 h-12 shadow-[0_14px_36px_-12px_rgba(192,160,84,0.8)]"
                >
                  Book Free Site Visit
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white font-semibold rounded-full px-8 h-12"
                >
                  <a href={`tel:${SITE.phoneRaw}`}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {SITE.phone}
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white font-semibold rounded-full px-8 h-12"
                >
                  <a
                    href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello! I'm interested in Sai Green Woods. Please share details.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
