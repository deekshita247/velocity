"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { Vector2, SRGBColorSpace } from "three";
import { usePageVisible, useMobileDevice } from "../performance/deviceState";
const Material=shaderMaterial({uTexture:null,uDisplacementMap:null,uProgress:0,uVelocity:0,uTime:0,uMouse:new Vector2(),uAspect:1},
 `varying vec2 vUv;uniform float uVelocity;void main(){vUv=uv;vec3 p=position;float drag=abs(uVelocity)*pow(abs(p.y),2.);p.z-=drag*.65;p.y*=1.+abs(uVelocity)*.06;gl_Position=vec4(p.xy/(1.-p.z*.35),p.z*.1,1.);}`,
 `uniform sampler2D uTexture;uniform sampler2D uDisplacementMap;uniform float uProgress,uTime,uAspect,uVelocity;uniform vec2 uMouse;varying vec2 vUv;
 void main(){vec2 uv=vUv;vec2 mouse=uMouse*.5+.5;vec2 d=uv-mouse;float r=length(d);vec2 n=texture2D(uDisplacementMap,uv*.8+uTime*.012).rg-.5;
 uv+=uProgress*(n*.055+d/max(r,.01)*sin(r*32.-uTime*3.)*.018*exp(-r*1.8));uv.y+=uVelocity*.014;
 float a=uAspect/(10./7.);uv=(uv-.5)*vec2(min(a,1.),min(1./a,1.))+.5;
 vec2 shift=vec2(uProgress*.003+abs(uVelocity)*.002,0.);gl_FragColor=vec4(texture2D(uTexture,uv+shift).r,texture2D(uTexture,uv).g,texture2D(uTexture,uv-shift).b,1.);
 #include <colorspace_fragment>
 }`);
function Surface({input,speed,warp,src}:{src:string;input:React.RefObject<{x:number;y:number;progress:number}>;speed:MotionValue<number>;warp:boolean}){
 const [photo,noise]=useTexture([src,"/assets/reference/waternormals.jpg"],textures=>{textures[0].colorSpace=SRGBColorSpace});
 const material=useMemo(()=>new Material(),[]);const materialRef=useRef<InstanceType<typeof Material>>(null);
 useEffect(()=>()=>material.dispose(),[material]);
 useFrame(({clock,size})=>{if(!materialRef.current)return;const uniforms=materialRef.current.uniforms;uniforms.uTexture.value=photo;uniforms.uDisplacementMap.value=noise;uniforms.uProgress.value=input.current.progress;uniforms.uMouse.value.set(input.current.x,input.current.y);uniforms.uTime.value=clock.elapsedTime;uniforms.uAspect.value=size.width/size.height;uniforms.uVelocity.value=warp?Math.max(-1.8,Math.min(1.8,speed.get()/1500)):0;});
 return <mesh><planeGeometry args={[2,2,32,32]}/><primitive ref={materialRef} object={material} attach="material"/></mesh>;
}

export default function LiquidCanvas({src,input,speed,warp,active}:{src:string;input:RefObject<{x:number;y:number;progress:number}>;speed:MotionValue<number>;warp:boolean;active:boolean}) {
 const pageVisible=usePageVisible(),mobile=useMobileDevice();
 return <Canvas dpr={mobile?1:[1,1.25]} frameloop={active&&pageVisible?"always":"never"} gl={{antialias:false,alpha:true}}><Suspense fallback={null}><Surface src={src} input={input} speed={speed} warp={warp}/></Suspense></Canvas>;
}
