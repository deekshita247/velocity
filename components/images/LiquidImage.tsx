"use client";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useInView, useScroll, useVelocity, useSpring, type MotionValue } from "framer-motion";
import { Vector2, SRGBColorSpace } from "three";
import gsap from "gsap";
import { raceImage } from "../racing/raceData";
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
export function LiquidImage({active=true,warp=false,src=raceImage,interactive=true}:{active?:boolean;warp?:boolean;src?:string;interactive?:boolean}){
 const ref=useRef<HTMLDivElement>(null);const input=useRef({x:0,y:0,progress:0});const visible=useInView(ref,{margin:"60px"});const loaded=useInView(ref,{once:true,margin:"250px"});
 const {scrollY}=useScroll();const velocity=useVelocity(scrollY);const speed=useSpring(velocity,{stiffness:120,damping:25,mass:.4});
 useEffect(()=>{const value=input.current;return()=>{gsap.killTweensOf(value);};},[]);
 useEffect(()=>{if(!interactive)gsap.to(input.current,{progress:active?1:0,duration:.7,overwrite:true});},[active,interactive]);
 const hover=(value:number)=>gsap.to(input.current,{progress:value,duration:value?.65:.95,ease:"power3.out",overwrite:true});
 return <div ref={ref} className="full-image-effect" data-effect={warp?"velocity-warp":"liquid-hover"} tabIndex={interactive?0:undefined} role="img" aria-label={warp?"Photograph bends with scrolling speed":"Move or drag across the photograph to create liquid ripples"} onPointerEnter={()=>hover(1)} onPointerLeave={()=>hover(0)} onFocus={()=>hover(1)} onBlur={()=>hover(0)} onPointerDown={e=>{hover(1);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={()=>hover(0)} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=(e.clientX-r.left)/r.width*2-1;input.current.y=1-(e.clientY-r.top)/r.height*2;}}>
  <Image src={src} alt="Automotive motion study" fill sizes="(max-width:767px) 92vw, 70vw" style={{objectFit:"cover"}} draggable={false}/>
  {loaded&&<div className="full-image-canvas"><Canvas dpr={[1,1.25]} frameloop={active&&visible?"always":"never"} gl={{antialias:false,alpha:true}}><Suspense fallback={null}><Surface src={src} input={input} speed={speed} warp={warp}/></Suspense></Canvas></div>}
 </div>;
}
