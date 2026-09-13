"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useScroll, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { markCriticalAsset } from "../loading/criticalAssets";
import * as THREE from "three";
import { getHelixPanelPlacement, getPhotoInfluence, type Photograph } from "./galleryData";
import { useGalleryInteraction } from "./GalleryInteraction";

export function PhotoCard({ photo, index }: { photo: Photograph; index: number }) {
  const texture=useTexture(photo.galleryImage, loaded => { loaded.colorSpace = THREE.SRGBColorSpace; });
  useEffect(()=>{markCriticalAsset(photo.galleryImage);},[texture,photo.galleryImage]);
  const group=useRef<THREE.Group>(null);const face=useRef<THREE.MeshBasicMaterial>(null);
  const [hovered,setHovered]=useState(false);const scroll=useScroll();const mobile=useThree(s=>s.size.width<768);
  const interaction=useGalleryInteraction();
  const placement=useMemo(()=>getHelixPanelPlacement(index,mobile),[index,mobile]);
  const width=mobile ? 1.4 : 2.7;
  const height = width * 0.7;
  const imageSource = texture.image as { width?: number; height?: number } | null | undefined;
  const imageAspect = imageSource && typeof imageSource.width === "number" && typeof imageSource.height === "number" && imageSource.width > 0 && imageSource.height > 0
    ? imageSource.width / imageSource.height
    : 1.5;
  const imageWidth = Math.min(width * 0.9, height * imageAspect * 1.02);
  const imageHeight = imageWidth / imageAspect;
  const selected=interaction.selected===index;
  const saved=useRef({position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),scale:new THREE.Vector3(),opacity:0.8});
  const captured=useRef(false);const floatTime=useRef(index*1.3);const target=useRef(new THREE.Vector3());
  const wave=useRef({time:{value:0},detail:{value:0}});
  useFrame(({camera,clock},delta)=>{
    if(!group.current||!face.current)return;const mesh=group.current;const dt=Math.min(delta,0.05);
    const focus=Math.max(getPhotoInfluence(scroll.offset,photo.t),hovered?1:0);
    if(!interaction.locked.current)floatTime.current+=dt*0.45;
    if(selected&&!captured.current){mesh.updateWorldMatrix(true,false);mesh.getWorldPosition(saved.current.position);mesh.getWorldQuaternion(saved.current.quaternion);mesh.getWorldScale(saved.current.scale);saved.current.opacity=face.current.opacity;captured.current=true;}
    const t=selected?interaction.transition.current.value:0;
    wave.current.time.value=clock.elapsedTime;wave.current.detail.value=t;
    if(selected){
      const cam=camera as THREE.PerspectiveCamera;const distance=2.2;
      target.current.set(0,0,-distance).applyQuaternion(cam.quaternion).add(cam.position);
      const visibleHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(cam.fov)*0.5);
      const desiredWidth=Math.min(visibleHeight*cam.aspect*0.82,visibleHeight*0.84/0.7);
      mesh.position.lerpVectors(saved.current.position,target.current,t);
      mesh.quaternion.copy(saved.current.quaternion).slerp(cam.quaternion,t);
      mesh.scale.copy(saved.current.scale).lerp(target.current.setScalar(desiredWidth/width),t);
      face.current.opacity=THREE.MathUtils.lerp(saved.current.opacity,1,t);
      face.current.color.setScalar(THREE.MathUtils.lerp(0.94,1.04,t));
    }else{
      captured.current=false;
      mesh.position.copy(placement.position);mesh.position.y+=Math.sin(floatTime.current)*0.025;
      mesh.rotation.set(0.015,placement.rotationY,index%2?0.018:-0.018);
      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x,1+focus*0.03,4,dt));
      face.current.opacity=THREE.MathUtils.damp(face.current.opacity,(0.80+focus*0.10)*(interaction.selected!==null?0.65:1),4,dt);
      const brightness=THREE.MathUtils.damp(face.current.color.r,1,4,dt);face.current.color.setScalar(brightness);
    }
  });
  return <group ref={group} name={`spiral-photo-${index+1}`} userData={{excludeFromRefraction:true}} position={placement.position} rotation={[0.015,placement.rotationY,0]} onPointerUp={event=>{if(event.delta>6)return;event.stopPropagation();if(!interaction.locked.current)interaction.open(index);}} onClick={event=>{event.stopPropagation();if(!interaction.locked.current)interaction.open(index);}} onPointerOver={event=>{event.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)}>
    <RoundedBox raycast={()=>{}} args={[width+0.16,height+0.16,0.10]} radius={0.045} smoothness={2} position={[0,0,-0.055]} renderOrder={selected?900:0}>
      <meshPhysicalMaterial
        color="#EAF6FF"
        emissive="#5BF2E6"
        emissiveIntensity={0.025}
        transparent
        opacity={0.24}
        transmission={1}
        roughness={0.2}
        thickness={1.8}
        ior={1.45}
        reflectivity={1}
        clearcoat={0.8}
        clearcoatRoughness={0.08}
        metalness={0}
        envMapIntensity={1.2}
        depthWrite={false}
        depthTest={!selected}
      />
    </RoundedBox>
    <mesh position={[0,0,0.06]} renderOrder={selected?901:1}>
      <planeGeometry args={[imageWidth, imageHeight, 1, 1]} />
      <meshBasicMaterial ref={face} map={texture} side={THREE.DoubleSide} transparent opacity={0.8} depthWrite={false} toneMapped={false} depthTest={!selected} onBeforeCompile={shader=>{
        shader.uniforms.uWaveTime=wave.current.time;shader.uniforms.uDetail=wave.current.detail;
        shader.vertexShader='uniform float uWaveTime;uniform float uDetail;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z += sin(uWaveTime*0.5+abs(0.5-transformed.x)*3.0)*(0.018*(1.0-uDetail)+0.04*sin(uDetail*3.14159265));');
      }}/>
    </mesh>
  </group>;
}

