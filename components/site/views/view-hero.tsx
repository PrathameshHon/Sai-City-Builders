"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useSiteNav } from "../site-context";

interface ViewHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function ViewHero({ eyebrow, title, description }: ViewHeroProps) {
  const { navigate } = useSiteNav();

  return (
    <section className="relative royal-panel overflow-hidden" aria-label="Page header">
      <div className="absolute inset-0 pattern-dots opacity-40" aria-hidden="true" />
      <div className="absolute -top-32 right-[-8rem] h-96 w-96 rounded-full bg-gold/12 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 left-[-6rem] h-96 w-96 rounded-full bg-leaf/15 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 gold-hairline" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-20 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <nav className="flex items-center gap-1.5 text-xs text-sage/60" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="hover:text-gold transition-colors font-semibold"
            >
              Home
            </button>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span className="text-gold font-semibold tracking-wide uppercase">{eyebrow}</span>
          </nav>

          <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-cream leading-[1.08]">
            {title}
          </h1>
          <div className="mt-5 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold-light/0" aria-hidden="true" />
          {description && (
            <p className="mt-5 text-base sm:text-lg text-sage/80 leading-relaxed max-w-2xl">{description}</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
