"use client";

import { ViewHero } from "./view-hero";
import { Projects } from "../projects";
import { BookingSection } from "../booking-section";
import { CtaBanner } from "../cta-banner";
import type { FlatStats, SiteProject } from "@/lib/types";

interface ProjectsViewProps {
  projects: SiteProject[];
  flatStats?: Record<string, FlatStats>;
  preselectSlug?: string | null;
}

export function ProjectsView({ projects, flatStats, preselectSlug }: ProjectsViewProps) {
  return (
    <>
      <ViewHero
        eyebrow="Our Projects"
        title="Developments & Live Booking Studio"
        description="Sai Green Woods and the upcoming Sai Towers — explore MahaRERA-registered communities, check live sold/available counts, and book your exact home online."
      />
      <Projects projects={projects} flatStats={flatStats} />
      <BookingSection projects={projects} preselectSlug={preselectSlug} />
      <CtaBanner />
    </>
  );
}
