import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

interface Puff { x: number; y: number; z: number; s: number; op: number; drift: number; }

/**
 * Lumpy cumulus silhouette painted from several overlapping soft blobs —
 * no external assets, richer than a single radial gradient.
 */
function usePuffTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d")!;
    const blob = (cx: number, cy: number, r: number, alpha: number) => {
      const grad = g.createRadialGradient(cx, cy, r * 0.12, cx, cy, r);
      grad.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`);
      grad.addColorStop(0.45, `rgba(252,250,244,${0.55 * alpha})`);
      grad.addColorStop(0.75, `rgba(247,246,241,${0.18 * alpha})`);
      grad.addColorStop(1, "rgba(245,245,240,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    };
    blob(70, 88, 58, 1);
    blob(108, 82, 42, 0.9);
    blob(44, 78, 38, 0.85);
    blob(86, 104, 33, 0.9);
    blob(126, 92, 26, 0.8);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/**
 * Drifting cloud field:
 *  • a ring of cumulus around the site — visible from the opening aerial shot,
 *  • two tight clusters crossing the descent path so the camera punches
 *    through the deck as it dives from the sky toward the street,
 *  • distant flat wisps near the horizon.
 */
export function Clouds() {
  const tex = usePuffTexture();
  const puffs = useMemo(() => {
    const r = rng(11);
    const out: Puff[] = [];
    const cluster = (cx: number, cy: number, cz: number, spread: number, size: number, op = 0.55) => {
      const n = 4 + Math.floor(r() * 4);
      for (let j = 0; j < n; j++) {
        out.push({
          x: cx + (r() - 0.5) * spread,
          y: cy + (r() - 0.5) * spread * 0.3,
          z: cz + (r() - 0.5) * spread * 0.6,
          s: size * (0.7 + r() * 0.7),
          op: op + r() * 0.4,
          drift: 0.4 + r() * 1.1,
        });
      }
    };
    // Opening-shot deck — floating directly over the towers, dead-centre in the
    // first frame's view axis (camera 46,62,74 -> building).
    cluster(32, 47, 52, 15, 15, 0.6);
    cluster(24, 40, 44, 13, 13, 0.6);
    cluster(38, 53, 59, 12, 12, 0.55);
    // Punch-through decks — sitting ON the dive path, so the camera flies
    // straight through them early in the descent (p ≈ 0.05 and 0.09).
    cluster(36, 43, 68, 14, 14, 0.7);
    cluster(28, 27, 63, 12, 12, 0.7);
    // Ring of cumulus high around the site — reads as sky clouds from the
    // street, facade and sky-deck shots.
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + r() * 0.25;
      const rad = 95 + r() * 65;
      cluster(Math.cos(ang) * rad, 58 + r() * 26, Math.sin(ang) * rad - 25, 24, 20);
    }
    // Distant horizon wisps — flat and wide.
    for (let i = 0; i < 7; i++) cluster(-220 + r() * 440, 62 + r() * 26, -240 - r() * 90, 42, 30, 0.4);
    return out;
  }, []);

  const refs = useRef<(THREE.Sprite | null)[]>([]);

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    refs.current.forEach((sp, i) => {
      const p = puffs[i];
      if (!sp || !p) return;
      sp.position.x += step * p.drift;
      if (sp.position.x > 200) sp.position.x = -200;
    });
  });

  return (
    <group>
      {puffs.map((p, i) => (
        <sprite
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[p.x, p.y, p.z]}
          scale={[p.s, p.s * 0.42, 1]}
        >
          <spriteMaterial map={tex} transparent opacity={p.op} depthWrite={false} color="#FFFDF7" />
        </sprite>
      ))}
    </group>
  );
}
