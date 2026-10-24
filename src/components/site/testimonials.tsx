"use client";

import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import type { SiteTestimonial } from "@/lib/types";

export function Testimonials({ testimonials }: { testimonials: SiteTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="bg-forest relative overflow-hidden py-20 lg:py-28 pattern-dots">
      <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/97 to-forest-deep" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          light
          eyebrow="Customer Testimonials"
          title="What Our Families Say"
          subtitle="Real stories from plot owners, villa residents and investors of Sai Green Woods."
        />

        <Reveal delay={0.15} className="mt-12">
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t) => (
                <CarouselItem key={t.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full bg-white/[0.07] border-white/10 backdrop-blur-sm rounded-3xl">
                    <CardContent className="p-6 flex flex-col h-full">
                      <Quote className="h-8 w-8 text-gold/60 mb-3" aria-hidden="true" />
                      <div className="flex gap-1 mb-3" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cnStar(i < t.rating)}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-sage/90 flex-1">&ldquo;{t.comment}&rdquo;</p>
                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-gold/40">
                          <AvatarFallback className="bg-pine text-gold font-bold">
                            {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-semibold text-cream">{t.name}</div>
                          <div className="text-xs text-gold/80">{t.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white left-2 lg:-left-14" />
            <CarouselNext className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white right-2 lg:-right-14" />
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}

function cnStar(filled: boolean) {
  return `h-4 w-4 ${filled ? "text-gold fill-gold" : "text-white/25 fill-white/10"}`;
}
