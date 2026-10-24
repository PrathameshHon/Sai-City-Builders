import { db } from '../src/lib/db'

/* Community seed: approved demo reviews + transformation albums.
   Gallery items and the demo PAID order live in the main seed. */

async function main() {
  const existing = await db.review.count()
  if (existing > 0) {
    console.log('Community seed already present — skipping.')
    return
  }

  /* ── Transformation albums (approved, visible on the site) ─────── */
  const communityAlbum = await db.album.create({
    data: {
      title: 'Evenings in the Courtyard — A-301',
      description:
        'Life at Sai Green Woods after possession — the play court, the gardens and the entrance we come home to every day.',
      projectName: 'Sai Green Woods',
      flatNo: 'A-301',
      ownerName: 'Rahul Deshmukh',
      approved: true,
      coverPhoto: '/images/projects/sai-green-woods-01.jpg',
      photos: {
        create: [
          { url: '/images/projects/sai-green-woods-01.jpg', caption: 'The courtyard and play court below our wing' },
          { url: '/images/projects/sai-green-woods-02.jpg', caption: 'The signature entrance arch' },
          { url: '/images/projects/sai-green-woods-04.jpg', caption: 'Our township from above' },
        ],
      },
    },
  })

  const towersAlbum = await db.album.create({
    data: {
      title: 'Why We Booked Early at Sai Towers',
      description:
        'We visited the site on MG Road and booked in the first week — the elevation, the retail podium and the rooftop sky deck sold us.',
      projectName: 'Sai Towers',
      flatNo: 'B-504',
      ownerName: 'Priya Kulkarni',
      approved: true,
      coverPhoto: '/images/projects/sai-towers-01.jpg',
      photos: {
        create: [
          { url: '/images/projects/sai-towers-01.jpg', caption: 'The MG Road elevation we fell for' },
          { url: '/images/projects/sai-towers-02.jpg', caption: 'Retail podium frontage' },
          { url: '/images/projects/sai-towers-03.jpg', caption: 'The rooftop sky deck with pool' },
        ],
      },
    },
  })

  /* ── Approved visitor reviews (some linked to albums) ──────────── */
  await db.review.create({
    data: {
      name: 'Rahul Deshmukh',
      email: 'rahul.d@example.in',
      rating: 5,
      title: 'Seamless booking to possession',
      comment:
        'From the online advance payment to the handover of our 3 BHK, every promise was kept — timeline, finishes, society paperwork. The courtyard is the heart of our evenings now.',
      projectName: 'Sai Green Woods',
      flatNo: 'A-301',
      albumId: communityAlbum.id,
      approved: true,
    },
  })

  await db.review.create({
    data: {
      name: 'Priya Kulkarni',
      rating: 5,
      title: 'Early registration at Sai Towers',
      comment:
        'We registered early and got priority unit selection. The team shared floor plans, pricing and construction updates at every step — fully transparent.',
      projectName: 'Sai Towers',
      flatNo: 'B-504',
      albumId: towersAlbum.id,
      approved: true,
    },
  })

  await db.review.create({
    data: {
      name: 'Sunita Patil',
      rating: 4,
      title: 'Green and peaceful',
      comment:
        'The gardens and play court are real, not brochure talk. Evening walks inside the township feel like a park. A wonderful place to raise children.',
      projectName: 'Sai Green Woods',
      flatNo: 'B-102',
      approved: true,
    },
  })

  /* ── One PENDING review to demo moderation ─────────────────────── */
  await db.review.create({
    data: {
      name: 'Manoj Jagtap',
      rating: 4,
      title: 'Clear documents',
      comment:
        'Booked a flat last month. Agreement, MahaRERA details and payment schedule were all shared upfront. The online booking process took less than ten minutes.',
      projectName: 'Sai Towers',
      flatNo: 'A-403',
      approved: false,
    },
  })

  const counts = {
    reviews: await db.review.count(),
    albums: await db.album.count(),
    photos: await db.albumPhoto.count(),
  }
  console.log('Community seeded:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
