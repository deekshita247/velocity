"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { ShaderMaterial, SRGBColorSpace } from "three";
import { vertex,fragment } from "./transitionShaders";
function TransitionSurface({technique,progress,fromImage,toImage}:{technique:number;progress:RefObject<{value:number}>;fromImage:string;toImage:string}){
 const [previousPicture,picture]=useTexture([fromImage,toImage],textures=>{textures.forEach(t=>{t.colorSpace=SRGBColorSpace})});const material=useRef<ShaderMaterial>(null);
 const uniforms=useMemo(()=>({picture:{value:picture},previousPicture:{value:previousPicture},progress:{value:1},technique:{value:0}}),[picture,previousPicture]);
 const advance=useThree(s=>s.advance);
 useEffect(()=>{advance(performance.now()/1000);},[advance,picture,previousPicture]);
 useFrame(()=>{if(material.current){material.current.uniforms.progress.value=progress.current.value;material.current.uniforms.technique.value=technique;}});
 return <mesh><planeGeometry args={[2,2]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} toneMapped={false}/></mesh>;
}
export default function TransitionCanvas({technique,progress,running,fromImage,toImage}:{technique:number;progress:RefObject<{value:number}>;running:boolean;fromImage:string;toImage:string}){
 return <Canvas dpr={[1,1.25]} frameloop={running?"always":"never"} gl={{antialias:false,alpha:true}}><Suspense fallback={null}><TransitionSurface fromImage={fromImage} toImage={toImage} technique={technique} progress={progress}/></Suspense></Canvas>;
}
