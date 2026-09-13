"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { SpineMesh } from "./SpineMesh";

function CameraRig() {
  const target = useRef(new THREE.Vector3(0, 0.7, 0));

  useFrame(({ camera }, delta) => {
    const t = clockTime();
    const desired = new THREE.Vector3(Math.sin(t * 0.4) * 2.2, 1.6, 7.5);
    camera.position.lerp(desired, 1 - Math.exp(-2 * delta));
    camera.lookAt(target.current);
  });

  return null;
}

function clockTime() {
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
}

export function SceneRoot() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.4, 7.2], fov: 40, near: 0.1, far: 60 }}
      style={{ background: "#020710", width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#020710"]} />
      <ambientLight intensity={0.9} color="#a8c4ff" />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#dfeaff" />
      <CameraRig />
      <Suspense fallback={null}>
        <SpineMesh />
      </Suspense>
    </Canvas>
  );
}
