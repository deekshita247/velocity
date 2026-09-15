"use client";

import { Suspense, useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { Environment, Lightformer, Sparkles, useScroll, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { useInView } from "framer-motion";
import { subscribeCriticalAssets, getCriticalSnapshot, getServerCriticalSnapshot, criticalPercent } from "../loading/criticalAssets";
import { SpineMesh } from "@/components/experience/SpineMesh";
import { CameraRig } from "./CameraRig";
import { PhotoCard } from "./PhotoCard";
import { getGalleryProgress, photographs, safeProgress } from "./galleryData";
import { useGalleryInteraction } from "./GalleryInteraction";
import { GalleryAtmosphere } from "./effects/GalleryAtmosphere";
import { ReferenceParticles } from "./effects/ReferenceParticles";

// Imperative adapter for Drei's mutable scroll store (not React render state).
type ScrollStore=ReturnType<typeof useScroll>&{scroll:{current:number}};
function setScrollTarget(store:ScrollStore,value:number){store.scroll.current=safeProgress(value);}
function repairScrollStore(store:ScrollStore){
  if(!Number.isFinite(store.offset)){store.offset=safeProgress(store.scroll.current);store.delta=0;}
  setScrollTarget(store,store.scroll.current);
}

function PageScrollBridge({ track }: { track: RefObject<HTMLElement | null> }) {
  // Drei exposes the normalized target ref at runtime; its declaration omits it.
  const scroll = useScroll() as ScrollStore;
  const { locked } = useGalleryInteraction();
  useEffect(() => {
    const update = () => {
      if (!track.current || locked.current) return;
      const rect = track.current.getBoundingClientRect();
      const progress = getGalleryProgress(-rect.top / Math.max(1, rect.height - window.innerHeight));
      // Feed the normalized target directly; synthetic DOM scroll events divide by
      // a potentially zero scrollHeight during Canvas mount/resize. Drei still damps it.
      setScrollTarget(scroll,progress);
    };
    scroll.el.setAttribute("aria-hidden", "true");
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const timer = window.setTimeout(update, 100);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scroll, track, locked]);
  useFrame(()=>{
    repairScrollStore(scroll);
  },-2);
  return null;
}

function RotatingSpine() {
  const { locked } = useGalleryInteraction();
  const group = useRef<Group>(null);
  const scroll = useScroll();
  useFrame((_, delta) => {
    if (!group.current || locked.current) return;
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, safeProgress(scroll.offset) * Math.PI * 2.5, 4, Math.min(delta, 0.05));
  });
  return <group ref={group} name="scroll-rotating-spine" scale={1.3}><SpineMesh /></group>;
}

function DetailBackdrop() {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const position = useRef(new Vector3());
  const { transition, close, selected } = useGalleryInteraction();
  useFrame(({ camera }) => {
    if (!mesh.current || !material.current) return;
    mesh.current.position.copy(position.current.set(0,0,-3).applyQuaternion(camera.quaternion).add(camera.position));
    mesh.current.quaternion.copy(camera.quaternion);
    material.current.opacity = transition.current.value * 0.5;
  });
  return <mesh ref={mesh} name="detail-dimmer" raycast={selected === null ? () => {} : Mesh.prototype.raycast} visible={selected !== null} userData={{excludeFromRefraction:true}} renderOrder={800} onClick={event=>{event.stopPropagation();close();}}>
    <planeGeometry args={[100,100]}/><meshBasicMaterial ref={material} color="#080B12" transparent opacity={0} depthTest={false} depthWrite={false}/>
  </mesh>;
}

export function GalleryScene({ track }: { track: RefObject<HTMLElement | null> }) {
  const mobile = useThree((state) => state.size.width < 768);
  const snapshot=useSyncExternalStore(subscribeCriticalAssets,getCriticalSnapshot,getServerCriticalSnapshot);
  const approaching=useInView(track,{once:true,margin:"800px"});
  const loadRemaining=criticalPercent(snapshot)===100||approaching;
  useEffect(() => {
    photographs.slice(0,2).forEach((photo) => {
      try {
        useTexture.preload(photo.galleryImage);
      } catch (error) {
        console.warn(`[gallery] Failed to preload "${photo.galleryImage}"`, error);
      }
    });
  }, []);

  return (
    <GalleryAtmosphere>
      <PageScrollBridge track={track} />

      <CameraRig />
      <color attach="background" args={["#080B12"]} />
      <fogExp2 attach="fog" args={["#080B12", 0.08]} />
      <ambientLight color="#9bbaca" intensity={0.4} />
      <directionalLight position={[-4, 5, -3]} color="#5BF2E6" intensity={1.5} />
      <pointLight position={[-3, 2, -2]} color="#5BF2E6" intensity={24} distance={16} />
      <pointLight position={[3, -1, -1]} color="#955BFA" intensity={16} distance={14} />
      {!mobile && <pointLight position={[1, 3, 4]} color="#E0EBF5" intensity={12} distance={12} />}
      <RotatingSpine />
      <ReferenceParticles />
      <DetailBackdrop />
      <Environment resolution={128} frames={1}>
        <Lightformer position={[-4, 0, 2]} target={[0, 0, 0]} scale={[2, 18, 1]} color="#5BF2E6" intensity={3} />
        <Lightformer position={[4, 0, -2]} target={[0, 0, 0]} scale={[3, 18, 1]} color="#955BFA" intensity={2.5} />
        <Lightformer position={[0, 5, 4]} target={[0, 0, 0]} scale={[5, 2, 1]} color="#E0EBF5" intensity={3} />
      </Environment>
      <Sparkles count={mobile ? 80 : 170} position={[0, -4, 0]} scale={[18, 18, 18]} size={1.2} speed={0.28} noise={0.6} opacity={0.35} color="#5BF2E6" />
      <Sparkles count={mobile ? 60 : 120} position={[0, -2.5, 0]} scale={[16, 16, 16]} size={0.8} speed={0.18} noise={0.45} opacity={0.25} color="#E560D1" />
      {photographs.slice(0,loadRemaining?photographs.length:2).map((photo, index) => (
        <Suspense key={photo.title} fallback={null}>
          <PhotoCard photo={photo} index={index} />
        </Suspense>
      ))}
    </GalleryAtmosphere>
  );
}
