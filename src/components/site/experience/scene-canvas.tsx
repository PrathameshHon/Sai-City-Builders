"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { sampleCameraPath } from "./camera-path";
import { SaiTowers } from "./models/sai-towers";
import { Landscape } from "./models/landscape";
import { Clouds } from "./models/clouds";

/* Golden-hour sun — matches the drei Sky below so lighting + sky stay coherent. */
const SUN = [-70, 55, 30] as const;

/**
 * Procedural environment map (sky-to-ground gradient on a canvas) so glass
 * and car paint pick up believable natural reflections without any assets.
 */
function EnvTexture() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "#9CC1EC");    // zenith blue
    grad.addColorStop(0.48, "#E9F0F7"); // horizon haze
    grad.addColorStop(0.52, "#93A683"); // ground green
    grad.addColorStop(1, "#6E7D62");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return <primitive object={tex} attach="environment" />;
}

function CameraRig({ wrapRef }: { wrapRef: RefObject<HTMLDivElement | null> }) {
  const damp = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const el = wrapRef.current;
    if (!el) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const r = el.getBoundingClientRect();
    const raw = THREE.MathUtils.clamp(-r.top / Math.max(r.height - window.innerHeight, 1), 0, 1);
    damp.current = THREE.MathUtils.damp(damp.current, raw, 3.2, dt);
    const fov = sampleCameraPath(damp.current, pos, tgt);
    const t = state.clock.elapsedTime;
    cam.position.set(pos.x + Math.sin(t * 0.3) * 0.15, pos.y + Math.sin(t * 0.5) * 0.08, pos.z);
    cam.lookAt(tgt);
    cam.fov = fov;
    cam.updateProjectionMatrix();
    const bar = document.getElementById("bar");
    if (bar) bar.style.width = `${damp.current * 100}%`;
  });
  return null;
}

export default function SceneCanvas({ wrapRef }: { wrapRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <>
      {/* Gold scroll-progress bar — sits just under the sticky site header */}
      <div id="bar" className="absolute left-0 top-16 z-30 h-[3px] w-0 bg-gold" aria-hidden="true" />
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 50, near: 0.1, far: 600, position: [46, 66, 78] }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
      >
        {/* Natural gradient sky with a soft sun glow */}
        <Sky sunPosition={[SUN[0], SUN[1], SUN[2]]} turbidity={6} rayleigh={1.4} mieCoefficient={0.006} mieDirectionalG={0.85} />
        <fog attach="fog" args={["#C3D6EE", 110, 420]} />
        <EnvTexture />

        {/* Golden-hour lighting: warm sun from the west, cool sky fill */}
        <ambientLight color="#FFF2DC" intensity={0.3} />
        <hemisphereLight args={["#CBDCF2", "#7C8F6A", 0.55]} />
        <directionalLight
          position={[SUN[0], SUN[1], SUN[2]]} intensity={2.4} color="#FFDCB0" castShadow
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.05}
          shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90}
          shadow-camera-near={10} shadow-camera-far={320}
        />

        <CameraRig wrapRef={wrapRef} />
        <Clouds />
        <SaiTowers />
        <Landscape />
      </Canvas>
    </>
  );
}
