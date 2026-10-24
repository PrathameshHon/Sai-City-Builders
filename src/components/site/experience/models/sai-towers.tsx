import { Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

const FLOORS = 7, FH = 3.2, PH = 9, TOP = PH + FLOORS * FH; // 31.4 m
type SegType = "frame" | "brown" | "balc";
const SEGS: { w: number; t: SegType }[] = [
  { w: 6, t: "frame" }, { w: 7, t: "brown" }, { w: 6, t: "balc" }, { w: 6, t: "frame" },
];

/* Natural palette matched to the client's architectural rendering. */
const mk = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

function useMats() {
  return useMemo(() => ({
    white: mk("#F7F4EE", { roughness: 0.7 }),          // crisp white bands
    grey: mk("#C9C4BA", { roughness: 0.75 }),          // cool light-grey walls
    brown: mk("#4E3A2C", { roughness: 0.8 }),          // dark chocolate cladding
    timber: mk("#A05A38", { roughness: 0.65 }),        // terracotta pergola deck
    spine: mk("#8B8880", { roughness: 0.7 }),          // fluted spine
    green: mk("#3D6B33", { roughness: 0.9 }),          // balcony planters
    podium: mk("#5B4738", { roughness: 0.85 }),        // earthy stone podium
    fascia: mk("#33281F", { roughness: 0.6 }),         // dark shop fascia board
    glass: mk("#A9CBE4", { roughness: 0.12, metalness: 0.35, envMapIntensity: 1.2 }),
    shop: mk("#FFE9C4", { emissive: "#FFC987", emissiveIntensity: 0.55 }),
    sign: mk("#3A2E26", { roughness: 0.55 }),
    box: new THREE.BoxGeometry(1, 1, 1),
  }), []);
}

type BoxProps = { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]; shadow?: boolean };
function B({ p, s, m, r, shadow = true }: BoxProps) {
  return <mesh position={p} scale={s} rotation={r} material={m} castShadow={shadow} receiveShadow><boxGeometry args={[1, 1, 1]} /></mesh>;
}

function Wing({ mats }: { mats: ReturnType<typeof useMats> }) {
  let x = 4;
  const H = FLOORS * FH;
  const out: React.ReactNode[] = [];
  SEGS.forEach((seg, i) => {
    const cx = x + seg.w / 2;
    const body = seg.t === "brown" ? mats.brown : mats.grey;
    out.push(<B key={`b${i}`} p={[cx, PH + H / 2, 0]} s={[seg.w, H, 12]} m={body} />);
    // white vertical frame at segment start
    out.push(<B key={`c${i}`} p={[x, PH + H / 2, 0.6]} s={[0.8, H, 12.8]} m={mats.white} />);
    for (let f = 0; f < FLOORS; f++) {
      const y = PH + f * FH;
      const ww = seg.t === "balc" ? seg.w * 0.6 : seg.w * 0.5;
      out.push(<B key={`w${i}-${f}`} p={[cx, y + 1.7, 6.05]} s={[ww, 1.5, 0.12]} m={mats.glass} shadow={false} />);
      out.push(<B key={`wf${i}-${f}`} p={[cx, y + 2.5, 6.15]} s={[ww + 0.3, 0.12, 0.3]} m={mats.white} shadow={false} />);
      if (seg.t === "balc") {
        out.push(<B key={`s${i}-${f}`} p={[cx, y + 0.12, 6.9]} s={[seg.w - 0.8, 0.25, 1.8]} m={mats.white} />);
        out.push(<B key={`g${i}-${f}`} p={[cx, y + 0.6, 7.7]} s={[seg.w - 0.8, 0.55, 0.3]} m={mats.green} />);
      }
    }
    x += seg.w;
  });
  // floor-line slabs + outer end frame + roof parapet
  for (let f = 0; f <= FLOORS; f++) out.push(<B key={`fl${f}`} p={[16.5, PH + f * FH, 0.3]} s={[25.4, 0.2, 12.6]} m={mats.white} />);
  out.push(<B key="end" p={[x, PH + H / 2, 0.6]} s={[0.8, H, 12.8]} m={mats.white} />);
  out.push(<B key="par" p={[16.5, TOP + 0.5, 0]} s={[25.4, 1, 12.4]} m={mats.grey} />);
  return <>{out}</>;
}

/** Gold shop lettering on dark fascia boards — the retail line-up from the rendering. */
const SHOP_NAMES = ["LAXMI", "COMMA", "VELVET", "SUITS", "CARE", "TROMA"];

export function SaiTowers() {
  const mats = useMats();
  const shops = useMemo(() => Array.from({ length: 12 }, (_, i) => -27.5 + i * 5), []);
  const signs = useMemo(() => SHOP_NAMES.map((_, i) => -27.5 + i * 10 + 2.5), []); // every other shop
  const fins = useMemo(() => Array.from({ length: 9 }, (_, i) => -3.5 + i * 0.875), []);
  return (
    <group>
      {/* Podium: two retail levels */}
      <B p={[0, PH / 2, 0]} s={[62, PH, 16]} m={mats.podium} />
      {shops.map((sx) => (
        <group key={sx}>
          <B p={[sx, 2.2, 8.05]} s={[3.6, 3.2, 0.12]} m={mats.shop} shadow={false} />
          <B p={[sx, 6.7, 8.05]} s={[3.6, 2.6, 0.12]} m={mats.shop} shadow={false} />
        </group>
      ))}
      {/* Dark fascia boards with gold shop names */}
      {signs.map((sx, i) => (
        <group key={sx}>
          <B p={[sx, 4.15, 8.12]} s={[4.4, 0.66, 0.14]} m={mats.fascia} shadow={false} />
          <Text position={[sx, 4.15, 8.24]} fontSize={0.42} color="#E8C84A" anchorX="center" anchorY="middle" letterSpacing={0.12}>
            {SHOP_NAMES[i]}
          </Text>
        </group>
      ))}
      <B p={[0, 4.5, 8.9]} s={[62, 0.3, 1.8]} m={mats.white} />
      <B p={[0, 5.3, 9.7]} s={[62, 0.9, 0.1]} m={mats.glass} shadow={false} />
      <B p={[0, 8.6, 8.6]} s={[62, 0.8, 1.2]} m={mats.timber} />
      <B p={[0, 9.05, 0]} s={[62, 0.3, 16.4]} m={mats.white} />

      {/* Twin wings (right = original, left = mirrored) */}
      <Wing mats={mats} />
      <group scale={[-1, 1, 1]}><Wing mats={mats} /></group>

      {/* Fluted central spine */}
      <B p={[0, PH + (FLOORS * FH) / 2, -2.5]} s={[8, FLOORS * FH, 1]} m={mats.spine} />
      {fins.map((fx) => <B key={fx} p={[fx, PH + (FLOORS * FH) / 2, -1.8]} s={[0.3, FLOORS * FH, 0.5]} m={mats.white} />)}

      {/* Entrance sign — white lettering on dark panel (as in the rendering) */}
      <B p={[0, PH + 1.1, 8.3]} s={[8, 1.4, 0.4]} m={mats.sign} />
      <Text position={[0, PH + 1.1, 8.55]} fontSize={0.8} color="#F6F4EF" anchorX="center" anchorY="middle" letterSpacing={0.14}>
        SAI TOWERS
      </Text>

      {/* Sky-deck pergola roof on the right wing */}
      {[[11, 5], [11, -4], [26, 5], [26, -4]].map(([px, pz]) => <B key={`${px}${pz}`} p={[px, TOP + 2.2, pz]} s={[0.3, 3.4, 0.3]} m={mats.white} />)}
      <B p={[18.5, TOP + 4.1, 0.5]} s={[17, 0.25, 11]} m={mats.timber} r={[0, 0, -0.12]} />
    </group>
  );
}
