import { db } from '../src/lib/db'

/* ── Seed: Sai City Builders — real projects, real images ────────────
   Sai Green Woods (Completed apartments, ready homes)
   Sai Towers (Ongoing, MG Road — retail podium + rooftop sky deck)  */

const SGW_GALLERY = [
  '/images/projects/sai-green-woods-01.jpg',
  '/images/projects/sai-green-woods-02.jpg',
  '/images/projects/sai-green-woods-03.jpg',
  '/images/projects/sai-green-woods-04.jpg',
]
const ST_GALLERY = [
  '/images/projects/sai-towers-01.jpg',
  '/images/projects/sai-towers-02.jpg',
  '/images/projects/sai-towers-03.jpg',
]

const FACINGS = ['North', 'East', 'West', 'South', 'North-East', 'South-West'] as const
const DEMO_LOCK_SESSION = 'demo-other-buyer-session'

interface UnitRow {
  projectId: string
  tower: string
  floor: number
  floorLabel: string
  unitNumber: string
  unitType: string
  areaSqft: number
  priceLakhs: number
  facing: string
  status: string
  lockedUntil?: Date
  lockSession?: string
}

function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
const roundStep = (v: number, step = 0.25) => Math.round(v / step) * step

/* ── Projects ──────────────────────────────────────────────────────── */
const projects = [
  {
    slug: 'sai-green-woods',
    name: 'Sai Green Woods',
    tagline: 'Ready to Move — Kopargaon’s Greenest Township',
    location: 'Kopargaon, Maharashtra',
    type: 'Apartments',
    status: 'Completed',
    price: 'Price on request',
    landArea: null,
    totalUnits: '32 Flats · 2 Towers',
    unitSizes: '2 & 3 BHK · 750–1,050 sq.ft',
    reraNumber: 'P52200079044 | P52200077262',
    possessionDate: 'Ready to Move',
    description:
      'Sai Green Woods is Sai City Builders’ completed residential community in Kopargaon — ready 2 & 3 BHK homes across two towers wrapped around a central courtyard with a sports court, children’s play area and landscaped gardens. A grand gated entrance, tree-lined avenues and mature greens make it one of Kopargaon’s greenest addresses. A limited number of homes remain available for immediate possession.',
    highlights: JSON.stringify([
      'Completed & Ready to Move',
      '2 & 3 BHK Homes · 750–1,050 sq.ft',
      'Central Courtyard with Sports Court',
      'Children’s Play Area & Landscaped Gardens',
      'Gated Community with Grand Entrance',
      'MahaRERA Registered',
    ]),
    amenities: JSON.stringify([
      'Sports Court',
      'Children’s Play Area',
      'Landscaped Courtyard',
      'Grand Entrance Arch',
      'Internal Roads',
      '24×7 Security',
    ]),
    image: SGW_GALLERY[0],
    gallery: JSON.stringify(SGW_GALLERY),
    featured: true,
    sortOrder: 1,
  },
  {
    slug: 'sai-towers',
    name: 'Sai Towers',
    tagline: 'Signature Towers on MG Road',
    location: 'MG Road, Kopargaon, Maharashtra',
    type: 'Apartments',
    status: 'Ongoing',
    price: 'Price on request',
    landArea: null,
    totalUnits: '56 Flats · 2 Towers',
    unitSizes: '2 & 3 BHK · 780–1,120 sq.ft',
    reraNumber: 'MahaRERA Registration In Progress',
    possessionDate: '2028 (Tentative)',
    description:
      'Sai Towers rises on MG Road — two elegant residential wings over a two-level retail podium, in the heart of Kopargaon. Premium 2 & 3 BHK homes with deep planted balconies, a pergola-roofed rooftop sky deck with pool, and flagship retail at your doorstep. MahaRERA registration in progress — register early for priority unit selection and pre-launch pricing.',
    highlights: JSON.stringify([
      'MG Road Frontage',
      'Premium 2 & 3 BHK Homes',
      'Two-Level Retail Podium',
      'Rooftop Sky Deck with Pool',
      'Deep Planted Balconies',
      'Priority Selection for Early Registrations',
    ]),
    amenities: JSON.stringify([
      'Rooftop Sky Deck',
      'Swimming Pool',
      'Retail Podium',
      'Landscaped Terrace',
      'Lift & Covered Parking',
      '24×7 Security',
    ]),
    image: ST_GALLERY[0],
    gallery: JSON.stringify(ST_GALLERY),
    featured: true,
    sortOrder: 2,
  },
]

/* ── Unit plans ────────────────────────────────────────────────────── */
function sgwUnits(projectId: string): UnitRow[] {
  const rng = makeRng(101)
  const now = new Date()
  const out: UnitRow[] = []
  for (const tower of ['A', 'B']) {
    for (let floor = 1; floor <= 4; floor++) {
      for (let pos = 1; pos <= 4; pos++) {
        const is2 = pos <= 2
        const roll = rng()
        let status = roll < 0.84 ? 'SOLD' : 'AVAILABLE' // completed — 84% sold
        if (tower === 'A' && floor === 3 && pos === 2) status = 'LOCKED' // demo: held by another buyer
        out.push({
          projectId,
          tower: `Tower ${tower}`,
          floor,
          floorLabel: String(floor),
          unitNumber: `${tower}-${floor}0${pos}`,
          unitType: is2 ? '2 BHK' : '3 BHK',
          areaSqft: is2 ? 750 : 1050,
          priceLakhs: roundStep((is2 ? 38 : 52) + (floor - 1) * 0.25),
          facing: FACINGS[(pos + floor) % FACINGS.length],
          status,
          ...(status === 'LOCKED'
            ? { lockedUntil: new Date(now.getTime() + 18 * 60000), lockSession: DEMO_LOCK_SESSION }
            : {}),
        })
      }
    }
  }
  return out
}

function stUnits(projectId: string): UnitRow[] {
  const rng = makeRng(707)
  const now = new Date()
  const out: UnitRow[] = []
  for (const tower of ['A', 'B']) {
    for (let floor = 1; floor <= 7; floor++) {
      for (let pos = 1; pos <= 4; pos++) {
        const is2 = pos <= 2
        const roll = rng()
        let status = roll < 0.27 ? 'SOLD' : 'AVAILABLE' // early construction — 27% sold
        if (tower === 'A' && floor === 2 && pos === 3) status = 'LOCKED' // demo: held by another buyer
        out.push({
          projectId,
          tower: `Tower ${tower}`,
          floor,
          floorLabel: String(floor),
          unitNumber: `${tower}-${floor}0${pos}`,
          unitType: is2 ? '2 BHK' : '3 BHK',
          areaSqft: is2 ? 780 : 1120,
          priceLakhs: roundStep((is2 ? 46 : 62) + (floor - 1) * 0.3, 0.05),
          facing: FACINGS[(pos + floor) % FACINGS.length],
          status,
          ...(status === 'LOCKED'
            ? { lockedUntil: new Date(now.getTime() + 20 * 60000), lockSession: DEMO_LOCK_SESSION }
            : {}),
        })
      }
    }
  }
  return out
}

/* ── Gallery items (real photos) ───────────────────────────────────── */
const galleryItems = [
  { title: 'Sai Towers — MG Road Elevation', category: 'Site', caption: 'Twin residential wings over a two-level retail podium', image: ST_GALLERY[0], sortOrder: 1 },
  { title: 'Sai Green Woods — Signature Entrance', category: 'Site', caption: 'The grand archway welcomes you home', image: SGW_GALLERY[1], sortOrder: 2 },
  { title: 'Courtyard & Play Court', category: 'Amenities', caption: 'Sports court, play zone and greens at the heart of Sai Green Woods', image: SGW_GALLERY[0], sortOrder: 3 },
  { title: 'Retail Podium Frontage', category: 'Site', caption: 'Flagship stores line the MG Road frontage at Sai Towers', image: ST_GALLERY[1], sortOrder: 4 },
  { title: 'Garden-Facing Blocks', category: 'Site', caption: 'Ready homes wrapped around the central courtyard', image: SGW_GALLERY[2], sortOrder: 5 },
  { title: 'Rooftop Sky Deck', category: 'Amenities', caption: 'Pool, deck and solar canopy crowning Sai Towers', image: ST_GALLERY[2], sortOrder: 6 },
  { title: 'Sai Green Woods from Above', category: 'Site', caption: 'The completed township and its tree-lined avenues', image: SGW_GALLERY[3], sortOrder: 7 },
]

/* ── Testimonials ──────────────────────────────────────────────────── */
const testimonials = [
  {
    name: 'Rahul Deshmukh',
    role: 'Homeowner, Sai Green Woods',
    rating: 5,
    comment:
      'We took possession of our 3 BHK last year and the community has only grown more beautiful — the courtyard is full of life every evening. Documents, handover and society setup were all handled smoothly by the Sai City Builders team.',
  },
  {
    name: 'Sunita Patil',
    role: 'Resident, Sai Green Woods',
    rating: 5,
    comment:
      'The courtyard, play court and gardens are exactly as shown — not brochure talk. Our children play downstairs every evening and the township feels safe and green. Truly a trustworthy builder.',
  },
  {
    name: 'Amit Sharma',
    role: 'Early Booker, Sai Towers',
    rating: 4,
    comment:
      'Booked early at Sai Towers and the team kept us informed at every step — floor plans, pricing, construction updates. The MG Road location and rooftop deck make it a clear standout in Kopargaon.',
  },
  {
    name: 'Priya Kulkarni',
    role: 'Early Registration, Sai Towers',
    rating: 5,
    comment:
      'We registered early for Sai Towers and got priority unit selection. Transparent pricing, no hidden costs, and the advance-payment process was fully online and hassle-free.',
  },
]

async function main() {
  // Clear existing data
  await db.bookingOrder.deleteMany()
  await db.booking.deleteMany()
  await db.testimonial.deleteMany()
  await db.galleryItem.deleteMany()
  await db.flat.deleteMany()
  await db.project.deleteMany()

  const unitPlans: Record<string, (projectId: string) => UnitRow[]> = {
    'sai-green-woods': sgwUnits,
    'sai-towers': stUnits,
  }

  for (const p of projects) {
    const created = await db.project.create({ data: p })
    const plan = unitPlans[p.slug]?.(created.id) ?? []
    if (plan.length > 0) await db.flat.createMany({ data: plan })
  }

  for (const item of galleryItems) {
    await db.galleryItem.create({ data: item })
  }

  for (const t of testimonials) {
    await db.testimonial.create({ data: t })
  }

  /* One PAID demo advance order (Sai Green Woods A-101) */
  const sgw = await db.project.findUnique({ where: { slug: 'sai-green-woods' } })
  if (sgw) {
    const flatA101 = await db.flat.findFirst({ where: { projectId: sgw.id, unitNumber: 'A-101' } })
    if (flatA101) {
      await db.flat.update({ where: { id: flatA101.id }, data: { status: 'SOLD' } })
      await db.booking.create({
        data: { flatId: flatA101.id, buyerName: 'Arjun Deshmukh', buyerPhone: '9822011223', status: 'confirmed' },
      })
      await db.bookingOrder.create({
        data: {
          flatId: flatA101.id,
          orderNumber: 'SCB-DEMO-0001',
          amount: 500,
          currency: 'INR',
          provider: 'demo',
          buyerName: 'Arjun Deshmukh',
          buyerPhone: '9822011223',
          buyerEmail: 'arjun.d@example.in',
          status: 'PAID',
        },
      })
    }
  }

  const counts = {
    projects: await db.project.count(),
    flats: await db.flat.count(),
    galleryItems: await db.galleryItem.count(),
    testimonials: await db.testimonial.count(),
  }
  console.log('Seeded:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
