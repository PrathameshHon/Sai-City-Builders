import * as THREE from "three";

/**
 * A single camera keyframe of the scroll-driven fly-through.
 * Coordinates are meters; `p` is scroll progress in [0, 1].
 */
export interface CameraKey {
  p: number;
  pos: [number, number, number];
  tgt: [number, number, number];
  fov: number;
}

/**
 * Camera journey: wide establishing shot -> approach -> facade close-up ->
 * threshold -> living room -> corridor -> bright opening -> sun-drenched room.
 */
export const CAMERA_KEYS: CameraKey[] = [
  { p: 0.0, pos: [24, 9, 40], tgt: [0, 9, -10], fov: 55 },
  { p: 0.16, pos: [12, 5.2, 27], tgt: [0, 4.5, 4], fov: 52 },
  { p: 0.3, pos: [4.2, 3.3, 17.5], tgt: [0, 3, 8.5], fov: 46 },
  { p: 0.44, pos: [0.6, 2.4, 12.8], tgt: [0, 2.2, 2], fov: 44 },
  { p: 0.58, pos: [0, 1.95, 5.6], tgt: [2.4, 1.8, -3], fov: 50 },
  { p: 0.7, pos: [3.6, 1.78, 2], tgt: [3.6, 1.62, -10], fov: 54 },
  { p: 0.82, pos: [3.6, 1.72, -6], tgt: [1.2, 1.6, -14], fov: 56 },
  { p: 0.94, pos: [-0.6, 1.85, -11.6], tgt: [-2.2, 1.7, -17], fov: 52 },
  { p: 1.0, pos: [-1.3, 1.9, -12.3], tgt: [-2.6, 1.75, -17.5], fov: 50 },
];

/** Hermite smoothstep, clamped to [0, 1]. */
export function smoothstep01(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Samples the camera path at scroll progress `p`.
 * Writes the interpolated camera position and lookAt target into
 * `outPos` / `outTgt` and returns the interpolated vertical fov.
 * Position, target and fov are eased with smoothstep between keyframes.
 */
export function sampleCameraPath(
  p: number,
  outPos: THREE.Vector3,
  outTgt: THREE.Vector3,
): number {
  const keys = CAMERA_KEYS;
  const first = keys[0];
  const last = keys[keys.length - 1];

  if (p <= first.p) {
    outPos.set(first.pos[0], first.pos[1], first.pos[2]);
    outTgt.set(first.tgt[0], first.tgt[1], first.tgt[2]);
    return first.fov;
  }
  if (p >= last.p) {
    outPos.set(last.pos[0], last.pos[1], last.pos[2]);
    outTgt.set(last.tgt[0], last.tgt[1], last.tgt[2]);
    return last.fov;
  }

  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const t = smoothstep01((p - k0.p) / (k1.p - k0.p));

  outPos.set(
    THREE.MathUtils.lerp(k0.pos[0], k1.pos[0], t),
    THREE.MathUtils.lerp(k0.pos[1], k1.pos[1], t),
    THREE.MathUtils.lerp(k0.pos[2], k1.pos[2], t),
  );
  outTgt.set(
    THREE.MathUtils.lerp(k0.tgt[0], k1.tgt[0], t),
    THREE.MathUtils.lerp(k0.tgt[1], k1.tgt[1], t),
    THREE.MathUtils.lerp(k0.tgt[2], k1.tgt[2], t),
  );
  return THREE.MathUtils.lerp(k0.fov, k1.fov, t);
}
