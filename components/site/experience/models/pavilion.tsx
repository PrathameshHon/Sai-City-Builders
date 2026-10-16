import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Palette helpers                                                     */
/* ------------------------------------------------------------------ */

const IVORY_WALL = "#F5F0E4";
const ROOF_IVORY = "#F1EADA";
const GOLD = "#C6A55C";
const WALNUT = "#6B4226";
const EMERALD_DEEP = "#175641";

/* ------------------------------------------------------------------ */
/* Shell: roof, fascia, floor slab, solid west/east walls              */
/* ------------------------------------------------------------------ */

function Shell() {
  const parts = useMemo(() => {
    const geos = {
      roof: new THREE.BoxGeometry(15, 0.4, 29.2),
      fascia: new THREE.BoxGeometry(15.1, 0.12, 29.3),
      floor: new THREE.BoxGeometry(14.6, 0.25, 28.6),
      wall: new THREE.BoxGeometry(0.3, 3.6, 28.4),
      skirt: new THREE.BoxGeometry(0.02, 0.09, 28.4),
    };
    const mats = {
      roof: new THREE.MeshStandardMaterial({ color: ROOF_IVORY, roughness: 0.9 }),
      floor: new THREE.MeshStandardMaterial({ color: "#E8DFC8", roughness: 0.75 }),
      wall: new THREE.MeshStandardMaterial({ color: IVORY_WALL, roughness: 0.92 }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.65,
        roughness: 0.28,
        emissive: "#6E5424",
        emissiveIntensity: 0.3,
      }),
    };
    return { geos, mats };
  }, []);

  return (
    <group>
      <mesh
        geometry={parts.geos.roof}
        material={parts.mats.roof}
        position={[0, 3.4, -4]}
        castShadow
      />
      <mesh
        geometry={parts.geos.fascia}
        material={parts.mats.gold}
        position={[0, 3.4, -4]}
      />
      <mesh
        geometry={parts.geos.floor}
        material={parts.mats.floor}
        position={[0, 0.125, -4]}
        receiveShadow
      />
      {/* Solid west + east walls. */}
      {[-7, 7].map((x) => (
        <mesh
          key={`w-${x}`}
          geometry={parts.geos.wall}
          material={parts.mats.wall}
          position={[x, 1.8, -4]}
        />
      ))}
      {/* Gold skirting along the interior faces of the solid walls. */}
      {[-6.86, 6.86].map((x) => (
        <mesh
          key={`sk-${x}`}
          geometry={parts.geos.skirt}
          material={parts.mats.gold}
          position={[x, 0.31, -4]}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* South glass facade (dissolves as the camera crosses the threshold)  */
/* ------------------------------------------------------------------ */

const MULLION_XS = [-7, -5, -3, -1, 1, 3, 5, 7];

/**
 * Module-level material for the south facade glass. It is faded out
 * (opacity -> 0, then hidden) as the camera crosses the threshold between
 * scroll progress 0.46 and 0.54, so the fly-through passes "through" the wall.
 */
const FACADE_GLASS_MAT = new THREE.MeshStandardMaterial({
  color: "#A8D8C6",
  transparent: true,
  opacity: 0.32,
  roughness: 0.1,
  metalness: 0.15,
  depthWrite: false,
  side: THREE.DoubleSide,
});

function SouthFacade({ progressRef }: { progressRef: RefObject<number> }) {
  const parts = useMemo(() => {
    const gold = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.7,
      roughness: 0.25,
      emissive: "#6E5424",
      emissiveIntensity: 0.3,
    });
    const geos = {
      mullionV: new THREE.BoxGeometry(0.09, 3.0, 0.09),
      mullionH: new THREE.BoxGeometry(14.15, 0.07, 0.07),
      post: new THREE.BoxGeometry(0.1, 3.02, 0.16),
      header: new THREE.BoxGeometry(1.76, 0.14, 0.18),
      handle: new THREE.CylinderGeometry(0.024, 0.024, 1.25, 10),
      canopy: new THREE.BoxGeometry(2.4, 0.07, 0.55),
    };
    return { gold, geos };
  }, []);

  useFrame(() => {
    const p = progressRef.current;
    const fade = THREE.MathUtils.clamp((p - 0.46) / 0.08, 0, 1);
    FACADE_GLASS_MAT.opacity = 0.32 * (1 - fade);
    FACADE_GLASS_MAT.visible = fade < 0.999;
  });

  return (
    <group>
      <mesh material={FACADE_GLASS_MAT} position={[0, 1.85, 10]}>
        <planeGeometry args={[14, 3.2]} />
      </mesh>
      {/* Vertical mullions every 2 m (center bay left open for the door). */}
      {MULLION_XS.map((x) => (
        <mesh
          key={`mv-${x}`}
          geometry={parts.geos.mullionV}
          material={parts.gold}
          position={[x, 1.75, 10.03]}
        />
      ))}
      <mesh
        geometry={parts.geos.mullionH}
        material={parts.gold}
        position={[0, 1.1, 10.03]}
      />
      <mesh
        geometry={parts.geos.mullionH}
        material={parts.gold}
        position={[0, 2.6, 10.03]}
      />
      {/* Center entrance door frame + handle + small gold canopy. */}
      {[-0.8, 0.8].map((x) => (
        <mesh
          key={`dp-${x}`}
          geometry={parts.geos.post}
          material={parts.gold}
          position={[x, 1.76, 10.06]}
        />
      ))}
      <mesh
        geometry={parts.geos.header}
        material={parts.gold}
        position={[0, 3.18, 10.06]}
      />
      <mesh
        geometry={parts.geos.handle}
        material={parts.gold}
        position={[0.62, 1.5, 10.12]}
      />
      <mesh
        geometry={parts.geos.canopy}
        material={parts.gold}
        position={[0, 3.14, 10.28]}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* North sun-room window + emissive morning-sun backdrop               */
/* ------------------------------------------------------------------ */

function NorthWindow() {
  const parts = useMemo(() => {
    const glassMat = new THREE.MeshStandardMaterial({
      color: "#A8D8C6",
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.7,
      roughness: 0.25,
      emissive: "#6E5424",
      emissiveIntensity: 0.3,
    });
    const sun = new THREE.MeshStandardMaterial({
      color: "#FFF3D6",
      emissive: "#FFE9C0",
      emissiveIntensity: 1.4,
    });
    const geos = {
      mullionV: new THREE.BoxGeometry(0.09, 3.0, 0.09),
      mullionH: new THREE.BoxGeometry(14.15, 0.07, 0.07),
    };
    return { glassMat, gold, sun, geos };
  }, []);

  return (
    <group>
      <mesh material={parts.glassMat} position={[0, 1.85, -18]}>
        <planeGeometry args={[14, 3.2]} />
      </mesh>
      {MULLION_XS.map((x) => (
        <mesh
          key={`nv-${x}`}
          geometry={parts.geos.mullionV}
          material={parts.gold}
          position={[x, 1.75, -18.04]}
        />
      ))}
      <mesh
        geometry={parts.geos.mullionH}
        material={parts.gold}
        position={[0, 1.1, -18.04]}
      />
      <mesh
        geometry={parts.geos.mullionH}
        material={parts.gold}
        position={[0, 2.6, -18.04]}
      />
      {/* Warm emissive plane faking the low morning sun behind the glass. */}
      <mesh material={parts.sun} position={[0, 3, -20]}>
        <planeGeometry args={[14, 6]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Interior partitions                                                 */
/* ------------------------------------------------------------------ */

interface WallDef {
  size: [number, number, number];
  pos: [number, number, number];
}

const WALLS: WallDef[] = [
  // Living room north wall (z = 2) with the corridor mouth open at x 2.5..5.
  { size: [9.5, 2.95, 0.24], pos: [-2.25, 1.725, 2] },
  { size: [2, 2.95, 0.24], pos: [6, 1.725, 2] },
  // Corridor west wall (x = 2.5) with an open doorway at z -8.9..-7.
  { size: [0.24, 2.95, 9], pos: [2.5, 1.725, -2.5] },
  { size: [0.24, 2.95, 1.1], pos: [2.5, 1.725, -9.45] },
  // Corridor east wall (x = 5).
  { size: [0.24, 2.95, 12], pos: [5, 1.725, -4] },
  // Sun room south wall (z = -10) with a bright opening at x -0.9..5.
  { size: [6.1, 2.95, 0.24], pos: [-3.95, 1.725, -10] },
  { size: [2, 2.95, 0.24], pos: [6, 1.725, -10] },
];

const SKIRTS: WallDef[] = [
  { size: [9.5, 0.09, 0.02], pos: [-2.25, 0.31, 2.13] },
  { size: [2, 0.09, 0.02], pos: [6, 0.31, 2.13] },
  { size: [0.02, 0.09, 9], pos: [2.63, 0.31, -2.5] },
  { size: [0.02, 0.09, 12], pos: [4.87, 0.31, -4] },
  { size: [6.1, 0.09, 0.02], pos: [-3.95, 0.31, -10.13] },
  { size: [2, 0.09, 0.02], pos: [6, 0.31, -10.13] },
];

function Partitions() {
  const parts = useMemo(() => {
    const wall = new THREE.MeshStandardMaterial({
      color: IVORY_WALL,
      roughness: 0.92,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.65,
      roughness: 0.3,
      emissive: "#6E5424",
      emissiveIntensity: 0.25,
    });
    const walnut = new THREE.MeshStandardMaterial({
      color: WALNUT,
      roughness: 0.55,
    });
    const geos = {
      wall: new THREE.BoxGeometry(1, 1, 1),
      skirt: new THREE.BoxGeometry(1, 1, 1),
      jamb: new THREE.BoxGeometry(0.34, 2.55, 0.14),
      header: new THREE.BoxGeometry(0.34, 0.16, 2.24),
      leaf: new THREE.BoxGeometry(0.06, 2.12, 0.92),
      handle: new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
    };
    return { wall, gold, walnut, geos };
  }, []);

  return (
    <group>
      {WALLS.map((w, i) => (
        <mesh
          key={`pw-${i}`}
          geometry={parts.geos.wall}
          material={parts.wall}
          position={w.pos}
          scale={w.size}
        />
      ))}
      {SKIRTS.map((w, i) => (
        <mesh
          key={`ps-${i}`}
          geometry={parts.geos.skirt}
          material={parts.gold}
          position={w.pos}
          scale={w.size}
        />
      ))}
      {/* Open doorway trim in the corridor west wall (z -8.9 .. -7). */}
      <mesh
        geometry={parts.geos.jamb}
        material={parts.walnut}
        position={[2.5, 1.5, -6.95]}
      />
      <mesh
        geometry={parts.geos.jamb}
        material={parts.walnut}
        position={[2.5, 1.5, -8.95]}
      />
      <mesh
        geometry={parts.geos.header}
        material={parts.walnut}
        position={[2.5, 2.5, -7.95]}
      />
      {/* The open walnut door leaf, swung into the suite vestibule. */}
      <group position={[2.5, 0.25, -8.9]} rotation-y={-2.007}>
        <mesh
          geometry={parts.geos.leaf}
          material={parts.walnut}
          position={[0, 1.06, 0.47]}
        />
        <mesh
          geometry={parts.geos.handle}
          material={parts.gold}
          position={[0.09, 1.15, 0.78]}
        />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Living room (z 2..10, full width)                                   */
/* ------------------------------------------------------------------ */

function LivingRoom() {
  const parts = useMemo(() => {
    const mats = {
      wood: new THREE.MeshStandardMaterial({ color: "#8B5E3C", roughness: 0.6 }),
      rug: new THREE.MeshStandardMaterial({ color: "#C97B57", roughness: 1 }),
      sofa: new THREE.MeshStandardMaterial({ color: EMERALD_DEEP, roughness: 0.85 }),
      ivory: new THREE.MeshStandardMaterial({ color: "#F2ECDD", roughness: 0.9 }),
      champagne: new THREE.MeshStandardMaterial({ color: "#E3C48F", roughness: 0.9 }),
      walnut: new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55 }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.7,
        roughness: 0.25,
        emissive: "#6E5424",
        emissiveIntensity: 0.3,
      }),
      charcoal: new THREE.MeshStandardMaterial({ color: "#26332D", roughness: 0.6 }),
      screen: new THREE.MeshStandardMaterial({
        color: "#0E1512",
        emissive: "#1F4034",
        emissiveIntensity: 0.6,
      }),
      canvas: new THREE.MeshStandardMaterial({ color: "#EDE5D0", roughness: 0.85 }),
      accent: new THREE.MeshStandardMaterial({ color: "#2E6B52", roughness: 0.7 }),
      cord: new THREE.MeshStandardMaterial({ color: "#3A3A34", roughness: 0.8 }),
      bulb: new THREE.MeshStandardMaterial({
        color: "#FFE9C4",
        emissive: "#FFD9A0",
        emissiveIntensity: 2.6,
      }),
      pot: new THREE.MeshStandardMaterial({ color: "#B06A4A", roughness: 0.8 }),
      trunk: new THREE.MeshStandardMaterial({ color: "#7A5B3A", roughness: 0.9 }),
      leaf1: new THREE.MeshStandardMaterial({ color: "#4E7A4E", roughness: 0.9 }),
      leaf2: new THREE.MeshStandardMaterial({ color: "#5C8A58", roughness: 0.9 }),
    };
    const geos = {
      floor: new THREE.BoxGeometry(13.8, 0.04, 7.8),
      rug: new THREE.BoxGeometry(6, 0.02, 4),
      tableTop: new THREE.BoxGeometry(1.25, 0.05, 0.72),
      leg: new THREE.CylinderGeometry(0.022, 0.022, 0.11, 8),
      tray: new THREE.BoxGeometry(0.4, 0.025, 0.24),
      console: new THREE.BoxGeometry(0.42, 0.6, 2.4),
      panel: new THREE.BoxGeometry(0.1, 1.3, 2.1),
      screen: new THREE.BoxGeometry(0.04, 1.0, 1.6),
      frameL: new THREE.BoxGeometry(0.95, 0.72, 0.05),
      frameS: new THREE.BoxGeometry(0.7, 0.55, 0.05),
      canvasL: new THREE.BoxGeometry(0.85, 0.62, 0.06),
      canvasS: new THREE.BoxGeometry(0.6, 0.45, 0.06),
      cord: new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6),
      shade: new THREE.CylinderGeometry(0.17, 0.13, 0.2, 24),
      bulb: new THREE.SphereGeometry(0.055, 16, 12),
      pot: new THREE.CylinderGeometry(0.24, 0.19, 0.42, 16),
      trunk: new THREE.CylinderGeometry(0.035, 0.045, 0.55, 8),
      foliage: new THREE.SphereGeometry(1, 16, 12),
      lampBase: new THREE.CylinderGeometry(0.17, 0.17, 0.05, 16),
      lampPole: new THREE.CylinderGeometry(0.022, 0.022, 1.95, 8),
      lampArm: new THREE.CylinderGeometry(0.018, 0.018, 1.56, 8),
      lampShade: new THREE.CylinderGeometry(0.09, 0.13, 0.16, 20),
    };
    return { mats, geos };
  }, []);

  const m = parts.mats;
  const g = parts.geos;

  return (
    <group>
      {/* Walnut floor + terracotta area rug. */}
      <mesh geometry={g.floor} material={m.wood} position={[0, 0.27, 6]} />
      <mesh geometry={g.rug} material={m.rug} position={[0.3, 0.3, 6.2]} />

      {/* Emerald sofa facing west, with cushions and throw pillows. */}
      <RoundedBox args={[1.05, 0.42, 2.35]} radius={0.07} smoothness={3} material={m.sofa} position={[2.35, 0.5, 6.2]} />
      <RoundedBox args={[0.28, 0.8, 2.35]} radius={0.08} smoothness={3} material={m.sofa} position={[2.83, 0.79, 6.2]} />
      <RoundedBox args={[1.0, 0.5, 0.26]} radius={0.08} smoothness={3} material={m.sofa} position={[2.3, 0.66, 5.08]} />
      <RoundedBox args={[1.0, 0.5, 0.26]} radius={0.08} smoothness={3} material={m.sofa} position={[2.3, 0.66, 7.32]} />
      <RoundedBox args={[0.48, 0.13, 0.46]} radius={0.05} smoothness={3} material={m.ivory} position={[2.15, 0.77, 5.75]} />
      <RoundedBox args={[0.48, 0.13, 0.46]} radius={0.05} smoothness={3} material={m.ivory} position={[2.15, 0.77, 6.65]} />
      <RoundedBox args={[0.13, 0.44, 0.44]} radius={0.05} smoothness={3} material={m.champagne} position={[2.62, 0.93, 5.55]} rotation={[0, 0, -0.18]} />
      <RoundedBox args={[0.13, 0.44, 0.44]} radius={0.05} smoothness={3} material={m.champagne} position={[2.62, 0.93, 6.85]} rotation={[0, 0, -0.18]} />

      {/* Coffee table with gold legs + gold tray. */}
      <mesh geometry={g.tableTop} material={m.walnut} position={[0.6, 0.435, 6.3]} />
      {[
        [-0.55, -0.28],
        [0.55, -0.28],
        [-0.55, 0.28],
        [0.55, 0.28],
      ].map(([dx, dz], i) => (
        <mesh
          key={`tl-${i}`}
          geometry={g.leg}
          material={m.gold}
          position={[0.6 + dx, 0.365, 6.3 + dz]}
        />
      ))}
      <mesh geometry={g.tray} material={m.gold} position={[0.45, 0.472, 6.25]} />

      {/* Console + charcoal TV wall panel with a subtle emissive screen. */}
      <mesh geometry={g.console} material={m.walnut} position={[-6.6, 0.59, 6]} />
      <mesh geometry={g.panel} material={m.charcoal} position={[-6.78, 1.75, 6]} />
      <mesh geometry={g.screen} material={m.screen} position={[-6.72, 1.75, 6]} />

      {/* Gold-framed wall art on the living room north wall. */}
      <mesh geometry={g.frameL} material={m.gold} position={[0.6, 1.9, 2.16]} />
      <mesh geometry={g.canvasL} material={m.canvas} position={[0.6, 1.9, 2.19]} />
      <mesh geometry={g.frameS} material={m.gold} position={[-2.9, 1.9, 2.16]} />
      <mesh geometry={g.canvasS} material={m.accent} position={[-2.9, 1.9, 2.19]} />

      {/* Pendant lamp glowing above the coffee table. */}
      <mesh geometry={g.cord} material={m.cord} position={[0.8, 2.95, 6.3]} />
      <mesh geometry={g.shade} material={m.gold} position={[0.8, 2.6, 6.3]} />
      <mesh geometry={g.bulb} material={m.bulb} position={[0.8, 2.47, 6.3]} />

      {/* Floor plant in a terracotta pot. */}
      <mesh geometry={g.pot} material={m.pot} position={[-1.8, 0.5, 3.1]} />
      <mesh geometry={g.trunk} material={m.trunk} position={[-1.8, 0.98, 3.1]} />
      <mesh geometry={g.foliage} material={m.leaf1} position={[-1.8, 1.5, 3.1]} scale={0.42} />
      <mesh geometry={g.foliage} material={m.leaf2} position={[-1.5, 1.25, 3.35]} scale={0.3} />
      <mesh geometry={g.foliage} material={m.leaf2} position={[-2.1, 1.15, 2.85]} scale={0.28} />

      {/* Arc floor lamp arcing over the sofa. */}
      <mesh geometry={g.lampBase} material={m.gold} position={[3.6, 0.315, 7]} />
      <mesh geometry={g.lampPole} material={m.gold} position={[3.6, 1.28, 7]} />
      <mesh geometry={g.lampArm} material={m.gold} position={[2.83, 2.33, 7]} rotation={[0, 0, 1.478]} />
      <mesh geometry={g.lampShade} material={m.gold} position={[2.05, 2.34, 7]} />
      <mesh geometry={g.bulb} material={m.bulb} position={[2.05, 2.24, 7]} scale={0.7} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Primary corridor (x 2.5..5, z -10..2)                               */
/* ------------------------------------------------------------------ */

const DOWNLIGHT_ZS = [0, -2, -4, -6, -8];

function Corridor() {
  const parts = useMemo(() => {
    const mats = {
      runner: new THREE.MeshStandardMaterial({ color: "#D8C29A", roughness: 1 }),
      walnut: new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55 }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.7,
        roughness: 0.25,
        emissive: "#6E5424",
        emissiveIntensity: 0.3,
      }),
      downlight: new THREE.MeshStandardMaterial({
        color: "#FFF2D8",
        emissive: "#FFDCA6",
        emissiveIntensity: 2.4,
      }),
      canvas: new THREE.MeshStandardMaterial({ color: "#EDE5D0", roughness: 0.85 }),
      accent: new THREE.MeshStandardMaterial({ color: "#2E6B52", roughness: 0.7 }),
    };
    const geos = {
      runner: new THREE.BoxGeometry(1.9, 0.02, 11),
      downlight: new THREE.CylinderGeometry(0.17, 0.17, 0.025, 20),
      leaf: new THREE.BoxGeometry(0.07, 2.12, 1.02),
      lintel: new THREE.BoxGeometry(0.3, 0.12, 1.2),
      handle: new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
      frame: new THREE.BoxGeometry(0.05, 0.62, 0.46),
      art: new THREE.BoxGeometry(0.06, 0.54, 0.38),
      console: new THREE.BoxGeometry(0.38, 0.62, 1.3),
      vase: new THREE.CylinderGeometry(0.05, 0.07, 0.22, 12),
    };
    return { mats, geos };
  }, []);

  const m = parts.mats;
  const g = parts.geos;

  return (
    <group>
      {/* Warm sand runner. */}
      <mesh geometry={g.runner} material={m.runner} position={[3.75, 0.26, -3.75]} />

      {/* Five warm downlight discs in the ceiling. */}
      {DOWNLIGHT_ZS.map((z) => (
        <mesh
          key={`dl-${z}`}
          geometry={g.downlight}
          material={m.downlight}
          position={[3.75, 3.14, z]}
        />
      ))}

      {/* Closed walnut doors (z = 0 and z = -4) with gold handles. */}
      {[0, -4].map((z) => (
        <group key={`door-${z}`}>
          <mesh geometry={g.leaf} material={m.walnut} position={[2.64, 1.31, z]} />
          <mesh geometry={g.lintel} material={m.walnut} position={[2.5, 2.42, z]} />
          <mesh geometry={g.handle} material={m.gold} position={[2.7, 1.2, z + 0.36]} />
        </group>
      ))}

      {/* Gold-framed artworks on the west corridor wall. */}
      {[-1.9, -5.9].map((z) => (
        <group key={`art-${z}`}>
          <mesh geometry={g.frame} material={m.gold} position={[2.64, 1.78, z]} />
          <mesh
            geometry={g.art}
            material={z === -1.9 ? m.canvas : m.accent}
            position={[2.65, 1.78, z]}
          />
        </group>
      ))}

      {/* Low wood console against the east wall. */}
      <mesh geometry={g.console} material={m.walnut} position={[4.65, 0.6, -1.6]} />
      <mesh geometry={g.vase} material={m.gold} position={[4.65, 1.02, -1.9]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sun-drenched living room (z -18..-10, full width)                   */
/* ------------------------------------------------------------------ */

function SunRoom() {
  const parts = useMemo(() => {
    const mats = {
      stone: new THREE.MeshStandardMaterial({ color: "#E3DACA", roughness: 0.8 }),
      tan: new THREE.MeshStandardMaterial({ color: "#B08050", roughness: 0.8 }),
      ivory: new THREE.MeshStandardMaterial({ color: "#EFE7D6", roughness: 0.9 }),
      champagne: new THREE.MeshStandardMaterial({ color: "#E3C48F", roughness: 0.9 }),
      walnut: new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55 }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.7,
        roughness: 0.25,
        emissive: "#6E5424",
        emissiveIntensity: 0.3,
      }),
      pot: new THREE.MeshStandardMaterial({ color: "#B06A4A", roughness: 0.8 }),
      trunk: new THREE.MeshStandardMaterial({ color: "#7A5B3A", roughness: 0.9 }),
      leaf1: new THREE.MeshStandardMaterial({ color: "#4E7A4E", roughness: 0.9 }),
      leaf2: new THREE.MeshStandardMaterial({ color: "#5C8A58", roughness: 0.9 }),
      sheer: new THREE.MeshStandardMaterial({
        color: "#F7F2E7",
        transparent: true,
        opacity: 0.25,
        roughness: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      shaft: new THREE.MeshBasicMaterial({
        color: "#FFE7C2",
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    };
    const geos = {
      floor: new THREE.BoxGeometry(13.8, 0.04, 7.8),
      tableTop: new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24),
      tableLeg: new THREE.CylinderGeometry(0.035, 0.035, 0.27, 10),
      knob: new THREE.SphereGeometry(0.05, 12, 10),
      bench: new THREE.BoxGeometry(3.9, 0.34, 0.55),
      pot: new THREE.CylinderGeometry(0.3, 0.24, 0.5, 16),
      trunk: new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8),
      foliage: new THREE.SphereGeometry(1, 16, 12),
      rod: new THREE.CylinderGeometry(0.018, 0.018, 8.6, 8),
      shaft: new THREE.PlaneGeometry(2.2, 5.2),
      sheer: new THREE.PlaneGeometry(1.7, 2.85),
    };
    return { mats, geos };
  }, []);

  const m = parts.mats;
  const g = parts.geos;

  return (
    <group>
      {/* Pale stone floor. */}
      <mesh geometry={g.floor} material={m.stone} position={[0, 0.27, -14]} />

      {/* Tan reading chair facing the morning light. */}
      <group position={[-3.8, 0.29, -15]} rotation-y={0.95}>
        <RoundedBox args={[0.78, 0.34, 0.78]} radius={0.07} smoothness={3} material={m.tan} position={[0, 0.24, 0]} />
        <RoundedBox args={[0.2, 0.68, 0.72]} radius={0.08} smoothness={3} material={m.tan} position={[-0.36, 0.6, 0]} />
        <RoundedBox args={[0.8, 0.14, 0.16]} radius={0.05} smoothness={3} material={m.tan} position={[0, 0.5, 0.4]} />
        <RoundedBox args={[0.8, 0.14, 0.16]} radius={0.05} smoothness={3} material={m.tan} position={[0, 0.5, -0.4]} />
        <RoundedBox args={[0.6, 0.09, 0.6]} radius={0.04} smoothness={3} material={m.ivory} position={[0, 0.45, 0]} />
      </group>

      {/* Round side table with a small gold orb. */}
      <mesh geometry={g.tableTop} material={m.walnut} position={[-2.85, 0.56, -15.35]} />
      <mesh geometry={g.tableLeg} material={m.walnut} position={[-2.85, 0.42, -15.35]} />
      <mesh geometry={g.knob} material={m.gold} position={[-2.85, 0.62, -15.35]} />

      {/* Large plant in the northwest corner. */}
      <mesh geometry={g.pot} material={m.pot} position={[-5.4, 0.54, -16.2]} />
      <mesh geometry={g.trunk} material={m.trunk} position={[-5.4, 1.15, -16.2]} />
      <mesh geometry={g.foliage} material={m.leaf1} position={[-5.4, 1.95, -16.2]} scale={0.45} />
      <mesh geometry={g.foliage} material={m.leaf2} position={[-5.0, 1.7, -16.0]} scale={0.35} />
      <mesh geometry={g.foliage} material={m.leaf2} position={[-5.75, 1.6, -16.5]} scale={0.3} />
      <mesh geometry={g.foliage} material={m.leaf1} position={[-5.3, 2.3, -16.4]} scale={0.28} />

      {/* Low window bench by the north glass (clear of the sheers). */}
      <mesh geometry={g.bench} material={m.walnut} position={[-1.5, 0.46, -16.8]} />
      <RoundedBox args={[3.7, 0.12, 0.5]} radius={0.05} smoothness={3} material={m.ivory} position={[-1.5, 0.66, -16.8]} />
      <RoundedBox args={[0.35, 0.35, 0.12]} radius={0.05} smoothness={3} material={m.champagne} position={[-2.7, 0.85, -16.78]} rotation={[-0.3, 0, 0.1]} />
      <RoundedBox args={[0.35, 0.35, 0.12]} radius={0.05} smoothness={3} material={m.champagne} position={[-0.4, 0.85, -16.85]} rotation={[-0.3, 0, -0.1]} />

      {/* Sheer curtain panels + gold rod. */}
      <mesh geometry={g.sheer} material={m.sheer} position={[-2.7, 1.68, -17.3]} />
      <mesh geometry={g.sheer} material={m.sheer} position={[2.7, 1.68, -17.3]} />
      <mesh geometry={g.rod} material={m.gold} position={[0, 3.1, -17.28]} rotation={[0, 0, Math.PI / 2]} />

      {/* Additive sun shafts angling in from the north window. */}
      {[-3.2, -0.5, 2.2].map((x) => (
        <mesh
          key={`shaft-${x}`}
          geometry={g.shaft}
          material={m.shaft}
          position={[x, 2.1, -15.5]}
          rotation={[-0.61, 0, 0]}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Suite vestibule behind the open corridor door                       */
/* ------------------------------------------------------------------ */

function SuiteVestibule() {
  const parts = useMemo(() => {
    const mats = {
      walnut: new THREE.MeshStandardMaterial({ color: WALNUT, roughness: 0.55 }),
      ivory: new THREE.MeshStandardMaterial({ color: "#EFE7D6", roughness: 0.9 }),
      gold: new THREE.MeshStandardMaterial({
        color: GOLD,
        metalness: 0.7,
        roughness: 0.25,
        emissive: "#6E5424",
        emissiveIntensity: 0.3,
      }),
      canvas: new THREE.MeshStandardMaterial({ color: "#EDE5D0", roughness: 0.85 }),
      pot: new THREE.MeshStandardMaterial({ color: "#B06A4A", roughness: 0.8 }),
      leaf: new THREE.MeshStandardMaterial({ color: "#4E7A4E", roughness: 0.9 }),
    };
    const geos = {
      bench: new THREE.BoxGeometry(1.5, 0.38, 0.5),
      frame: new THREE.BoxGeometry(0.05, 0.7, 0.9),
      art: new THREE.BoxGeometry(0.06, 0.6, 0.8),
      pot: new THREE.CylinderGeometry(0.16, 0.13, 0.3, 12),
      foliage: new THREE.SphereGeometry(1, 14, 10),
    };
    return { mats, geos };
  }, []);

  const m = parts.mats;
  const g = parts.geos;

  return (
    <group>
      <mesh geometry={g.bench} material={m.walnut} position={[-2.3, 0.48, -8.7]} />
      <RoundedBox args={[1.4, 0.1, 0.45]} radius={0.04} smoothness={3} material={m.ivory} position={[-2.3, 0.67, -8.7]} />
      <mesh geometry={g.frame} material={m.gold} position={[-6.8, 1.8, -8]} />
      <mesh geometry={g.art} material={m.canvas} position={[-6.78, 1.8, -8]} />
      <mesh geometry={g.pot} material={m.pot} position={[-6.0, 0.44, -9.3]} />
      <mesh geometry={g.foliage} material={m.leaf} position={[-6.0, 0.85, -9.3]} scale={0.26} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Pavilion root                                                       */
/* ------------------------------------------------------------------ */

/**
 * The showcase residence: x -7..7, z -18..10, height 3.6, flat roof.
 * The south glass facade fades out between progress 0.46 and 0.54 so the
 * camera passes through the threshold without clipping visible glass.
 */
export function Pavilion({ progressRef }: { progressRef: RefObject<number> }) {
  return (
    <group>
      <Shell />
      <SouthFacade progressRef={progressRef} />
      <NorthWindow />
      <Partitions />
      <LivingRoom />
      <Corridor />
      <SunRoom />
      <SuiteVestibule />
    </group>
  );
}
