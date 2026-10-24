export const SITE = {
  name: "Sai City Builders",
  project: "Sai Green Woods",
  developer: "Sai City Builders",
  tagline: "Truth Is Our Asset — Building Kopargaon’s Greenest Addresses",
  phone: "+91 98220 45678",
  phoneRaw: "+919822045678",
  whatsapp: "919822045678",
  email: "sales@saicitybuilders.in",
  address: "Sai City Builders, 2nd Floor, MG Road, Kopargaon, Ahmednagar, Maharashtra 423601",
  hours: "Mon – Sat: 9:30 AM – 7:00 PM · Sunday: By Appointment",
  reraNumbers: ["P52200079044", "P52200077262"],
  reraWebsite: "https://maharera.maharashtra.gov.in",
};

export type ViewRoute = "home" | "about" | "projects" | "gallery" | "reviews" | "contact" | "admin";

export const NAV_LINKS: { route: ViewRoute; label: string }[] = [
  { route: "home", label: "Home" },
  { route: "about", label: "About" },
  { route: "projects", label: "Projects" },
  { route: "gallery", label: "Gallery" },
  { route: "reviews", label: "Reviews" },
  { route: "contact", label: "Contact" },
];

export const VIEW_TITLES: Record<ViewRoute, string> = {
  home: "Sai City Builders | Sai Green Woods & Sai Towers — Kopargaon",
  about: "About Sai City Builders | Kopargaon",
  projects: "Projects | Sai Green Woods & Sai Towers by Sai City Builders",
  gallery: "Gallery | Sai City Builders",
  reviews: "Reviews & Testimonials | Sai City Builders",
  contact: "Contact Us | Sai City Builders, Kopargaon",
  admin: "Admin Console | Sai City Builders",
};

/* ── 3D scroll experience copy (Sai Towers fly-through) ─────── */
export const EXPERIENCE_STEPS = [
  {
    id: "the-address",
    index: "02",
    title: "On the main road.",
    copy: "Two levels of premium retail wrap the podium — a line-up of flagship stores that puts the city's best at your doorstep on MG Road.",
    chips: ["MG Road Frontage", "Retail Podium", "Premium Brands"],
  },
  {
    id: "the-facade",
    index: "03",
    title: "Green balconies.",
    copy: "Every apartment opens to a planted terrace framed in white — a facade that lives, breathes and turns greener with the seasons.",
    chips: ["Planted Terraces", "White Frames", "Deep Balconies"],
  },
  {
    id: "the-towers",
    index: "04",
    title: "Twin wings, one core.",
    copy: "Two residential wings join around a fluted central spine — light, air and privacy on every side of your home.",
    chips: ["Twin Wings", "Fluted Spine", "One Core"],
  },
  {
    id: "the-sky-deck",
    index: "05",
    title: "Terrace living.",
    copy: "A pergola-roofed sky deck, garden and play zone crown the building — your evening sky, reserved.",
    chips: ["Pergola Roof", "Sky Garden", "Play Zone"],
  },
] as const;

export const EXPERIENCE_RAIL = [
  { label: "Overview", threshold: 0 },
  { label: "The Address", threshold: 0.12 },
  { label: "The Facade", threshold: 0.36 },
  { label: "The Towers", threshold: 0.56 },
  { label: "The Sky Deck", threshold: 0.77 },
  { label: "Book Your Home", threshold: 0.96 },
] as const;

export const TRUST_BADGES = [
  {
    title: "MahaRERA Registered",
    description: "All projects registered with MahaRERA for complete transparency.",
    icon: "shield",
  },
  {
    title: "Clear Titles & NA Order",
    description: "Legally verified plots with crystal clear documentation.",
    icon: "file",
  },
  {
    title: "On-Time Possession",
    description: "A decade-long record of delivering every project on schedule.",
    icon: "clock",
  },
  {
    title: "Eco-Friendly Development",
    description: "500+ trees, rainwater harvesting and green open spaces.",
    icon: "leaf",
  },
] as const;

export const STATS = [
  { value: 12, suffix: "+", label: "Years of Experience" },
  { value: 15, suffix: "+", label: "Projects Delivered" },
  { value: 850, suffix: "+", label: "Happy Families" },
  { value: 60, suffix: "+", label: "Acres Developed" },
];

export const AMENITIES = [
  {
    title: "Grand Entrance Gate",
    description: "An imposing designer gateway with 24×7 security cabin welcomes you home.",
    icon: "gate",
  },
  {
    title: "Clubhouse",
    description: "A premium community clubhouse with lounge, indoor games & multipurpose hall.",
    icon: "clubhouse",
  },
  {
    title: "Swimming Pool",
    description: "A sparkling pool with sun deck and kids' pool for refreshing weekends.",
    icon: "pool",
  },
  {
    title: "Landscaped Gardens",
    description: "Meticulously manicured gardens, flower beds and open green spaces.",
    icon: "garden",
  },
  {
    title: "Children's Play Area",
    description: "Safe, modern play equipment on soft rubber flooring for the little ones.",
    icon: "play",
  },
  {
    title: "Jogging & Cycling Track",
    description: "Dedicated tracks winding through the green canopy of the township.",
    icon: "jogging",
  },
  {
    title: "Avenue Plantation",
    description: "Tree-lined internal avenues with 500+ planted trees across the township.",
    icon: "tree",
  },
  {
    title: "24×7 Security & CCTV",
    description: "Gated community with round-the-clock security and CCTV surveillance.",
    icon: "security",
  },
] as const;

export const GALLERY = [
  { src: "/images/projects/sai-towers-01.jpg", caption: "Sai Towers — MG Road Elevation" },
  { src: "/images/projects/sai-green-woods-02.jpg", caption: "Sai Green Woods — Signature Entrance" },
  { src: "/images/projects/sai-green-woods-01.jpg", caption: "Courtyard & Play Court — Sai Green Woods" },
  { src: "/images/projects/sai-towers-02.jpg", caption: "Retail Podium Frontage — Sai Towers" },
  { src: "/images/projects/sai-green-woods-03.jpg", caption: "Garden-Facing Blocks — Sai Green Woods" },
  { src: "/images/projects/sai-towers-03.jpg", caption: "Rooftop Sky Deck — Sai Towers" },
  { src: "/images/projects/sai-green-woods-04.jpg", caption: "Sai Green Woods from Above" },
];

export const LOCATION_ADVANTAGES = [
  { place: "Kopargaon City Market", distance: "2.0 km" },
  { place: "Kopargaon Railway Station", distance: "3.5 km" },
  { place: "Shirdi Sai Baba Temple", distance: "15 km" },
  { place: "Shirdi Airport", distance: "22 km" },
  { place: "Sacred Heart School & Colleges", distance: "1.5 km" },
  { place: "Nashik City", distance: "90 km" },
];

export const WHY_CHOOSE = [
  {
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden costs — what you see is what you pay.",
  },
  {
    title: "Quality Construction",
    description: "ISI-certified materials, structural audits and skilled supervision at every stage.",
  },
  {
    title: "Bank Loan Assistance",
    description: "Tie-ups with all leading banks for hassle-free home & plot loans.",
  },
  {
    title: "After-Sales Support",
    description: "Dedicated relationship managers even after your possession.",
  },
];
