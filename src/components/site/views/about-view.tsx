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
        description="Sai City Builders has spent over a decade turning clear-titled land into green, gated communities — trusted by hundreds of families across Kopargaon and counting."
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
