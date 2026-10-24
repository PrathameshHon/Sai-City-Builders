"use client";

import { ViewHero } from "./view-hero";
import { Contact } from "../contact";
import { LocationSection } from "../location";
import { CtaBanner } from "../cta-banner";
import type { SiteProject } from "@/lib/types";

export function ContactView({ projects }: { projects: SiteProject[] }) {
  return (
    <>
      <ViewHero
        eyebrow="Contact"
        title="Visit Us at the Greenwoods"
        description="Walk into our Kopargaon office, call us, or leave an enquiry — our relationship managers respond within one working day."
      />
      <Contact projects={projects} />
      <LocationSection />
      <CtaBanner />
    </>
  );
}
