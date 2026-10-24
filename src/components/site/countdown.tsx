"use client";

import { useEffect, useState } from "react";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parsePossession(possession: string | null): Date | null {
  if (!possession) return null;
  const lower = possession.toLowerCase();
  // "Dec 2026" / "Jun 2027" style
  const m = lower.match(/^([a-z]{3})\s+(\d{4})$/);
  if (m && MONTHS[m[1]] !== undefined) {
    return new Date(Number(m[2]), MONTHS[m[1]] + 1, 0, 23, 59, 59);
  }
  // "2028 (Tentative)" style — default to end of year
  const y = lower.match(/^(\d{4})/);
  if (y) return new Date(Number(y[1]), 11, 31, 23, 59, 59);
  return null;
}

interface CountdownProps {
  target: Date;
}

export function Countdown({ target }: CountdownProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // setTimeout keeps the first client sync async (hydration-safe, no direct setState in effect)
    const kickoff = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, []);

  const diff = now ? Math.max(0, target.getTime() - now.getTime()) : null;
  const days = diff !== null ? Math.floor(diff / 86400000) : null;
  const hours = diff !== null ? Math.floor((diff % 86400000) / 3600000) : null;
  const minutes = diff !== null ? Math.floor((diff % 3600000) / 60000) : null;
  const seconds = diff !== null ? Math.floor((diff % 60000) / 1000) : null;

  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {units.map((u) => (
        <div key={u.label} className="rounded-lg bg-forest-deep/60 border border-gold/25 px-2 py-2.5 text-center">
          <div className="font-display text-2xl sm:text-3xl font-bold text-gold tabular-nums leading-none">
            {u.value === null ? "--" : String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-sage/70 mt-1.5">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
