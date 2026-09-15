"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useInView, useScroll, useVelocity, useSpring } from "framer-motion";
import gsap from "gsap";
import { raceImage } from "../racing/raceData";
const LiquidCanvas=dynamic(()=>import("./LiquidCanvas"));
export function LiquidImage({active=true,warp=false,src=raceImage,interactive=true,sizes="92vw"}:{active?:boolean;warp?:boolean;src?:string;interactive?:boolean;sizes?:string}){
 const ref=useRef<HTMLDivElement>(null);const input=useRef({x:0,y:0,progress:0});const visible=useInView(ref,{margin:"60px"});const loaded=useInView(ref,{once:true,margin:"250px"});
 const {scrollY}=useScroll();const velocity=useVelocity(scrollY);const speed=useSpring(velocity,{stiffness:120,damping:25,mass:.4});
 useEffect(()=>{const value=input.current;return()=>{gsap.killTweensOf(value);};},[]);
 useEffect(()=>{if(!interactive)gsap.to(input.current,{progress:active?1:0,duration:.7,overwrite:true});},[active,interactive]);
 const hover=(value:number)=>gsap.to(input.current,{progress:value,duration:value?.65:.95,ease:"power3.out",overwrite:true});
 return <div ref={ref} className="full-image-effect" data-effect={warp?"velocity-warp":"liquid-hover"} tabIndex={interactive?0:undefined} role="img" aria-label={warp?"Photograph bends with scrolling speed":"Move or drag across the photograph to create liquid ripples"} onPointerEnter={()=>hover(1)} onPointerLeave={()=>hover(0)} onFocus={()=>hover(1)} onBlur={()=>hover(0)} onPointerDown={e=>{hover(1);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={()=>hover(0)} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=(e.clientX-r.left)/r.width*2-1;input.current.y=1-(e.clientY-r.top)/r.height*2;}}>
  <Image src={src} alt="Automotive motion study" fill sizes={sizes} style={{objectFit:"cover"}} draggable={false}/>
  {loaded&&<div className="full-image-canvas"><LiquidCanvas src={src} input={input} speed={speed} warp={warp} active={active&&visible}/></div>}
 </div>;
}
