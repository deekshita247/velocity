"use client";
import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { wateryInputs } from "./wateryInputs";
const EnvironmentScene=lazy(()=>import('../featured/FeaturedBackground').then(m=>({default:m.EnvironmentScene})));
// One renderer serves both chapters. The existing gallery keeps its own scene.
export function WateryBackground(){
 const root=useRef<HTMLDivElement>(null),input=useRef(wateryInputs.featured),invalidate=useRef(()=>{});
 const [mounted,setMounted]=useState(false);const reduced=useReducedMotion();
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setMounted(true);observer.disconnect();}},{rootMargin:'600px'});['featured-projects','race-sequence','race-cylinder'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el);});return()=>observer.disconnect();},[]);
 useEffect(()=>{
  if(!mounted)return;let frame=0,visible=false;
  const zones=[{element:document.getElementById('featured-projects'),input:wateryInputs.featured},{element:document.getElementById('race-sequence'),input:wateryInputs.sequence},{element:document.getElementById('race-cylinder'),input:wateryInputs.cylinder}];
  const draw=()=>{frame=0;if(!visible)return;invalidate.current();if(!reduced)frame=requestAnimationFrame(draw);};
  const update=()=>{let strength=0;for(const zone of zones){if(!zone.element)continue;const r=zone.element.getBoundingClientRect(),fade=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight*.45),r.bottom/(innerHeight*.45)));if(fade>strength){strength=fade;input.current=zone.input;}}visible=strength>0;if(root.current){root.current.style.opacity=String(strength);root.current.dataset.chapter=input.current.sequence?'sequence':'featured';}if(visible&&!frame)frame=requestAnimationFrame(draw);};
  update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);window.addEventListener('pointermove',update,{passive:true});
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.removeEventListener('pointermove',update);};
 },[mounted,reduced]);
 return <div ref={root} className="shared-watery-background" aria-hidden="true">{mounted&&<Canvas dpr={[1,1.25]} frameloop="demand" onCreated={state=>{invalidate.current=state.invalidate}} gl={{antialias:false,alpha:false}} camera={{position:[0,0,5],fov:45}}><Suspense fallback={null}><EnvironmentScene input={input} reduced={!!reduced}/></Suspense></Canvas>}</div>;
}
