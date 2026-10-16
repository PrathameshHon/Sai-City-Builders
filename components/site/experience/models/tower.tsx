import { useMemo } from "react";
import * as THREE from "three";

/** Number of floors of the hero tower (3 m each). */
const FLOOR_COUNT = 14;
const TOWER_Z = -55;
const FINS_Z = -46.8;

interface FloorRow {
  slabY: number;
  glassY: number;
  bandY: number;
}

/**
 * Background landmark: a 14-floor emerald-and-ivory tower with champagne-gold
 * trims, vertical south fins and a recessed gold pergola crown.
 * Center [0, 21, -55], footprint 20 x 16, height 42.
 */
export function Tower() {
  const parts = useMemo(() => {
    const geos = {
      slab: new THREE.BoxGeometry(20, 0.35, 16),
      glass: new THREE.BoxGeometry(19.6, 2.6, 15.6),
      band: new THREE.BoxGeometry(20.4, 0.16, 16.4),
      fin: new THREE.BoxGeometry(0.18, 42, 0.4),
      core: new THREE.BoxGeometry(14, 42, 9),
      crown: new THREE.BoxGeometry(18, 0.4, 14),
      beamZ: new THREE.BoxGeometry(0.15, 0.3, 14),
      beamX: new THREE.BoxGeometry(18, 0.3, 0.15),
      spire: new THREE.CylinderGeometry(0.06, 0.06, 4, 8),
    };
    const mats = {
      slab: new THREE.MeshStandardMaterial({
        color: "#E9E2D0",
        roughness: 0.85,
        metalness: 0.05,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#9FD4C0",
        transparent: true,
        opacity: 0.5,
        roughness: 0.15,
        metalness: 0.2,
        depthWrite: false,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: "#C6A55C",
        metalness: 0.8,
        roughness: 0.3,
        emissive: "#6E5424",
        emissiveIntensity: 0.35,
      }),
      core: new THREE.MeshStandardMaterial({
        color: "#26332D",
        roughness: 0.9,
        metalness: 0.1,
      }),
    };
    const floors: FloorRow[] = Array.from({ length: FLOOR_COUNT }, (_, i) => ({
      slabY: i * 3 + 0.175,
      glassY: i * 3 + 1.65,
      bandY: i * 3 + 0.43,
    }));
    const finXs = [-8.75, -6.25, -3.75, -1.25, 1.25, 3.75, 6.25, 8.75];
    const beamXs = [-7, -3.5, 0, 3.5, 7];
    return { geos, mats, floors, finXs, beamXs };
  }, []);

  return (
    <group>
      {parts.floors.map((f, i) => (
        <group key={i}>
          <mesh
            geometry={parts.geos.slab}
            material={parts.mats.slab}
            position={[0, f.slabY, TOWER_Z]}
            castShadow
          />
          <mesh
            geometry={parts.geos.glass}
            material={parts.mats.glass}
            position={[0, f.glassY, TOWER_Z]}
          />
          <mesh
            geometry={parts.geos.band}
            material={parts.mats.gold}
            position={[0, f.bandY, TOWER_Z]}
          />
        </group>
      ))}
      {/* Dark core behind the glass. */}
      <mesh
        geometry={parts.geos.core}
        material={parts.mats.core}
        position={[0, 21, TOWER_Z]}
        castShadow
      />
      {/* Vertical gold fins on the south face. */}
      {parts.finXs.map((x) => (
        <mesh
          key={x}
          geometry={parts.geos.fin}
          material={parts.mats.gold}
          position={[x, 21, FINS_Z]}
        />
      ))}
      {/* Recessed crown slab + gold pergola + slim spire. */}
      <mesh
        geometry={parts.geos.crown}
        material={parts.mats.slab}
        position={[0, 42.4, TOWER_Z]}
        castShadow
      />
      {parts.beamXs.map((x) => (
        <mesh
          key={`bz-${x}`}
          geometry={parts.geos.beamZ}
          material={parts.mats.gold}
          position={[x, 42.75, TOWER_Z]}
        />
      ))}
      {[-6.8, 6.8].map((z) => (
        <mesh
          key={`bx-${z}`}
          geometry={parts.geos.beamX}
          material={parts.mats.gold}
          position={[0, 42.75, TOWER_Z + z]}
        />
      ))}
      <mesh
        geometry={parts.geos.spire}
        material={parts.mats.gold}
        position={[0, 44.6, TOWER_Z]}
      />
    </group>
  );
}
