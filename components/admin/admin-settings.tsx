"use client";

/**
 * Settings — advance booking amount, Razorpay keys, admin login email
 * and password.
 * (Secret values are never logged.)
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Eye, EyeOff, IndianRupee, KeyRound, Info, ShieldAlert, BadgeCheck, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AdminCard, AdminSettings, ErrorNote, TableSkeleton, api, toastApiError } from "./admin-shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SettingsSectionProps {
  onDataChanged: () => void;
}

export function SettingsSection({ onDataChanged }: SettingsSectionProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [advanceAmount, setAdvanceAmount] = useState("500");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ settings: AdminSettings }>("/api/admin/settings");
      setSettings(res.settings);
      setAdvanceAmount(String(res.settings.advanceAmount));
      setRazorpayKeyId(res.settings.razorpayKeyId);
      setRazorpayKeySecret(res.settings.razorpayKeySecret);
      setAdminEmail(res.settings.adminEmail);
      setAdminPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (saving) return;
    const amount = Math.round(Number(advanceAmount));
    if (!Number.isFinite(amount) || amount < 1) {
      toast({ title: "Invalid advance amount", description: "Enter a whole number of rupees (at least ₹1).", variant: "destructive" });
      return;
    }
    if (adminPassword && adminPassword.length < 6) {
      toast({ title: "Password too short", description: "The new admin password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    const email = adminEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast({ title: "Invalid admin email", description: "Enter a valid email address for the admin login.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        advanceAmount: amount,
        razorpayKeyId: razorpayKeyId.trim(),
        razorpayKeySecret: razorpayKeySecret.trim(),
        adminEmail: email,
      };
      if (adminPassword) payload.adminPassword = adminPassword;
      await api<{ settings: AdminSettings }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast({ title: "Settings saved", description: adminPassword ? "Password updated — other sessions signed out." : "Console settings are live." });
      onDataChanged();
      await load();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <TableSkeleton rows={4} />;
  if (error) return <ErrorNote message={error} />;
  if (!settings) return null;

  const razorpayActive = razorpayKeyId.trim().length > 0 && razorpayKeySecret.trim().length > 0;

  return (
    <div className="max-w-2xl space-y-5">
      <AdminCard className="space-y-6">
        {/* Advance amount */}
        <div className="space-y-2">
          <Label htmlFor="s-advance" className="flex items-center gap-2 text-forest">
            <IndianRupee className="size-4 text-gold-deep" /> Advance Booking Amount
          </Label>
          <div className="relative max-w-48">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gold-deep">₹</span>
            <Input
              id="s-advance"
              type="number"
              min={1}
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="bg-white pl-7"
            />
          </div>
          <p className="text-xs text-moss/80">Charged to buyers as the online booking advance.</p>
        </div>

        <span className="gold-hairline block" aria-hidden="true" />

        {/* Razorpay */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-key-id" className="flex items-center gap-2 text-forest">
              <KeyRound className="size-4 text-gold-deep" /> Razorpay Key ID
            </Label>
            <Input
              id="s-key-id"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              placeholder="rzp_live_… (leave empty for demo mode)"
              className="bg-white font-mono text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-key-secret" className="flex items-center gap-2 text-forest">
              <Lock className="size-4 text-gold-deep" /> Razorpay Key Secret
            </Label>
            <div className="relative">
              <Input
                id="s-key-secret"
                type={showSecret ? "text" : "password"}
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                placeholder="•••••••• (leave empty for demo mode)"
                className="bg-white pr-10 font-mono text-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-moss transition-colors hover:bg-sand hover:text-forest"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
              razorpayActive
                ? "border-leaf/40 bg-leaf/10 text-pine"
                : "border-gold/50 bg-gold/10 text-gold-deep"
            )}
            role="status"
          >
            {razorpayActive ? <BadgeCheck className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0" />}
            <p>
              {razorpayActive
                ? "Razorpay checkout is ACTIVE — real advances are collected on your Razorpay account."
                : "Payments currently run in secure demo mode — add Razorpay keys to accept real payments."}
            </p>
          </div>
          <p className="text-xs text-moss/80">
            Both fields must be set together. Clearing both switches back to demo mode.
          </p>
        </div>

        <span className="gold-hairline block" aria-hidden="true" />

        {/* Admin login email */}
        <div className="space-y-2">
          <Label htmlFor="s-admin-email" className="flex items-center gap-2 text-forest">
            <Mail className="size-4 text-gold-deep" /> Admin Login Email
          </Label>
          <Input
            id="s-admin-email"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="name@example.com"
            className="max-w-72 bg-white"
            autoComplete="off"
          />
          <p className="text-xs text-moss/80">
            Only this email (with the password) can open the admin console.
          </p>
        </div>

        <span className="gold-hairline block" aria-hidden="true" />

        {/* Admin password */}
        <div className="space-y-2">
          <Label htmlFor="s-password" className="flex items-center gap-2 text-forest">
            <ShieldAlert className="size-4 text-gold-deep" /> New Admin Password
            <span className="font-normal text-moss">(optional)</span>
          </Label>
          <Input
            id="s-password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Leave empty to keep the current password"
            className="max-w-72 bg-white"
            autoComplete="new-password"
          />
          <p className="text-xs text-moss/80">
            Minimum 6 characters. Changing the password signs out all other admin sessions.
          </p>
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-forest px-6 text-cream hover:bg-pine"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
