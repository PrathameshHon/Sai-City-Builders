import { db } from "@/lib/db";
import { SiteShell } from "@/components/site/site-shell";
import type { FlatStats, SiteProject, SiteTestimonial } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function getSiteData(): Promise<{
  projects: SiteProject[];
  testimonials: SiteTestimonial[];
  flatStats: Record<string, FlatStats>;
}> {
  try {
    const [projects, testimonials, flatGroups] = await Promise.all([
      db.project.findMany({ orderBy: { sortOrder: "asc" } }),
      db.testimonial.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
      db.flat.groupBy({ by: ["projectId", "status"], _count: { _all: true } }),
    ]);

    // Aggregate per-project unit stats
    const statsByProject = new Map<string, FlatStats>();
    for (const g of flatGroups) {
      const entry =
        statsByProject.get(g.projectId) ?? { total: 0, sold: 0, available: 0, locked: 0 };
      entry.total += g._count._all;
      if (g.status === "SOLD") entry.sold += g._count._all;
      else if (g.status === "LOCKED") entry.locked += g._count._all;
      else entry.available += g._count._all;
      statsByProject.set(g.projectId, entry);
    }

    const flatStats: Record<string, FlatStats> = {};
    const mapped = projects.map((p) => {
      if (statsByProject.has(p.id)) flatStats[p.slug] = statsByProject.get(p.id)!;
      return {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        location: p.location,
        type: p.type,
        status: (p.status as SiteProject["status"]) ?? "Ongoing",
        price: p.price,
        landArea: p.landArea,
        totalUnits: p.totalUnits,
        unitSizes: p.unitSizes,
        reraNumber: p.reraNumber,
        possessionDate: p.possessionDate,
        description: p.description,
        highlights: parseJsonArray(p.highlights),
        amenities: parseJsonArray(p.amenities),
        image: p.image,
        gallery: parseJsonArray(p.gallery),
        featured: p.featured,
      };
    });

    return {
      projects: mapped,
      testimonials: testimonials.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        rating: t.rating,
        comment: t.comment,
      })),
      flatStats,
    };
  } catch (error) {
    console.error("Failed to load site data from database:", error);
    return { projects: [], testimonials: [], flatStats: {} };
  }
}

export default async function Home() {
  const { projects, testimonials, flatStats } = await getSiteData();

  return <SiteShell projects={projects} testimonials={testimonials} flatStats={flatStats} />;
}
