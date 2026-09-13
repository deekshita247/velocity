"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, type ReactNode } from "react";
import { useInView } from "framer-motion";
import gsap from "gsap";
import { raceImage } from "../racing/raceData";
const LensCanvas = dynamic(()=>import("./LensCanvas"),{ssr:false});
export type LensPointer = {x:number;y:number;width:number;height:number};
class LensBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true}};
 render(){return this.state.failed?null:this.props.children;}
}

export function InspectionLens({enabled=true,compact=false}:{enabled?:boolean;compact?:boolean}) {
 const surface=useRef<HTMLDivElement>(null);const windowRef=useRef<HTMLDivElement>(null);const pointer=useRef<LensPointer>({x:.5,y:.5,width:1,height:1});
 const visible=useInView(surface,{margin:"50px"});const loaded=useInView(surface,{once:true,margin:"250px"});
 useEffect(()=>{
  const element=surface.current!;const lens=windowRef.current!;
  const xTo=gsap.quickTo(lens,"x",{duration:.18,ease:"power2.out"});const yTo=gsap.quickTo(lens,"y",{duration:.18,ease:"power2.out"});
  const move=(x:number,y:number,immediate=false)=>{
   const r=element.getBoundingClientRect();if(!r.width||!r.height)return;
   const size=Math.min(230,Math.max(120,r.width*.42));
   pointer.current.x=Math.max(0,Math.min(1,x));pointer.current.y=Math.max(0,Math.min(1,y));pointer.current.width=r.width;pointer.current.height=r.height;
   lens.style.width=`${size}px`;lens.style.height=`${size}px`;
   // Position belongs to the DOM event layer, not to a paused/failed WebGL renderer.
   const px=Math.max(0,Math.min(r.width-size,x*r.width-size/2));const py=Math.max(0,Math.min(r.height-size,y*r.height-size/2));
   if(immediate)gsap.set(lens,{x:px,y:py});else{xTo(px);yTo(py);}
   lens.style.backgroundPosition=`${x*100}% ${y*100}%`;
   element.dataset.lensX=String(pointer.current.x);element.dataset.lensY=String(pointer.current.y);
  };
  const onMove=(e:PointerEvent)=>{if(!enabled)return;const r=element.getBoundingClientRect();move((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);};
  const down=(e:PointerEvent)=>{if(!enabled)return;onMove(e);element.setPointerCapture(e.pointerId);};
  const up=(e:PointerEvent)=>{if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);};
  const key=(e:KeyboardEvent)=>{if(!e.key.startsWith("Arrow"))return;e.preventDefault();move(pointer.current.x+(e.key==="ArrowRight"?.05:e.key==="ArrowLeft"?-.05:0),pointer.current.y+(e.key==="ArrowDown"?.05:e.key==="ArrowUp"?-.05:0));};
  const resize=new ResizeObserver(()=>move(pointer.current.x,pointer.current.y,true));resize.observe(element);
  element.addEventListener("pointermove",onMove);element.addEventListener("pointerdown",down);element.addEventListener("pointerup",up);element.addEventListener("pointercancel",up);element.addEventListener("keydown",key);
  return()=>{xTo.tween.kill();yTo.tween.kill();resize.disconnect();element.removeEventListener("pointermove",onMove);element.removeEventListener("pointerdown",down);element.removeEventListener("pointerup",up);element.removeEventListener("pointercancel",up);element.removeEventListener("keydown",key);};
 },[enabled]);
 return <div ref={surface} className={`inspection-surface${compact?" inspection-compact":""}`} tabIndex={enabled?0:-1} role="application" aria-label="Square inspection lens. Move pointer, drag with touch, or use arrow keys.">
  <Image src={raceImage} alt="Porsche bodywork and wheel detail" fill sizes={compact?"(max-width:767px) 92vw, 68vw":"92vw"} draggable={false} style={{objectFit:"cover"}}/>
  <div ref={windowRef} className="inspection-window" style={{backgroundImage:`url(${raceImage})`}} aria-hidden="true">
   {loaded&&<LensBoundary><LensCanvas pointer={pointer} active={enabled&&visible}/></LensBoundary>}
  </div>
  <span className="race-lens-instruction race-meta">MOVE / DRAG TO INSPECT</span>
 </div>;
}
