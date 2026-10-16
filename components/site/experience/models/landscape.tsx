import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface TreeDef {
  x: number;
  z: number;
  /** Overall scale of the foliage. */
  s: number;
  /** Trunk height. */
  h: number;
}

/**
 * Trees are placed off the camera path: none inside x -4..4 while z 5..45,
 * which is the corridor of sky the fly-through travels through.
 */
const TREES: TreeDef[] = [
  { x: -12, z: 18, s: 1.15, h: 2.6 },
  { x: 13, z: 21, s: 0.95, h: 2.2 },
  { x: -16, z: 29, s: 1.3, h: 3 },
  { x: 17, z: 33, s: 1.05, h: 2.4 },
  { x: -9, z: 6, s: 0.9, h: 2 },
  { x: 11, z: 7, s: 1, h: 2.3 },
  { x: -13, z: -2, s: 1.2, h: 2.7 },
  { x: 13, z: -5, s: 0.85, h: 1.9 },
  { x: -15, z: -26, s: 1.25, h: 2.8 },
  { x: 14, z: -26, s: 1.1, h: 2.5 },
  { x: -22, z: 48, s: 1.4, h: 3.2 },
  { x: 23, z: 50, s: 1.35, h: 3 },
];

const HEDGE_ZS = [14, 20, 26, 32];
const BOLLARD_ZS = [14, 22, 30];

/**
 * Grounds: lawn, sand driveway, entrance steps, sage hedge rows,
 * scattered trees and gold bollard lights along the drive.
 */
export function Landscape() {
  const parts = useMemo(() => {
    const mats = {
      lawn: new THREE.MeshStandardMaterial({ color: "#7C9A72", roughness: 1 }),
      drive: new THREE.MeshStandardMaterial({ color: "#D8CBAA", roughness: 0.95 }),
      step: new THREE.MeshStandardMaterial({ color: "#D6CBB4", roughness: 0.9 }),
      hedge: new THREE.MeshStandardMaterial({ color: "#4F6B4A", roughness: 0.9 }),
      trunk: new THREE.MeshStandardMaterial({ color: "#7A5B3A", roughness: 0.9 }),
      leaf1: new THREE.MeshStandardMaterial({ color: "#4E7A4E", roughness: 0.9 }),
      leaf2: new THREE.MeshStandardMaterial({ color: "#5C8A58", roughness: 0.9 }),
      bollard: new THREE.MeshStandardMaterial({
        color: "#C6A55C",
        metalness: 0.6,
        roughness: 0.35,
        emissive: "#FFC97A",
        emissiveIntensity: 1.4,
      }),
    };
    const geos = {
      lawn: new THREE.PlaneGeometry(300, 300),
      drive: new THREE.BoxGeometry(5, 0.06, 28.5),
      step: new THREE.BoxGeometry(1, 0.083, 0.85),
      hedge: new THREE.BoxGeometry(0.8, 0.62, 5.2),
      trunk: new THREE.CylinderGeometry(0.13, 0.18, 1, 8),
      foliage: new THREE.SphereGeometry(1, 16, 12),
      bollard: new THREE.CylinderGeometry(0.06, 0.07, 0.56, 10),
    };
    return { mats, geos };
  }, []);

  const m = parts.mats;
  const g = parts.geos;

  return (
    <group>
      {/* Lawn. */}
      <mesh
        geometry={g.lawn}
        material={m.lawn}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      {/* Sand driveway from the street to the forecourt. */}
      <mesh geometry={g.drive} material={m.drive} position={[0, 0.03, 25.75]} />

      {/* Three shallow stone entrance steps (solid risers, ground to top). */}
      <mesh geometry={g.step} material={m.step} position={[0, 0.127, 10.75]} scale={[8, 3.05, 1]} />
      <mesh geometry={g.step} material={m.step} position={[0, 0.0855, 11.65]} scale={[8.5, 2.05, 1]} />
      <mesh geometry={g.step} material={m.step} position={[0, 0.044, 12.55]} scale={[9, 1.05, 1]} />

      {/* Sage hedge rows flanking the driveway. */}
      {HEDGE_ZS.map((z) =>
        [-3.4, 3.4].map((x) => (
          <RoundedBox
            key={`hedge-${x}-${z}`}
            args={[0.8, 0.62, 5.2]}
            radius={0.16}
            smoothness={3}
            material={m.hedge}
            position={[x, 0.32, z]}
          />
        )),
      )}

      {/* Trees: trunk + layered foliage spheres. */}
      {TREES.map((t) => (
        <group key={`tree-${t.x}-${t.z}`} position={[t.x, 0, t.z]}>
          <mesh
            geometry={g.trunk}
            material={m.trunk}
            position={[0, t.h / 2, 0]}
            scale={[t.s, t.h, t.s]}
          />
          <mesh
            geometry={g.foliage}
            material={m.leaf1}
            position={[0, t.h + 0.9 * t.s, 0]}
            scale={1.3 * t.s}
          />
          <mesh
            geometry={g.foliage}
            material={m.leaf2}
            position={[0.8 * t.s, t.h + 0.4 * t.s, 0.3 * t.s]}
            scale={1.0 * t.s}
          />
          <mesh
            geometry={g.foliage}
            material={m.leaf2}
            position={[-0.7 * t.s, t.h + 0.55 * t.s, -0.4 * t.s]}
            scale={0.95 * t.s}
          />
        </group>
      ))}

      {/* Gold bollard lights along the driveway. */}
      {BOLLARD_ZS.map((z) =>
        [-2.6, 2.6].map((x) => (
          <mesh
            key={`bollard-${x}-${z}`}
            geometry={g.bollard}
            material={m.bollard}
            position={[x, 0.28, z]}
          />
        )),
      )}
    </group>
  );
}
