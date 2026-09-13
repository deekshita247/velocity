"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef, type RefObject } from "react";
import { MathUtils, ShaderMaterial, Vector2 } from "three";
import type { LensPointer } from "./InspectionLens";
import { raceImage } from "../racing/raceData";
import { lensFragment, lensVertex } from "./LensMaterial";
function OpticalSurface({pointer}:{pointer:RefObject<LensPointer>}) {
 const [photo,normalMap]=useTexture([raceImage,"/assets/reference/waternormals.jpg"]);const material=useRef<ShaderMaterial>(null);const size=useThree(s=>s.size);
 const uniforms=useMemo(()=>({photo:{value:photo},normalMap:{value:normalMap},resolution:{value:new Vector2()},imageSize:{value:new Vector2((photo.image as HTMLImageElement).width,(photo.image as HTMLImageElement).height)},lens:{value:new Vector2(.5,.5)},time:{value:0},lensSize:{value:220}}),[photo,normalMap]);
 useFrame(({clock},delta)=>{if(!material.current)return;const u=material.current.uniforms;u.resolution.value.set(pointer.current.width,pointer.current.height);u.lensSize.value=size.width;u.time.value=clock.elapsedTime;u.lens.value.x=MathUtils.damp(u.lens.value.x,pointer.current.x,12,Math.min(delta,.05));u.lens.value.y=MathUtils.damp(u.lens.value.y,1-pointer.current.y,12,Math.min(delta,.05));});
 return <mesh frustumCulled={false}><planeGeometry args={[2,2]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader={lensVertex} fragmentShader={lensFragment} toneMapped={false}/></mesh>;
}
export default function LensCanvas({pointer,active}:{pointer:RefObject<LensPointer>;active:boolean}) {
 return <Canvas dpr={[1,1.25]} frameloop={active?"always":"never"} gl={{antialias:false,alpha:true}}><Suspense fallback={null}><OpticalSurface pointer={pointer}/></Suspense></Canvas>;
}
