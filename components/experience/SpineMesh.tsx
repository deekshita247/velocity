"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { markCriticalAsset } from "../loading/criticalAssets";
import { loadSpineGeometry } from "@/lib/loadSpineGeometry";

export function SpineMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const instancedRef = useRef<THREE.InstancedMesh | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.set(0, 0, 0);
    group.position.y = 3.446;
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const decoded = await loadSpineGeometry("/assets/spine/spine.bin");
        if (!cancelled) { setGeometry(decoded); markCriticalAsset("spine"); } else decoded.dispose();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!geometry || !instancedRef.current) return;

    const temp = new THREE.Object3D();

    for (let i = 0; i < 40; i++) {
      temp.position.set(0, 4 - 0.65 * i, 0);
      temp.rotation.set(0, 0.4 * i, 0);
      temp.scale.set(3.5, 3.5, 3.5);
      temp.updateMatrix();
      instancedRef.current.setMatrixAt(i, temp.matrix);
    }

    instancedRef.current.instanceMatrix.needsUpdate = true;
    instancedRef.current.computeBoundingSphere();
  }, [geometry]);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#d1fff4",
        roughness: 0.22,
        metalness: 0.25,
        clearcoat: 0.9,
        clearcoatRoughness: 0.22,
        transmission: 0.60,
        thickness: 1.2,
        ior: 1.38,
        envMapIntensity: 1.6,
        iridescence: 0.7,
        iridescenceIOR: 1.2,
        iridescenceThicknessRange: [200, 440],
        transparent: true,
        opacity: 0.65,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (error) return null;
  if (!geometry) return null;

  return (
    <group ref={groupRef} position={[0, 3.446, 0]}>
      <instancedMesh ref={instancedRef} args={[geometry, material, 40]} />
    </group>
  );
}
