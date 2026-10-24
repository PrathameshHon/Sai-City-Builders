import { MapPin, Train, ShoppingBag, Plane, GraduationCap, Building } from "lucide-react";
import { LOCATION_ADVANTAGES, SITE } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const ICONS = [ShoppingBag, Train, MapPin, Plane, GraduationCap, Building] as const;

export function LocationSection() {
  return (
    <section id="location" className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Prime Location"
          title="Connected to Everything That Matters"
          subtitle="Strategically located on Shirdi Road, Kopargaon — close to daily conveniences yet wrapped in serene greenery."
        />

        <div className="mt-12 grid lg:grid-cols-[1fr_1.15fr] gap-8 items-stretch">
          {/* Map */}
          <Reveal className="order-2 lg:order-1">
            <div className="h-full min-h-[380px] rounded-3xl overflow-hidden border border-border shadow-[0_20px_48px_-28px_rgba(15,61,42,0.45)] bg-sage">
              <iframe
                title="Sai Green Woods location map — Kopargaon"
                src="https://www.openstreetmap.org/export/embed.html?bbox=74.4000%2C19.8400%2C74.5600%2C19.9400&layer=mapnik&marker=19.8876%2C74.4750"
                className="w-full h-full min-h-[380px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>

          {/* Advantages */}
          <div className="order-1 lg:order-2 grid sm:grid-cols-2 gap-4 content-start">
            {LOCATION_ADVANTAGES.map((item, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Reveal key={item.place} delay={i * 0.07}>
                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-border px-5 py-4 shadow-[0_10px_28px_-20px_rgba(15,61,42,0.3)] hover:border-gold/50 hover:-translate-y-0.5 transition-all duration-300">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage">
                      <Icon className="h-5 w-5 text-pine" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-forest truncate">{item.place}</div>
                      <div className="text-xs text-moss mt-0.5">{item.distance} away</div>
                    </div>
                    <span className="ml-auto text-[11px] font-bold text-gold-deep bg-gold-light/60 rounded-full px-2.5 py-1 shrink-0">
                      {item.distance}
                    </span>
                  </div>
                </Reveal>
              );
            })}
            <Reveal delay={0.5} className="sm:col-span-2">
              <div className="rounded-2xl bg-forest text-cream px-5 py-4 flex items-center gap-4 pattern-dots relative overflow-hidden">
                <MapPin className="h-8 w-8 text-gold shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-sm">Site Visit Available Daily</div>
                  <div className="text-xs text-sage/80 mt-0.5">
                    Call <a href={`tel:${SITE.phoneRaw}`} className="text-gold underline underline-offset-2">{SITE.phone}</a> to book a guided tour of the township.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
