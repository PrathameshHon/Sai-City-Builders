"use client";

import { ViewHero } from "./view-hero";
import { About } from "../about";
import { Amenities } from "../amenities";
import { TrustBadges } from "../trust-badges";
import { CtaBanner } from "../cta-banner";

export function AboutView() {
  return (
    <>
      <ViewHero
        eyebrow="About Us"
        title="The House Behind the Greenwoods"
        description="Sai Towers & Developers has spent over a decade turning clear-titled land into green, gated communities — 15+ projects, 850+ families, 60+ acres and counting."
      />
      <div className="bg-cream pt-16 lg:pt-20">
        <TrustBadges />
      </div>
      <About />
      <Amenities />
      <CtaBanner />
    </>
  );
}
