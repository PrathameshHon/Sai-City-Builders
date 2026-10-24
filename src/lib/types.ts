export interface FlatStats {
  total: number;
  sold: number;
  available: number;
  locked: number;
}

export interface SiteProject {
  slug: string;
  name: string;
  tagline: string | null;
  location: string;
  type: string;
  status: "Ongoing" | "Completed" | "Upcoming";
  price: string;
  landArea: string | null;
  totalUnits: string | null;
  unitSizes: string | null;
  reraNumber: string | null;
  possessionDate: string | null;
  description: string;
  highlights: string[];
  amenities: string[];
  image: string;
  gallery: string[];
  featured: boolean;
}

export interface SiteTestimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
}

/* ── Visitor reviews (moderated) ─────────────────────────────────── */

export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  projectName: string | null;
  flatNo: string | null;
  albumId: string | null;
  /** preview photo urls from the linked transformation album (max 4) */
  photos: string[];
  createdAt: string;
}

/* ── Community transformation albums (grouped project → flat) ────── */

export interface AlbumPhotoInfo {
  id: string;
  url: string;
  caption: string | null;
}

export interface PublicAlbum {
  id: string;
  title: string;
  description: string | null;
  projectName: string;
  flatNo: string;
  ownerName: string;
  coverPhoto: string | null;
  photoCount: number;
  photos: AlbumPhotoInfo[];
  createdAt: string;
}

/* ── Admin-managed gallery ───────────────────────────────────────── */

export interface GalleryItemInfo {
  id: string;
  title: string;
  category: string;
  caption: string | null;
  image: string;
  sortOrder: number;
}

/* ── Advance payment booking flow ────────────────────────────────── */

export interface PaymentSettings {
  advanceAmount: number;
  currency: "INR";
  razorpayConfigured: boolean;
  razorpayKeyId: string | null;
}

export interface PaymentInitiateResponse {
  success: true;
  orderNumber: string;
  amount: number;
  currency: "INR";
  provider: "razorpay" | "demo";
  razorpay: { keyId: string; orderId: string; amount: number; currency: "INR" } | null;
  unit: { unitNumber: string; project: string; priceLabel: string };
  message?: string;
}

export interface PaymentConfirmResponse {
  success: true;
  bookingId: string;
  orderNumber: string;
  amount: number;
  provider: "razorpay" | "demo";
  message: string;
  unit: { unitNumber: string; project: string };
}
