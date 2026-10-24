import * as THREE from "three";

export interface CameraKey { p: number; pos: [number, number, number]; tgt: [number, number, number]; fov: number }

/** Aerial (sky band + cloud deck above the towers) -> street -> podium -> facade climb -> twin wings -> sky deck -> hero. */
export const CAMERA_KEYS: CameraKey[] = [
  { p: 0.0,  pos: [46, 66, 78], tgt: [0, 34, 0],    fov: 50 },
  { p: 0.17, pos: [18, 9, 58],   tgt: [0, 12, 0],    fov: 48 },
  { p: 0.34, pos: [-14, 3.2, 28], tgt: [-4, 5, 8],   fov: 52 },
  { p: 0.5,  pos: [-16, 12, 26], tgt: [-16, 18, 6],  fov: 46 },
  { p: 0.66, pos: [0, 24, 34],   tgt: [0, 22, 0],    fov: 56 },
  { p: 0.82, pos: [26, 36, 24],  tgt: [18, 32, 0],   fov: 50 },
  { p: 1.0,  pos: [-8, 44, 40],  tgt: [0, 28, 0],    fov: 48 },
];

export const smoothstep01 = (t: number) => { const x = THREE.MathUtils.clamp(t, 0, 1); return x * x * (3 - 2 * x); };

export function sampleCameraPath(p: number, outPos: THREE.Vector3, outTgt: THREE.Vector3): number {
  const k = CAMERA_KEYS, a = k[0], z = k[k.length - 1];
  if (p <= a.p) { outPos.set(...a.pos); outTgt.set(...a.tgt); return a.fov; }
  if (p >= z.p) { outPos.set(...z.pos); outTgt.set(...z.tgt); return z.fov; }
  let i = 0;
  while (i < k.length - 2 && p > k[i + 1].p) i++;
  const k0 = k[i], k1 = k[i + 1];
  const t = smoothstep01((p - k0.p) / (k1.p - k0.p));
  outPos.set(...(k0.pos.map((v, n) => THREE.MathUtils.lerp(v, k1.pos[n], t)) as [number, number, number]));
  outTgt.set(...(k0.tgt.map((v, n) => THREE.MathUtils.lerp(v, k1.tgt[n], t)) as [number, number, number]));
  return THREE.MathUtils.lerp(k0.fov, k1.fov, t);
}
