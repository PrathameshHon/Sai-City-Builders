import {
  DoorOpen, Building2, Waves, Flower2, Baby, Footprints, TreePine, ShieldCheck,
} from "lucide-react";
import { AMENITIES } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const ICONS = {
  gate: DoorOpen,
  clubhouse: Building2,
  pool: Waves,
  garden: Flower2,
  play: Baby,
  jogging: Footprints,
  tree: TreePine,
  security: ShieldCheck,
} as const;

export function Amenities() {
  return (
    <section id="amenities" className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="World-Class Amenities"
          title="Everything Your Family Deserves"
          subtitle="A township designed around green living — with amenities for every age, wrapped in nature."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AMENITIES.map((item, i) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="group h-full rounded-3xl bg-white border border-border p-6 text-center shadow-[0_14px_36px_-24px_rgba(15,61,42,0.35)] hover:shadow-[0_22px_48px_-22px_rgba(15,61,42,0.45)] hover:-translate-y-1.5 hover:border-gold/50 transition-all duration-300">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage group-hover:bg-forest transition-colors duration-300">
                    <Icon className="h-8 w-8 text-pine group-hover:text-gold transition-colors duration-300" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-forest">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-moss">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
