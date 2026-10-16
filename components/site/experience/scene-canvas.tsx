"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { sampleCameraPath } from "./camera-path";
import { Landscape } from "./models/landscape";
import { Pavilion } from "./models/pavilion";
import { Tower } from "./models/tower";

interface RigProps {
  wrapRef: RefObject<HTMLDivElement | null>;
  progressRef: RefObject<number>;
}

/**
 * Scroll-driven camera rig. Each frame it reads the wrapper's scroll offset,
 * smooths it with a critically-damped filter, samples the keyframe path
 * (smoothstep easing) and drives position, lookAt target and fov.
 * A gentle idle breathing keeps the shot alive when idle.
 */
function CameraRig({ wrapRef, progressRef }: RigProps) {
  const dampRef = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const el = wrapRef.current;
    if (!el) return;

    const camera = state.camera as THREE.PerspectiveCamera;

    const rect = el.getBoundingClientRect();
    const total = Math.max(rect.height - window.innerHeight, 1);
    const raw = THREE.MathUtils.clamp(-rect.top / total, 0, 1);
    dampRef.current = THREE.MathUtils.damp(dampRef.current, raw, 3.2, dt);
    progressRef.current = dampRef.current;

    const fov = sampleCameraPath(dampRef.current, pos, tgt);

    // Subtle idle breathing on top of the path sample.
    const t = state.clock.elapsedTime;
    const breathY = Math.sin(t * 0.5) * 0.05;
    const swayX = Math.sin(t * 0.35) * 0.08;

    camera.position.set(pos.x, pos.y + breathY, pos.z);
    camera.lookAt(tgt.x + swayX, tgt.y, tgt.z);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  });

  return null;
}

function SceneContent({ wrapRef }: { wrapRef: RefObject<HTMLDivElement | null> }) {
  const progressRef = useRef(0);

  return (
    <>
      <color attach="background" args={["#F2E9D8"]} />
      <fog attach="fog" args={["#F2E9D8", 40, 160]} />

      {/* Soft golden-hour base lighting. */}
      <ambientLight color="#F5E9D2" intensity={0.35} />
      <hemisphereLight args={["#F2E9D8", "#7C9A72", 0.55]} />
      <directionalLight
        position={[28, 38, 22]}
        color="#FFE0B0"
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={260}
      />

      {/* Interior warm pools of light. */}
      <pointLight position={[0, 2.9, 6]} color="#FFD9A0" intensity={6} distance={9} decay={2} />
      <pointLight position={[3.75, 2.8, -4]} color="#FFE2B0" intensity={3} distance={6} decay={2} />
      <pointLight position={[0, 2.8, -14]} color="#FFEED0" intensity={5} distance={9} decay={2} />
      <pointLight position={[-2, 2.3, -8]} color="#FFD9A0" intensity={1.2} distance={4.5} decay={2} />

      <CameraRig wrapRef={wrapRef} progressRef={progressRef} />
      <Tower />
      <Pavilion progressRef={progressRef} />
      <Landscape />
    </>
  );
}

export default function SceneCanvas({
  wrapRef,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 320, position: [24, 9, 40] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <SceneContent wrapRef={wrapRef} />
    </Canvas>
  );
}
