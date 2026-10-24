"use client";

/**
 * Overview — royal stat cards, recent advance payments, recent enquiries
 * and quick actions into the busy corners of the console.
 */

import {
  Building2,
  Home,
  MessageSquare,
  Star,
  Images,
  IndianRupee,
  Plus,
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { AdminStats, AdminTab } from "./admin-shared";
import {
  AdminCard,
  EmptyState,
  EnquiryStatusBadge,
  ErrorNote,
  OrderStatusBadge,
  ProviderBadge,
  StatCard,
  TableSkeleton,
  fmtDate,
  inr,
} from "./admin-shared";

interface OverviewSectionProps {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  onNavigate: (tab: AdminTab) => void;
  onAddProject: () => void;
}

export function OverviewSection({ stats, loading, error, onNavigate, onAddProject }: OverviewSectionProps) {
  const s = stats?.stats;
  const soldPct = s && s.flats.total > 0 ? Math.round((s.flats.sold / s.flats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {error && <ErrorNote message={error} />}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && !stats ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : s ? (
          <>
            <StatCard
              icon={<Building2 />}
              value={s.projects}
              label="Projects"
              sub="Ongoing, completed & upcoming"
            />
            <StatCard
              icon={<Home />}
              value={`${s.flats.sold}/${s.flats.total}`}
              label="Units Sold"
              sub={`${soldPct}% claimed · ${s.flats.available.toLocaleString("en-IN")} available · ${s.flats.locked} held`}
            >
              <Progress value={soldPct} className="h-1.5 bg-white/15 [&>div]:bg-gold" aria-label={`${soldPct}% of units sold`} />
            </StatCard>
            <StatCard
              icon={<MessageSquare />}
              value={s.enquiries.total}
              label="Enquiries"
              alert={s.enquiries.new}
              sub={
                s.enquiries.new > 0 ? (
                  <span className="text-gold-light">
                    {s.enquiries.new} new lead{s.enquiries.new === 1 ? "" : "s"} awaiting follow-up
                  </span>
                ) : (
                  "All leads attended to"
                )
              }
            />
            <StatCard
              icon={<Star />}
              value={s.reviews.total}
              label="Reviews"
              alert={s.reviews.pending}
              sub={`${s.reviews.approved} live · ${s.reviews.pending} pending approval`}
            />
            <StatCard
              icon={<Images />}
              value={s.albums.total}
              label="Albums"
              alert={s.albums.pending}
              sub={`${s.albums.approved} approved · ${s.albums.pending} pending`}
            />
            <StatCard
              icon={<IndianRupee />}
              value={inr(s.orders.revenue)}
              label="Advance Collected"
              sub={`${s.orders.paid} paid order${s.orders.paid === 1 ? "" : "s"} · ${s.orders.total} total`}
            />
          </>
        ) : null}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onAddProject}
          className="bg-forest text-cream hover:bg-pine"
        >
          <Plus className="size-4" /> Add Project
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("reviews")}
          className="border-gold/50 text-gold-deep hover:bg-gold/10 hover:text-gold-deep"
        >
          <Star className="size-4" /> Moderate Reviews{s && s.reviews.pending > 0 ? ` (${s.reviews.pending})` : ""}
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate("settings")}
          className="border-forest/30 text-forest hover:bg-forest/5"
        >
          <CreditCard className="size-4" /> Payment Settings
        </Button>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 xl:grid-cols-5">
        <AdminCard className="xl:col-span-3">
          <h2 className="font-display text-lg font-bold text-forest">Recent Advance Payments</h2>
          <p className="mt-0.5 text-xs text-moss">Latest booking orders across the township.</p>
          <div className="mt-4">
            {loading && !stats ? (
              <TableSkeleton rows={4} />
            ) : stats && stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-sand hover:bg-transparent">
                      <TableHead className="text-gold-deep">Order</TableHead>
                      <TableHead className="text-gold-deep">Buyer</TableHead>
                      <TableHead className="text-gold-deep">Unit</TableHead>
                      <TableHead className="text-gold-deep">Amount</TableHead>
                      <TableHead className="text-gold-deep">Provider</TableHead>
                      <TableHead className="text-gold-deep">Status</TableHead>
                      <TableHead className="text-right text-gold-deep">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.map((order) => (
                      <TableRow key={order.orderNumber} className="border-sand">
                        <TableCell className="font-mono text-xs text-forest">{order.orderNumber}</TableCell>
                        <TableCell className="text-sm text-forest">{order.buyerName}</TableCell>
                        <TableCell className="text-xs text-moss">
                          {order.unitNumber ? (
                            <span>
                              <span className="font-semibold text-forest">{order.unitNumber}</span>
                              {order.projectName ? ` · ${order.projectName}` : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-forest">{inr(order.amount)}</TableCell>
                        <TableCell>
                          <ProviderBadge provider={order.provider} />
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-moss">{fmtDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No advance payments yet"
                description="Buyer booking orders will appear here as soon as the first advance is collected."
                icon={<IndianRupee />}
              />
            )}
          </div>
        </AdminCard>

        <AdminCard className="xl:col-span-2">
          <h2 className="font-display text-lg font-bold text-forest">Recent Enquiries</h2>
          <p className="mt-0.5 text-xs text-moss">Latest leads from the public site.</p>
          <div className="mt-4">
            {loading && !stats ? (
              <TableSkeleton rows={4} />
            ) : stats && stats.recentEnquiries.length > 0 ? (
              <ul className="max-h-[420px] space-y-3 overflow-y-auto scroll-area-thin pr-1">
                {stats.recentEnquiries.map((enquiry) => (
                  <li
                    key={enquiry.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-sand bg-cream/60 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-forest">{enquiry.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-moss">
                        <Phone className="size-3 shrink-0" />
                        <span className="truncate">{enquiry.phone}</span>
                      </p>
                      {enquiry.project && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-moss/80">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{enquiry.project}</span>
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-moss/70">{fmtDate(enquiry.createdAt)}</p>
                    </div>
                    <EnquiryStatusBadge status={enquiry.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No enquiries yet"
                description="Leads submitted from the contact and hero forms will show up here."
                icon={<MessageSquare />}
              />
            )}
          </div>
        </AdminCard>
      </div>

      <p className="flex items-center gap-2 text-xs text-moss/80">
        <ShieldCheck className="size-3.5 text-gold-deep" />
        Session secured with an httpOnly cookie · data refreshes each time you return to this tab.
      </p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="royal-panel animate-pulse rounded-2xl p-5" aria-hidden="true">
      <div className="h-3 w-24 rounded bg-white/20" />
      <div className="mt-4 h-8 w-16 rounded bg-white/15" />
      <div className="mt-3 h-2.5 w-32 rounded bg-white/10" />
    </div>
  );
}
