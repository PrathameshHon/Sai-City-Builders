"use client";

import { useState } from "react";
import { Loader2, BadgeCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SiteProject } from "@/lib/types";

interface EnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: string;
  projects: SiteProject[];
}

export function EnquiryModal({ open, onOpenChange, project, projects }: EnquiryModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<string>(project ?? "General Enquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 10) {
      toast({
        title: "Please check your details",
        description: "Name and a valid 10-digit phone number are required.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          project: interest,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast({
        title: "Enquiry submitted successfully!",
        description: `Thank you ${name.trim().split(" ")[0]}! Our team will call you back within 24 hours.`,
      });
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not submit enquiry",
        description: err instanceof Error ? err.message : "Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[92vw] bg-cream rounded-3xl border-gold/30 p-0 overflow-hidden">
        <div className="bg-forest px-6 py-5 relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-sage/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-gold" aria-hidden="true" />
            <DialogTitle className="font-display text-xl font-bold text-white">
              Enquire Now
            </DialogTitle>
          </div>
          <DialogDescription className="text-sage/75 text-sm mt-1">
            {project ? `Interested in ${project}` : "Book a site visit or get the price list"}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="modal-name" className="text-forest text-sm font-medium">
              Your Name <span className="text-brick">*</span>
            </Label>
            <Input
              id="modal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="h-11 rounded-xl focus-visible:ring-gold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-phone" className="text-forest text-sm font-medium">
              Phone Number <span className="text-brick">*</span>
            </Label>
            <Input
              id="modal-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ""))}
              placeholder="98XXX XXXXX"
              required
              className="h-11 rounded-xl focus-visible:ring-gold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-email" className="text-forest text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-xl focus-visible:ring-gold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-forest text-sm font-medium">Interested In</Label>
            <Select value={interest} onValueChange={setInterest}>
              <SelectTrigger className="h-11 rounded-xl focus-visible:ring-gold w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Enquiry">General Enquiry</SelectItem>
                <SelectItem value="Site Visit">Site Visit Booking</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.slug} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-message" className="text-forest text-sm font-medium">
              Message (Optional)
            </Label>
            <Textarea
              id="modal-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Budget, preferred plot size, timeline..."
              rows={3}
              className="rounded-xl focus-visible:ring-gold resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-pine hover:bg-leaf text-white font-bold rounded-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              "Submit Enquiry"
            )}
          </Button>

          <p className="text-[11px] text-center text-moss">
            By submitting, you agree to be contacted by our sales team. Your details stay confidential.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
