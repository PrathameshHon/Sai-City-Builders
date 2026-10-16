import { Phone, Mail, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/site";

export function TopBar() {
  return (
    <div className="hidden md:block bg-forest-deep text-sage/90 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
        <div className="flex items-center gap-5">
          <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-1.5 hover:text-gold transition-colors">
            <Phone className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span className="tracking-wide">{SITE.phone}</span>
          </a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 hover:text-gold transition-colors">
            <Mail className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span className="tracking-wide">{SITE.email}</span>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span className="tracking-wide">
            MahaRERA: {SITE.reraNumbers.join(" | ")} ·{" "}
            <a href={SITE.reraWebsite} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold transition-colors">
              maharera.maharashtra.gov.in
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
