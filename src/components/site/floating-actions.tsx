"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowUp } from "lucide-react";
import { SITE } from "@/lib/site";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="back-to-top"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-gold shadow-lg hover:bg-pine transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello! I'm interested in Sai Green Woods / Sai Towers by Sai City Builders. Please share details.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1faa53] text-white shadow-[0_12px_28px_-8px_rgba(31,170,83,0.6)] hover:scale-105 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 fill-white/20" aria-hidden="true" />
      </a>
    </div>
  );
}
