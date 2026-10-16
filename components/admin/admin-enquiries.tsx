"use client";

/**
 * Enquiries — lead inbox with inline status Select (new / contacted /
 * qualified / confirmed), expandable messages and delete.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, Phone, Mail, MapPin, ChevronDown, ChevronUp, Wallet } from "lucide-react";
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
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AdminCard,
  AdminEnquiry,
  ConfirmAction,
  EmptyState,
  ErrorNote,
  TableSkeleton,
  api,
  fmtDateFull,
  toastApiError,
} from "./admin-shared";

const ENQUIRY_STATUSES = ["new", "contacted", "qualified", "confirmed"] as const;

const STATUS_DOT: Record<string, string> = {
  new: "bg-brick",
  contacted: "bg-gold-deep",
  qualified: "bg-pine",
  confirmed: "bg-leaf",
};

interface EnquiriesSectionProps {
  onDataChanged: () => void;
}

export function EnquiriesSection({ onDataChanged }: EnquiriesSectionProps) {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ enquiries: AdminEnquiry[] }>("/api/admin/enquiries");
      setEnquiries(res.enquiries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(enquiry: AdminEnquiry, status: string) {
    if (status === enquiry.status) return;
    const previous = enquiry.status;
    setEnquiries((list) => list?.map((e) => (e.id === enquiry.id ? { ...e, status } : e)) ?? null);
    setUpdatingId(enquiry.id);
    try {
      await api(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: "Lead updated", description: `${enquiry.name} → ${status}` });
      onDataChanged();
    } catch (err) {
      setEnquiries((list) => list?.map((e) => (e.id === enquiry.id ? { ...e, status: previous } : e)) ?? null);
      toastApiError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(enquiry: AdminEnquiry) {
    await api(`/api/admin/enquiries/${enquiry.id}`, { method: "DELETE" });
    toast({ title: "Enquiry deleted" });
    await load();
    onDataChanged();
  }

  if (error) return <ErrorNote message={error} />;
  if (!enquiries) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-moss">
        {enquiries.length} lead{enquiries.length === 1 ? "" : "s"} · latest 300 · tap a message to expand
      </p>

      {enquiries.length === 0 ? (
        <EmptyState
          title="No enquiries yet"
          description="Leads from the hero, contact and project forms will land here."
          icon={<MessageSquare />}
        />
      ) : (
        <AdminCard className="p-0 sm:p-0 overflow-hidden">
          <div className="max-h-[620px] overflow-y-auto scroll-area-thin">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-cream shadow-[0_1px_0_#e6dfcd]">
                  <TableRow className="border-sand hover:bg-transparent">
                    <TableHead className="text-gold-deep min-w-40">Lead</TableHead>
                    <TableHead className="text-gold-deep min-w-32">Contact</TableHead>
                    <TableHead className="text-gold-deep min-w-36">Project / Budget</TableHead>
                    <TableHead className="text-gold-deep min-w-56">Message</TableHead>
                    <TableHead className="text-gold-deep min-w-36">Status</TableHead>
                    <TableHead className="text-gold-deep">Date</TableHead>
                    <TableHead className="text-right text-gold-deep">Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((enquiry) => {
                    const expanded = expandedId === enquiry.id;
                    return (
                      <TableRow key={enquiry.id} className="border-sand align-top">
                        <TableCell>
                          <p className="font-semibold text-forest">{enquiry.name}</p>
                          {enquiry.source && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-moss/70">
                              via {enquiry.source}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <a
                              href={`tel:${enquiry.phone.replace(/\s+/g, "")}`}
                              className="flex items-center gap-1.5 text-sm text-forest hover:text-gold-deep hover:underline"
                            >
                              <Phone className="size-3.5 shrink-0 text-gold-deep" />
                              {enquiry.phone}
                            </a>
                            {enquiry.email && (
                              <a
                                href={`mailto:${enquiry.email}`}
                                className="flex items-center gap-1.5 text-xs text-moss hover:underline"
                              >
                                <Mail className="size-3.5 shrink-0 text-moss/60" />
                                <span className="max-w-40 truncate">{enquiry.email}</span>
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {enquiry.project ? (
                              <p className="flex items-center gap-1.5 text-xs text-forest">
                                <MapPin className="size-3.5 shrink-0 text-gold-deep" />
                                <span className="max-w-36 truncate">{enquiry.project}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-moss/50">General</p>
                            )}
                            {enquiry.budget && (
                              <p className="flex items-center gap-1.5 text-xs text-moss">
                                <Wallet className="size-3.5 shrink-0 text-moss/60" />
                                {enquiry.budget}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-72">
                          {enquiry.message ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : enquiry.id)}
                              title={enquiry.message}
                              className="group text-left"
                              aria-expanded={expanded}
                            >
                              <p
                                className={cn(
                                  "text-xs leading-relaxed text-moss group-hover:text-forest",
                                  !expanded && "line-clamp-2"
                                )}
                              >
                                {enquiry.message}
                              </p>
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gold-deep">
                                {expanded ? (
                                  <>
                                    <ChevronUp className="size-3" /> Collapse
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="size-3" /> Expand
                                  </>
                                )}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-moss/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={enquiry.status}
                              onValueChange={(value) => void updateStatus(enquiry, value)}
                            >
                              <SelectTrigger
                                className="h-8 w-[128px] bg-white text-xs capitalize"
                                aria-label={`Status for ${enquiry.name}`}
                                disabled={updatingId === enquiry.id}
                              >
                                <span className="flex items-center gap-2 capitalize">
                                  <span
                                    className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[enquiry.status] ?? "bg-moss")}
                                    aria-hidden="true"
                                  />
                                  {enquiry.status}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {ENQUIRY_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status} className="capitalize">
                                    <span className="flex items-center gap-2 capitalize">
                                      <span className={cn("size-2 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
                                      {status}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingId === enquiry.id && <Loader2 className="size-3.5 animate-spin text-gold-deep" />}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-moss">
                          {fmtDateFull(enquiry.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ConfirmAction
                            triggerLabel="Delete"
                            triggerTitle={`Delete enquiry from ${enquiry.name}`}
                            title={`Delete enquiry from ${enquiry.name}?`}
                            description="The lead record is removed permanently."
                            confirmLabel="Delete Lead"
                            busyLabel="Deleting…"
                            onConfirm={() => handleDelete(enquiry)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
