"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, XCircle, Info, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { loadRazorpay } from "@/lib/razorpay-checkout";
import { formatLakhs, type BookingUnit } from "@/lib/booking-shared";
import type { PaymentInitiateResponse, PaymentConfirmResponse } from "@/lib/types";

type Stage = "form" | "processing" | "demo-gateway" | "razorpay-waiting" | "success" | "error";

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentDialogProps {
  open: boolean;
  unit: BookingUnit | null;
  session: string;
  settings: { advanceAmount: number; razorpayConfigured: boolean };
  onClose: () => void;
  onSuccess: () => void;
}

/** Advance-payment booking dialog: form → initiate → (demo gateway | Razorpay) → success. */
export function PaymentDialog({ open, unit, session, settings, onClose, onSuccess }: PaymentDialogProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState<PaymentConfirmResponse | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [confirming, setConfirming] = useState(false);

  const timerRef = useRef<number | null>(null);
  // clear any pending demo-gateway animation when unmounting
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    []
  );

  // fresh payment flow every time the dialog opens (buyer details are kept)
  useEffect(() => {
    if (open) {
      setStage("form");
      setError(null);
      setConfirm(null);
      setDemoProgress(0);
      setConfirming(false);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  const canClose = stage === "form" || stage === "success" || stage === "error";
  const advance = settings.advanceAmount;

  function guardClose() {
    if (canClose) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unit) return;

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const cleanEmail = email.trim();
    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^(\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setStage("processing");
    try {
      const res = await fetch("/api/bookings/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatId: unit.id,
          sessionId: session,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
        }),
      });
      const data: (PaymentInitiateResponse & { error?: string }) | { error?: string } = await res.json();
      if (!res.ok) {
        const message = (data as { error?: string }).error ?? "Could not start the booking.";
        toast({ title: "Booking not started", description: message, variant: "destructive" });
        if (res.status === 409) {
          // unit sold / held by someone else — nothing more to do here
          guardCloseForced();
          return;
        }
        setStage("form");
        setError(message);
        return;
      }

      const initiate = data as PaymentInitiateResponse;
      if (initiate.message) {
        toast({ title: "Payment note", description: initiate.message });
      }

      if (initiate.provider === "demo") {
        runDemoGateway(initiate);
      } else if (initiate.razorpay) {
        await runRazorpayCheckout(initiate, cleanName, cleanPhone, cleanEmail);
      } else {
        setStage("form");
        setError("Payment gateway could not be initialised. Please try again.");
      }
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
      setStage("form");
    }
  }

  function guardCloseForced() {
    setStage("form");
    onClose();
  }

  function runDemoGateway(initiate: PaymentInitiateResponse) {
    setStage("demo-gateway");
    setDemoProgress(0);
    setConfirming(false);
    const duration = 2000; // ms
    const start = Date.now();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setDemoProgress(pct);
      if (pct >= 100) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setConfirming(true);
        void confirmDemoOrder(initiate.orderNumber);
      }
    }, 80);
  }

  async function confirmDemoOrder(orderNumber: string) {
    try {
      const res = await fetch("/api/bookings/demo-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const data: (PaymentConfirmResponse & { error?: string }) | { error?: string } = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Payment could not be confirmed.");
      setConfirm(data as PaymentConfirmResponse);
      setStage("success");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Payment could not be confirmed.");
    } finally {
      setConfirming(false);
    }
  }

  async function runRazorpayCheckout(initiate: PaymentInitiateResponse, buyerName: string, buyerPhone: string, buyerEmail: string) {
    if (!unit || !initiate.razorpay) return;
    const ready = await loadRazorpay();
    if (!ready || !window.Razorpay || !initiate.razorpay) {
      toast({
        title: "Could not reach Razorpay",
        description: "Please try again.",
        variant: "destructive",
      });
      setStage("form");
      return;
    }

    setStage("razorpay-waiting");
    const rzp = new window.Razorpay({
      key: initiate.razorpay.keyId,
      order_id: initiate.razorpay.orderId,
      amount: initiate.razorpay.amount,
      currency: "INR",
      name: "Sai Towers",
      description: `Advance — Unit ${unit.unitNumber}`,
      prefill: { name: buyerName, contact: buyerPhone, email: buyerEmail || undefined },
      theme: { color: "#0b3d2e" },
      handler: (response: RazorpaySuccessResponse) => {
        void verifyRazorpayPayment(initiate.orderNumber, response);
      },
      modal: {
        ondismiss: () => {
          setStage("form");
          toast({
            title: "Payment cancelled",
            description: "Your hold is still active.",
          });
        },
      },
    });
    rzp.open();
  }

  async function verifyRazorpayPayment(orderNumber: string, response: RazorpaySuccessResponse) {
    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const data: (PaymentConfirmResponse & { error?: string }) | { error?: string } = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Payment verification failed.");
      setConfirm(data as PaymentConfirmResponse);
      setStage("success");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Payment verification failed.");
    }
  }

  const unitLine = unit ? `${unit.unitNumber} · ${unit.unitType} · ${formatLakhs(unit.priceLakhs)}` : "";
  const confirmedUnit = confirm ? `${confirm.unit.unitNumber} · ${confirm.unit.project}` : "";

  return (
    <Dialog open={open && !!unit} onOpenChange={(o) => !o && guardClose()}>
      <DialogContent
        className="max-w-md w-[94vw] bg-cream rounded-3xl border-gold/30 p-0 overflow-hidden"
        showCloseButton={canClose}
      >
        <div className="bg-forest px-6 py-5">
          <DialogTitle className="font-display text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gold" aria-hidden="true" />
            Confirm Your Booking
          </DialogTitle>
          <DialogDescription className="text-sage/75 text-sm mt-1">{unitLine}</DialogDescription>
        </div>

        {stage === "form" && (
          <form className="p-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Advance summary */}
            <div className="rounded-2xl bg-sand border border-gold/30 px-4 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] uppercase tracking-widest text-moss font-bold">
                  Advance payable now
                </span>
                <span className="font-display text-3xl font-bold text-gold-deep">
                  ₹{advance.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-moss leading-relaxed">
                Balance at documentation — our team will call you.
              </p>
            </div>

            {/* Provider strip */}
            {settings.razorpayConfigured ? (
              <div className="flex items-center gap-2 rounded-xl bg-leaf/10 border border-leaf/30 px-4 py-2.5 text-xs font-semibold text-pine">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                100% secure via Razorpay
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-sage border border-pine/20 px-4 py-2.5 text-xs text-moss leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-leaf" aria-hidden="true" />
                <span>
                  Demo payment gateway — Razorpay keys not configured yet. Your booking still
                  completes instantly.
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-brick bg-brick/10 border border-brick/25 rounded-xl px-4 py-2.5" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pay-name" className="text-forest text-sm font-medium">
                Full Name <span className="text-brick">*</span>
              </Label>
              <Input
                id="pay-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name as per ID"
                className="h-11 rounded-xl focus-visible:ring-gold"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-phone" className="text-forest text-sm font-medium">
                Phone Number <span className="text-brick">*</span>
              </Label>
              <Input
                id="pay-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                required
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
                placeholder="98XXX XXXXX"
                className="h-11 rounded-xl focus-visible:ring-gold"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-email" className="text-forest text-sm font-medium">
                Email (optional)
              </Label>
              <Input
                id="pay-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-xl focus-visible:ring-gold"
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              disabled={stage !== "form"}
              className="w-full h-12 bg-pine hover:bg-leaf text-white font-bold rounded-xl"
            >
              <CheckCircle2 className="h-5 w-5" />
              Pay ₹{advance.toLocaleString("en-IN")} Advance &amp; Book
            </Button>
            <p className="text-[11px] text-moss leading-relaxed text-center">
              By booking you agree to be contacted by our sales team. Unit availability is
              server-verified — double-booking is impossible.
            </p>
          </form>
        )}

        {stage === "processing" && (
          <div className="p-8 flex flex-col items-center text-center gap-4" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-pine" aria-hidden="true" />
            <p className="font-display text-lg font-bold text-forest">Creating your booking order…</p>
            <p className="text-sm text-moss">Reserving Unit {unit?.unitNumber} and preparing the payment.</p>
          </div>
        )}

        {stage === "demo-gateway" && (
          <div className="p-8 flex flex-col items-center text-center gap-4" aria-live="polite">
            <div className="rounded-2xl bg-forest px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="font-display font-bold text-cream text-sm tracking-wide">
                Sai Secure Gateway · DEMO MODE
              </span>
            </div>
            <p className="text-sm text-moss">
              {confirming ? "Confirming your booking…" : `Processing ₹${advance.toLocaleString("en-IN")}…`}
            </p>
            <Progress
              value={demoProgress}
              className="h-3 w-full max-w-xs bg-sage [&>div]:bg-gradient-to-r [&>div]:from-gold [&>div]:to-gold-light"
            />
            {confirming && <Loader2 className="h-5 w-5 animate-spin text-pine" aria-hidden="true" />}
          </div>
        )}

        {stage === "razorpay-waiting" && (
          <div className="p-8 flex flex-col items-center text-center gap-4" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-pine" aria-hidden="true" />
            <p className="font-display text-lg font-bold text-forest">Waiting for payment…</p>
            <p className="text-sm text-moss leading-relaxed">
              Complete the payment in the Razorpay window that just opened. Please keep this
              dialog open.
            </p>
          </div>
        )}

        {stage === "error" && (
          <div className="p-8 flex flex-col items-center text-center gap-4" role="alert">
            <XCircle className="h-10 w-10 text-brick" aria-hidden="true" />
            <p className="font-display text-lg font-bold text-forest">Payment not completed</p>
            <p className="text-sm text-moss leading-relaxed max-w-xs">{error ?? "Something went wrong."}</p>
            <Button
              type="button"
              onClick={() => {
                setStage("form");
                setError(null);
              }}
              className="h-11 rounded-xl bg-pine hover:bg-leaf text-white font-bold px-8"
            >
              Back to form
            </Button>
          </div>
        )}

        {stage === "success" && confirm && (
          <div className="p-8 flex flex-col items-center text-center gap-4" aria-live="polite">
            <CheckCircle2 className="h-14 w-14 text-gold" aria-hidden="true" />
            <p className="font-display text-2xl font-bold text-forest">Booking Confirmed!</p>
            <p className="text-sm font-semibold text-pine">{confirmedUnit}</p>
            <span className="font-mono text-xs font-bold text-pine bg-sage rounded-full px-4 py-1.5">
              Order {confirm.orderNumber}
            </span>
            <p className="text-sm text-moss">
              ₹{confirm.amount.toLocaleString("en-IN")} advance received via{" "}
              {confirm.provider === "demo" ? "Demo gateway" : "Razorpay"}
            </p>
            <p className="text-xs text-moss leading-relaxed max-w-xs">
              Our team will call you within 24 hours for documentation &amp; balance payment.
            </p>
            <Button
              type="button"
              onClick={onSuccess}
              className="h-12 rounded-xl bg-gold hover:bg-gold-deep text-forest font-bold px-10"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
