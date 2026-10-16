"use client";

/**
 * Shared foundation for the Sai Green Woods Admin Console.
 * API helper (with global 401 → login-gate signal), admin response types,
 * and reusable royal-styled building blocks (StatCard, UploadField, badges,
 * EmptyState, Pagination, delete confirmation).
 */

import { useRef, useState, type ReactNode } from "react";
import { Loader2, Star, Upload, X, ChevronLeft, ChevronRight, Trash2, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* ── API helper ────────────────────────────────────────────────────── */

/** Fired on any 401 from an admin endpoint — the shell drops to the login gate. */
export const ADMIN_401_EVENT = "sgw-admin-401";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(path, {
    ...init,
    headers: isForm
      ? init?.headers
      : { "Content-Type": "application/json", ...(init?.headers as Record<string, string> | undefined) },
    credentials: "same-origin",
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body is fine */
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/api/admin/login")) {
      window.dispatchEvent(new CustomEvent(ADMIN_401_EVENT));
    }
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export function toastApiError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : fallback;
  toast({ title: "Action failed", description: message, variant: "destructive" });
}

/* ── Admin API response contracts (mirror the curl-verified routes) ── */

export interface AdminStats {
  stats: {
    projects: number;
    flats: { total: number; available: number; locked: number; sold: number };
    enquiries: { total: number; new: number };
    reviews: { total: number; approved: number; pending: number };
    albums: { total: number; approved: number; pending: number };
    galleryItems: number;
    orders: { total: number; paid: number; revenue: number };
  };
  recentOrders: {
    orderNumber: string;
    buyerName: string;
    amount: number;
    provider: string;
    status: string;
    unitNumber: string | null;
    projectName: string | null;
    createdAt: string;
  }[];
  recentEnquiries: {
    id: string;
    name: string;
    phone: string;
    project: string | null;
    status: string;
    createdAt: string;
  }[];
}

export interface AdminProject {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  location: string;
  type: string;
  status: string;
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
  sortOrder: number;
  flatCount: number;
  createdAt: string;
}

export type FlatStatus = "AVAILABLE" | "LOCKED" | "SOLD";

export interface AdminFlat {
  id: string;
  unitNumber: string;
  tower: string;
  floorLabel: string | null;
  unitType: string | null;
  areaSqft: number | null;
  priceLakhs: number | null;
  facing: string | null;
  status: FlatStatus;
  lockedUntil: string | null;
  projectId: string;
  projectName: string | null;
  buyer: { name: string; phone: string; email: string | null } | null;
}

export interface FlatsPage {
  flats: AdminFlat[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface AdminBookingEntry {
  id: string;
  unitNumber: string | null;
  tower: string | null;
  projectName: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  priceLabel: string | null;
  status: string;
  createdAt: string;
  advance: {
    orderNumber: string;
    amount: number;
    provider: string;
    paymentId: string | null;
    paidAt: string | null;
  } | null;
}

export interface AdminPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface AdminReview {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rating: number;
  title: string | null;
  comment: string;
  projectName: string | null;
  flatNo: string | null;
  approved: boolean;
  albumId: string | null;
  albumTitle: string | null;
  photos: AdminPhoto[];
  createdAt: string;
}

export interface AdminAlbum {
  id: string;
  title: string;
  description: string | null;
  projectName: string | null;
  flatNo: string | null;
  ownerName: string | null;
  approved: boolean;
  coverPhoto: string | null;
  photoCount: number;
  photos: AdminPhoto[];
  createdAt: string;
}

export interface AdminGalleryItem {
  id: string;
  title: string;
  category: string;
  caption: string | null;
  image: string;
  sortOrder: number;
}

export interface AdminEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  project: string | null;
  budget: string | null;
  message: string | null;
  source: string | null;
  status: string;
  createdAt: string;
}

export interface AdminSettings {
  advanceAmount: number;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  adminPassword: string;
  adminEmail: string;
}

/** Admin console tab ids (shared by shell + overview quick actions). */
export type AdminTab =
  | "overview"
  | "projects"
  | "units"
  | "reviews"
  | "albums"
  | "gallery"
  | "enquiries"
  | "settings";

/* ── Formatters ────────────────────────────────────────────────────── */

export function inr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fmtDateFull(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Split a "one per line" textarea into a clean string[]. */
export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/* ── Layout primitives ─────────────────────────────────────────────── */

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-sand bg-pearl p-4 sm:p-6 [box-shadow:0_10px_30px_-18px_rgba(7,42,31,0.25)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function StatCard({
  icon,
  value,
  label,
  sub,
  alert,
  children,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sub?: ReactNode;
  alert?: number;
  children?: ReactNode;
}) {
  return (
    <div className="royal-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 text-cream shadow-royal">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage/80">{label}</span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold [&>svg]:size-5">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-2xl sm:text-3xl font-bold leading-none">{value}</span>
        {typeof alert === "number" && alert > 0 && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-forest-deep">
            {alert} to review
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-xs text-sage/80">{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
      <span className="gold-hairline absolute inset-x-4 bottom-0" aria-hidden="true" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 bg-sand/40 px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-forest/10 text-gold-deep [&>svg]:size-5">
        {icon ?? <Inbox />}
      </span>
      <p className="font-display text-lg font-semibold text-forest">{title}</p>
      {description && <p className="max-w-sm text-sm text-moss">{description}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl bg-sand" />
      ))}
    </div>
  );
}

/* ── Badges ────────────────────────────────────────────────────────── */

const badgeBase = "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap";

export function FlatStatusBadge({ status }: { status: FlatStatus | string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-leaf/15 text-leaf border-leaf/30",
    LOCKED: "bg-gold/20 text-gold-deep border-gold/45",
    SOLD: "bg-stone-200/70 text-stone-500 border-stone-300",
  };
  const labels: Record<string, string> = { AVAILABLE: "Available", LOCKED: "Held", SOLD: "Sold" };
  return <span className={cn(badgeBase, styles[status] ?? "bg-sand text-moss border-sand")}>{labels[status] ?? status}</span>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Ongoing: "bg-gold/20 text-gold-deep border-gold/45",
    Completed: "bg-leaf/15 text-leaf border-leaf/30",
    Upcoming: "border-brick/50 bg-transparent text-brick",
  };
  return <span className={cn(badgeBase, styles[status] ?? "bg-sand text-moss border-sand")}>{status}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  return <span className={cn(badgeBase, "bg-forest/8 border-forest/15 text-forest")}>{type}</span>;
}

export function EnquiryStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-brick/12 text-brick border-brick/35",
    contacted: "bg-gold/20 text-gold-deep border-gold/45",
    qualified: "bg-pine/12 text-pine border-pine/35",
    confirmed: "bg-leaf/15 text-leaf border-leaf/30",
  };
  return <span className={cn(badgeBase, styles[status] ?? "bg-sand text-moss border-sand")}>{status}</span>;
}

export function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-leaf/15 text-leaf border-leaf/30",
    cancelled: "bg-stone-200/70 text-stone-500 border-stone-300",
  };
  return <span className={cn(badgeBase, styles[status] ?? "bg-sand text-moss border-sand")}>{status}</span>;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-leaf/15 text-leaf border-leaf/30",
    FAILED: "bg-brick/12 text-brick border-brick/35",
    CREATED: "bg-gold-light/60 text-gold-deep border-gold/50",
  };
  return <span className={cn(badgeBase, styles[status] ?? "bg-sand text-moss border-sand")}>{status}</span>;
}

export function ProviderBadge({ provider }: { provider: string }) {
  const isRazorpay = provider === "razorpay";
  return (
    <span
      className={cn(
        badgeBase,
        isRazorpay ? "bg-gold/20 text-gold-deep border-gold/45" : "bg-sage text-forest border-sage"
      )}
    >
      {isRazorpay ? "Razorpay" : "Demo"}
    </span>
  );
}

export function StarsRow({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < rating ? "fill-gold text-gold" : "fill-transparent text-gold/40")}
        />
      ))}
    </span>
  );
}

/* ── Pagination ────────────────────────────────────────────────────── */

export function Pagination({
  page,
  pages,
  onPage,
  total,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  total?: number;
}) {
  if (pages <= 1) return null;

  const pageWindow: (number | "…")[] = [];
  const push = (n: number | "…") => pageWindow.push(n);
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i);
    if (page < pages - 2) push("…");
    push(pages);
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 mt-4" aria-label="Pagination">
      <p className="text-xs text-moss">
        Page {page} of {pages}
        {typeof total === "number" && ` · ${total.toLocaleString("en-IN")} units`}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft /> Prev
        </Button>
        {pageWindow.map((entry, i) =>
          entry === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-moss">
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant="outline"
              size="icon"
              className={cn(
                "size-8 text-xs font-semibold",
                entry === page ? "border-gold bg-gold/20 text-gold-deep" : "text-moss hover:text-forest"
              )}
              onClick={() => onPage(entry)}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </Button>
          )
        )}
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          Next <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

/* ── Destructive confirm + delete helper ───────────────────────────── */

export function ConfirmAction({
  triggerLabel,
  triggerTitle,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  icon,
  busyLabel,
}: {
  triggerLabel: string;
  triggerTitle: string;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  icon?: ReactNode;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-brick hover:bg-brick/10 hover:text-brick"
          title={triggerTitle}
        >
          {icon ?? <Trash2 className="size-3.5" />}
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[92vw] rounded-2xl border-gold/40 bg-pearl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg text-forest">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-moss">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="bg-brick text-white hover:bg-brick/90"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {busyLabel ?? "Working…"}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** DELETE helper: performs the request, toasts errors, returns success. */
export async function confirmDelete(url: string, label: string): Promise<boolean> {
  try {
    await api(url, { method: "DELETE" });
    toast({ title: `${label} deleted` });
    return true;
  } catch (error) {
    toastApiError(error);
    return false;
  }
}

/* ── Upload field ──────────────────────────────────────────────────── */

export function UploadField({
  label,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ success: boolean; url: string }>("/api/upload", { method: "POST", body: fd });
      onChange(res.url);
      toast({ title: "Image uploaded", description: res.url });
    } catch (error) {
      toastApiError(error);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium text-forest">
          {label} {required && <span className="text-brick">*</span>}
        </p>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-brick hover:bg-brick/10"
            onClick={() => onChange("")}
          >
            <X className="size-3.5" /> Remove
          </Button>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div
          className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sand bg-sand/50"
          aria-hidden={value ? undefined : true}
        >
          {value ? (
            <img src={value} alt="Selected image preview" className="h-full w-full object-cover" />
          ) : (
            <Upload className="size-6 text-moss/50" />
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-pearl/70">
              <Loader2 className="size-6 animate-spin text-gold-deep" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload image
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="…or paste an image URL"
              className="h-8 text-xs bg-white"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => {
                const trimmed = urlDraft.trim();
                if (trimmed) {
                  onChange(trimmed);
                  setUrlDraft("");
                }
              }}
            >
              Use
            </Button>
          </div>
          {hint && <p className="text-[11px] text-moss/80">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────── */

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-brick/30 bg-brick/5 px-4 py-3 text-sm text-brick" role="alert">
      {message}
    </div>
  );
}
