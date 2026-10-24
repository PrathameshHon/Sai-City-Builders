import { CheckCircle2 } from "lucide-react";
import { STATS, WHY_CHOOSE } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Counter } from "./counter";

export function About() {
  return (
    <section id="about" className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image side */}
          <Reveal className="relative">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-28 h-28 rounded-2xl border-2 border-gold/50 hidden sm:block" aria-hidden="true" />
              <img
                src="/images/about-team.png"
                alt="Sai City Builders engineers reviewing blueprints at construction site"
                className="relative rounded-3xl w-full h-[300px] sm:h-[420px] object-cover shadow-[0_32px_64px_-28px_rgba(15,61,42,0.5)]"
              />
              <div className="absolute -bottom-6 -right-3 sm:-right-6 rounded-2xl bg-forest text-cream px-6 py-4 shadow-xl max-w-[240px]">
                <div className="font-display text-3xl font-bold text-gold">
                  <Counter to={12} suffix="+" />
                </div>
                <div className="text-xs text-sage/80 mt-0.5 leading-snug">Years of building trust in Kopargaon</div>
              </div>
            </div>
          </Reveal>

          {/* Text side */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="About Sai Green Woods"
              title="Building Dream Homes Rooted in Nature"
              className="mb-6"
            />
            <Reveal delay={0.1}>
              <p className="text-moss leading-relaxed text-[15px] sm:text-base">
                A venture of <strong className="text-forest">Sai City Builders</strong>, Sai Green Woods
                was born from a simple belief — every family deserves a home where modern living and
                nature coexist in harmony. For over a decade, we have transformed the landscape of
                Kopargaon with thoughtfully planned plots, elegant villas and quality apartments.
              </p>
              <p className="mt-4 text-moss leading-relaxed text-[15px] sm:text-base">
                From legally clear NA plots with avenue plantations to MahaRERA-registered gated
                communities, every Sai Green Woods project is built with certified materials,
                transparent documentation and an unwavering commitment to on-time delivery.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {WHY_CHOOSE.map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-leaf shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-semibold text-forest text-sm">{item.title}</span>
                      <p className="text-[13px] text-moss leading-snug mt-0.5">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        {/* Stats band */}
        <Reveal delay={0.1} className="mt-16 lg:mt-20">
          <div className="rounded-3xl bg-forest relative overflow-hidden pattern-dots">
            <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/95 to-pine/90" aria-hidden="true" />
            <div className="relative grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
              {STATS.map((stat, i) => (
                <div key={stat.label} className={`px-6 py-8 sm:py-10 text-center ${i >= 2 ? "border-t lg:border-t-0 border-white/10" : ""}`}>
                  <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gold">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-2 text-xs sm:text-sm uppercase tracking-[0.15em] text-sage/85">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
