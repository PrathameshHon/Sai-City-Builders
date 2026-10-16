import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center", light = false, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase",
          light ? "text-gold" : "text-gold-deep"
        )}
      >
        <span className={cn("h-px w-8", light ? "bg-gold/60" : "bg-gold-deep/50")} aria-hidden="true" />
        {eyebrow}
        {align === "center" && <span className={cn("h-px w-8", light ? "bg-gold/60" : "bg-gold-deep/50")} aria-hidden="true" />}
      </span>
      <h2
        className={cn(
          "font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight mt-4",
          light ? "text-cream" : "text-forest"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-4 max-w-2xl text-base sm:text-lg leading-relaxed", align === "center" && "mx-auto", light ? "text-sage/80" : "text-moss")}>
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
