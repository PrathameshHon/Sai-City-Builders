import { ShieldCheck, FileCheck2, Clock3, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TRUST_BADGES } from "@/lib/site";
import { Reveal } from "./reveal";

const ICONS = {
  shield: ShieldCheck,
  file: FileCheck2,
  clock: Clock3,
  leaf: Leaf,
} as const;

export function TrustBadges() {
  return (
    <section className="relative bg-cream" aria-label="Trust badges">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = ICONS[badge.icon as keyof typeof ICONS];
            return (
              <Reveal key={badge.title} delay={i * 0.08}>
                <Card className="h-full border-border bg-white shadow-[0_16px_40px_-24px_rgba(15,61,42,0.35)] hover:shadow-[0_20px_44px_-20px_rgba(15,61,42,0.45)] hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage">
                      <Icon className="h-6 w-6 text-pine" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-forest text-[15px] leading-snug">{badge.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-moss">{badge.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
