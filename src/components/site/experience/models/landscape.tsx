import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

/* ── Natural palette (matched to the client rendering) ─────────────── */
const LEAF_COLORS = ["#3F6D34", "#4C7C3D", "#35602C"];

function useMats() {
  return useMemo(() => ({
    lawn: new THREE.MeshStandardMaterial({ color: "#71995B", roughness: 1 }),
    verge: new THREE.MeshStandardMaterial({ color: "#679052", roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: "#43464B", roughness: 0.95 }),
    walk: new THREE.MeshStandardMaterial({ color: "#CFC8BB", roughness: 0.9 }),
    line: new THREE.MeshStandardMaterial({ color: "#D9B93E", roughness: 0.8 }),
    dash: new THREE.MeshStandardMaterial({ color: "#ECECEA", roughness: 0.8 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#5A4632", roughness: 0.95 }),
    leaf: LEAF_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 })),
    palm: new THREE.MeshStandardMaterial({ color: "#3E8E41", roughness: 0.9 }),
    pot: new THREE.MeshStandardMaterial({ color: "#8A5A44", roughness: 0.85 }),
  }), []);
}

/* ── Realistic car: body, cabin, window band, wheels ───────────────── */
function Car({ color }: { color: string }) {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.55 }), [color]);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1E242B", roughness: 0.12, metalness: 0.4 }), []);
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: "#15171A", roughness: 0.9 }), []);
  return (
    <group>
      <mesh position={[0, 0.55, 0]} material={body} castShadow><boxGeometry args={[4.4, 0.7, 1.9]} /></mesh>
      <mesh position={[-0.15, 1.15, 0]} material={body} castShadow><boxGeometry args={[2.5, 0.62, 1.7]} /></mesh>
      <mesh position={[-0.15, 1.17, 0]} material={glass}><boxGeometry args={[2.54, 0.36, 1.74]} /></mesh>
      {[[1.45, 0.85], [1.45, -0.85], [-1.45, 0.85], [-1.45, -0.85]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.32, wz]} rotation={[Math.PI / 2, 0, 0]} material={tyre} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.24, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/* Traffic gently moving along MG Road (both lanes, slow city speed). */
function MovingCars() {
  const cars = useMemo(() => ([
    { lane: 18.6, dir: -1, speed: 8, offset: 40, color: "#3A3F45" },
    { lane: 23.4, dir: 1, speed: 6.5, offset: -60, color: "#C6CACE" },
    { lane: 18.6, dir: -1, speed: 9.5, offset: -130, color: "#E8E9EA" },
    { lane: 23.4, dir: 1, speed: 7.5, offset: 110, color: "#7E2F2F" },
  ]), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const span = 360;
    cars.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      let x = c.offset + c.dir * c.speed * t;
      x = (((x + 180) % span) + span) % span - 180;
      g.position.x = x;
    });
  });
  return (
    <>
      {cars.map((c, i) => (
        <group
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[0, 0, c.lane]}
          rotation={[0, c.dir === 1 ? Math.PI : 0, 0]}
        >
          <Car color={c.color} />
        </group>
      ))}
    </>
  );
}

/* ── Blob-cluster tree: trunk + 3 overlapping canopies ─────────────── */
function Tree({ x, z, s, v, mats }: { x: number; z: number; s: number; v: number; mats: ReturnType<typeof useMats> }) {
  const rot = useMemo(() => (x * 13.37 + z) % Math.PI, [x, z]);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, s * 0.4, 0]} material={mats.trunk} castShadow>
        <cylinderGeometry args={[0.22, 0.34, s * 0.85, 7]} />
      </mesh>
      <mesh position={[0, s * 1.18, 0]} material={mats.leaf[v]} castShadow>
        <sphereGeometry args={[s * 0.72, 12, 9]} />
      </mesh>
      <mesh position={[s * 0.42, s * 1.0, s * 0.18]} material={mats.leaf[(v + 1) % 3]} castShadow>
        <sphereGeometry args={[s * 0.48, 10, 8]} />
      </mesh>
      <mesh position={[-s * 0.38, s * 1.04, -s * 0.22]} material={mats.leaf[(v + 2) % 3]} castShadow>
        <sphereGeometry args={[s * 0.42, 10, 8]} />
      </mesh>
    </group>
  );
}

export function Landscape() {
  const m = useMats();

  const trees = useMemo(() => {
    const r = rng(42), a: { x: number; z: number; s: number; v: number }[] = [];
    for (let i = 0; i < 64; i++) {
      const x = (r() - 0.5) * 220, z = -16 - r() * 72;
      a.push({ x, z, s: 2.6 + r() * 2.6, v: Math.floor(r() * 3) });
    }
    for (const x of [-60, -48, 48, 60, 72]) a.push({ x, z: 24 + (x % 3), s: 3.2, v: 1 }); // roadside
    return a;
  }, []);

  const palms = [-22, -10, -2, 2, 10, 22];
  /* Parked cars along the kerb (charcoal SUV, silver sedan, black sedan…) */
  const parked: [number, number, string][] = [
    [-34, 15.8, "#3A3F45"], [-2, 15.8, "#C6CACE"], [24, 15.8, "#23262B"], [40, 15.8, "#8E9296"],
  ];

  return (
    <group>
      {/* Ground, road and paving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={m.lawn}><planeGeometry args={[600, 600]} /></mesh>
      {/* Grass verge between sidewalk and asphalt (as in the rendering) */}
      <mesh position={[0, 0.05, 13.7]} receiveShadow material={m.verge}><boxGeometry args={[400, 0.06, 1.5]} /></mesh>
      <mesh position={[0, 0.03, 21]} material={m.road} receiveShadow><boxGeometry args={[400, 0.06, 13]} /></mesh>
      <mesh position={[0, 0.06, 11]} material={m.walk} receiveShadow><boxGeometry args={[400, 0.12, 4]} /></mesh>
      {/* Double yellow centre line + white lane dashes */}
      {[20.3, 21.7].map((z) => <mesh key={z} position={[0, 0.07, z]} material={m.line}><boxGeometry args={[400, 0.02, 0.1]} /></mesh>)}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i} position={[-195 + i * 10, 0.07, 17.6]} material={m.dash}><boxGeometry args={[4, 0.02, 0.15]} /></mesh>
      ))}

      {/* Trees */}
      {trees.map((t, i) => <Tree key={i} x={t.x} z={t.z} s={t.s} v={t.v} mats={m} />)}

      {/* Potted palms along the entrance walkway */}
      {palms.map((x) => (
        <group key={x} position={[x, 0, 10.4]}>
          <mesh position={[0, 0.45, 0]} material={m.pot} castShadow><cylinderGeometry args={[0.55, 0.42, 0.9, 10]} /></mesh>
          <mesh position={[0, 2.1, 0]} material={m.trunk}><cylinderGeometry args={[0.1, 0.16, 2.6, 6]} /></mesh>
          <mesh position={[0, 3.6, 0]} scale={[1.7, 0.7, 1.7]} material={m.palm} castShadow><sphereGeometry args={[1, 10, 8]} /></mesh>
        </group>
      ))}

      {/* Parked + moving cars */}
      {parked.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}><Car color={c} /></group>
      ))}
      <MovingCars />
    </group>
  );
}
