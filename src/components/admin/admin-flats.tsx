"use client";

/**
 * Units & Bookings — inventory browser with filters/pagination and the
 * merged advance-payment bookings ledger.
 */

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, Home, BookOpen, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import {
  AdminCard,
  AdminBookingEntry,
  AdminProject,
  BookingStatusBadge,
  EmptyState,
  ErrorNote,
  FlatStatusBadge,
  FlatsPage,
  Pagination,
  ProviderBadge,
  TableSkeleton,
  api,
  fmtDateFull,
  toastApiError,
  type AdminFlat,
} from "./admin-shared";

const PAGE_SIZE = 60;
const FLAT_STATUSES = ["AVAILABLE", "LOCKED", "SOLD"] as const;

interface FlatsSectionProps {
  onDataChanged: () => void;
}

export function FlatsSection({ onDataChanged }: FlatsSectionProps) {
  const [subTab, setSubTab] = useState<"inventory" | "bookings">("inventory");

  return (
    <div className="space-y-5">
      <Tabs value={subTab} onValueChange={(value) => setSubTab(value as "inventory" | "bookings")}>
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-xl bg-forest p-1">
          <TabsTrigger
            value="inventory"
            className="rounded-lg py-2 data-[state=active]:bg-gold data-[state=active]:text-forest-deep data-[state=active]:font-semibold"
          >
            <Home className="size-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="rounded-lg py-2 data-[state=active]:bg-gold data-[state=active]:text-forest-deep data-[state=active]:font-semibold"
          >
            <BookOpen className="size-4" /> Bookings Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <InventoryTab onDataChanged={onDataChanged} />
        </TabsContent>
        <TabsContent value="bookings" className="mt-4">
          <BookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Inventory ─────────────────────────────────────────────────────── */

function InventoryTab({ onDataChanged }: { onDataChanged: () => void }) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<FlatsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [soldTarget, setSoldTarget] = useState<AdminFlat | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [marking, setMarking] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  /* Project options for the filter */
  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ projects: AdminProject[] }>("/api/admin/projects");
        setProjects(res.projects);
      } catch {
        /* filter stays with "All projects" */
      }
    })();
  }, []);

  /* Debounce the search box */
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchDraft.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (projectFilter !== "all") params.set("projectId", projectFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);
      const res = await api<FlatsPage>(`/api/admin/flats?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, [page, projectFilter, statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Reset to page 1 whenever filters change */
  useEffect(() => {
    setPage(1);
  }, [projectFilter, statusFilter, search]);

  async function markSold() {
    if (!soldTarget || marking) return;
    setMarking(true);
    try {
      const body: Record<string, unknown> = { status: "SOLD" };
      if (buyerName.trim()) body.buyerName = buyerName.trim();
      if (buyerPhone.trim()) body.buyerPhone = buyerPhone.trim();
      const res = await api<{ message: string }>(`/api/admin/flats/${soldTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast({ title: "Unit marked sold", description: res.message });
      setSoldTarget(null);
      setBuyerName("");
      setBuyerPhone("");
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setMarking(false);
    }
  }

  async function markAvailable(flat: AdminFlat) {
    setReleasingId(flat.id);
    try {
      const res = await api<{ message: string }>(`/api/admin/flats/${flat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "AVAILABLE" }),
      });
      toast({ title: "Unit back on the market", description: res.message });
      await load();
      onDataChanged();
    } catch (err) {
      toastApiError(err);
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <AdminCard className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <Label htmlFor="flat-project" className="sr-only">
            Filter by project
          </Label>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger id="flat-project" className="bg-white sm:w-64 w-full">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} ({project.flatCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="flat-status" className="sr-only">
            Filter by status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="flat-status" className="bg-white w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {FLAT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "AVAILABLE" ? "Available" : status === "LOCKED" ? "Held" : "Sold"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Label htmlFor="flat-search" className="sr-only">
            Search by unit number
          </Label>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss/60" aria-hidden="true" />
          <Input
            id="flat-search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search unit no. (e.g. A-02)"
            className="bg-white pl-9"
          />
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {/* Table */}
      {loading && !data ? (
        <TableSkeleton rows={6} />
      ) : data && data.flats.length === 0 ? (
        <EmptyState
          title="No units match"
          description="Try clearing the search or switching the project / status filters."
          icon={<Search />}
        />
      ) : data ? (
        <div className="overflow-hidden rounded-xl border border-sand">
          <div className="max-h-[600px] overflow-y-auto scroll-area-thin">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-cream shadow-[0_1px_0_#e6dfcd]">
                  <TableRow className="border-sand hover:bg-transparent">
                    <TableHead className="text-gold-deep">Unit</TableHead>
                    <TableHead className="text-gold-deep">Tower</TableHead>
                    <TableHead className="text-gold-deep">Type</TableHead>
                    <TableHead className="text-gold-deep">Area</TableHead>
                    <TableHead className="text-gold-deep">Price</TableHead>
                    <TableHead className="text-gold-deep">Status</TableHead>
                    <TableHead className="text-gold-deep">Buyer</TableHead>
                    <TableHead className="text-right text-gold-deep">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.flats.map((flat) => (
                    <TableRow key={flat.id} className="border-sand">
                      <TableCell className="font-semibold text-forest">
                        {flat.unitNumber}
                        <span className="block text-[11px] font-normal text-moss">
                          {flat.floorLabel ? `Floor ${flat.floorLabel}` : "—"} · {flat.projectName ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-moss">{flat.tower}</TableCell>
                      <TableCell className="text-sm text-moss">{flat.unitType ?? "—"}</TableCell>
                      <TableCell className="text-sm text-moss">
                        {flat.areaSqft ? `${flat.areaSqft.toLocaleString("en-IN")} sq.ft` : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-forest">
                        {flat.priceLakhs != null ? `₹${flat.priceLakhs} L` : "—"}
                      </TableCell>
                      <TableCell>
                        <FlatStatusBadge status={flat.status} />
                      </TableCell>
                      <TableCell className="max-w-40">
                        {flat.buyer ? (
                          <div className="min-w-0">
                            <p className="truncate text-sm text-forest">{flat.buyer.name}</p>
                            <p className="truncate text-[11px] text-moss">{flat.buyer.phone}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-moss/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {flat.status === "SOLD" ? (
                          <ReleaseUnitDialog
                            flat={flat}
                            busy={releasingId === flat.id}
                            onConfirm={() => markAvailable(flat)}
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-gold/50 text-gold-deep hover:bg-gold/10 hover:text-gold-deep"
                            onClick={() => {
                              setSoldTarget(flat);
                              setBuyerName("");
                              setBuyerPhone("");
                            }}
                          >
                            Mark Sold
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : null}

      {loading && data ? (
        <p className="flex items-center gap-2 text-xs text-moss">
          <Loader2 className="size-3.5 animate-spin text-gold-deep" /> Refreshing…
        </p>
      ) : null}

      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} total={data.total} />}

      {/* Mark sold dialog */}
      <Dialog open={soldTarget !== null} onOpenChange={(open) => !marking && !open && setSoldTarget(null)}>
        <DialogContent className="max-w-md w-[94vw] rounded-2xl border-gold/40 bg-pearl p-0 gap-0 overflow-hidden">
          <div className="royal-panel px-5 py-4">
            <DialogTitle className="font-display text-xl font-bold text-cream">
              Mark {soldTarget?.unitNumber} as Sold
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-sage/80">
              {soldTarget?.projectName ?? ""} · {soldTarget?.tower}
              {soldTarget?.priceLakhs != null ? ` · ₹${soldTarget.priceLakhs} L` : ""}
            </DialogDescription>
            <span className="gold-hairline mt-3 block" aria-hidden="true" />
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="buyer-name" className="text-forest">
                Buyer name <span className="font-normal text-moss">(optional)</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss/60" aria-hidden="true" />
                <Input
                  id="buyer-name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Defaults to “Admin Marked”"
                  className="bg-white pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="buyer-phone" className="text-forest">
                Buyer phone <span className="font-normal text-moss">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss/60" aria-hidden="true" />
                <Input
                  id="buyer-phone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+91…"
                  className="bg-white pl-9"
                />
              </div>
            </div>
            <p className="text-xs text-moss/80">
              A confirmed booking record is created for this unit (advance stays as-is).
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-sand px-5 py-4">
            <Button variant="outline" onClick={() => setSoldTarget(null)} disabled={marking}>
              Cancel
            </Button>
            <Button onClick={() => void markSold()} disabled={marking} className="bg-forest text-cream hover:bg-pine">
              {marking ? <Loader2 className="size-4 animate-spin" /> : null}
              Mark Sold
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminCard>
  );
}

function ReleaseUnitDialog({ flat, busy, onConfirm }: { flat: AdminFlat; busy: boolean; onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-brick hover:bg-brick/10 hover:text-brick">
          Mark Available
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[92vw] rounded-2xl border-gold/40 bg-pearl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg text-forest">
            Release {flat.unitNumber} back to market?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-moss">
            This sets the unit to Available and cancels its booking records. Buyers will see it as bookable
            again immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep as Sold</AlertDialogCancel>
          <AlertDialogAction
            className="bg-brick text-white hover:bg-brick/90"
            onClick={(event) => {
              event.preventDefault();
              void (async () => {
                await onConfirm();
                setOpen(false);
              })().catch(toastApiError);
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Releasing…" : "Mark Available"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── Bookings ledger ───────────────────────────────────────────────── */

function BookingsTab() {
  const [entries, setEntries] = useState<AdminBookingEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ entries: AdminBookingEntry[] }>("/api/admin/bookings");
        if (!cancelled) setEntries(res.entries);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load bookings");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!entries) return <TableSkeleton rows={6} />;

  return (
    <AdminCard className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-lg font-bold text-forest">Booking Ledger</h2>
        <p className="text-xs text-moss">
          {entries.length} record{entries.length === 1 ? "" : "s"} · latest 300
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Confirmed unit bookings — with or without advance payments — will appear here."
          icon={<BookOpen />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand">
          <div className="max-h-[600px] overflow-y-auto scroll-area-thin">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-cream shadow-[0_1px_0_#e6dfcd]">
                  <TableRow className="border-sand hover:bg-transparent">
                    <TableHead className="text-gold-deep">Unit</TableHead>
                    <TableHead className="text-gold-deep">Project</TableHead>
                    <TableHead className="text-gold-deep">Buyer</TableHead>
                    <TableHead className="text-gold-deep">Price</TableHead>
                    <TableHead className="text-gold-deep">Advance</TableHead>
                    <TableHead className="text-gold-deep">Status</TableHead>
                    <TableHead className="text-right text-gold-deep">Booked on</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="border-sand">
                      <TableCell className="font-semibold text-forest">
                        {entry.unitNumber ?? "—"}
                        <span className="block text-[11px] font-normal text-moss">{entry.tower ?? "—"}</span>
                      </TableCell>
                      <TableCell className="max-w-44 truncate text-sm text-moss">{entry.projectName ?? "—"}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-forest">{entry.buyerName}</p>
                          <p className="truncate text-[11px] text-moss">{entry.buyerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-forest">{entry.priceLabel ?? "—"}</TableCell>
                      <TableCell>
                        {entry.advance ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-semibold text-forest">
                              ₹{entry.advance.amount.toLocaleString("en-IN")}
                            </span>
                            <ProviderBadge provider={entry.advance.provider} />
                          </div>
                        ) : (
                          <span className="text-sm text-moss/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-moss">{fmtDateFull(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
