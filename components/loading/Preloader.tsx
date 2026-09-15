"use client";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { criticalPercent,getCriticalSnapshot,getServerCriticalSnapshot,subscribeCriticalAssets } from "./criticalAssets";
let introCompleted=false;
export function Preloader(){
 const [visible,setVisible]=useState(()=>!introCompleted),[exiting,setExiting]=useState(false),[timedOut,setTimedOut]=useState(false);
 const root=useRef<HTMLDivElement>(null),number=useRef<HTMLSpanElement>(null),line=useRef<HTMLDivElement>(null),display=useRef({value:0});const reduced=useReducedMotion();
 const snapshot=useSyncExternalStore(subscribeCriticalAssets,getCriticalSnapshot,getServerCriticalSnapshot),progress=criticalPercent(snapshot);
 useLayoutEffect(()=>{
  if(!visible)return;const html=document.documentElement,body=document.body,main=document.querySelector('main');
  const oldHtml=html.style.overflow,oldBody=body.style.overflow,oldInert=main?.inert??false;
  html.style.overflow='hidden';body.style.overflow='hidden';if(main)main.inert=true;window.scrollTo(0,0);
  const prevent=(event:Event)=>event.preventDefault();const key=(e:KeyboardEvent)=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))e.preventDefault();};
  window.addEventListener('wheel',prevent,{passive:false});window.addEventListener('touchmove',prevent,{passive:false});window.addEventListener('keydown',key);
  return()=>{html.style.overflow=oldHtml;body.style.overflow=oldBody;if(main)main.inert=oldInert;window.removeEventListener('wheel',prevent);window.removeEventListener('touchmove',prevent);window.removeEventListener('keydown',key);};
 },[visible]);
 useEffect(()=>{if(!visible)return;const timeout=window.setTimeout(()=>{if(criticalPercent(getCriticalSnapshot())===100)return;setTimedOut(true);setExiting(true);},8000);return()=>clearTimeout(timeout);},[visible]);
 useEffect(()=>{if(!visible)return;const value=display.current;const tween=gsap.to(value,{value:progress,duration:reduced?0:.35,ease:'power2.out',onUpdate:()=>{if(number.current)number.current.textContent=String(Math.round(value.value)).padStart(2,'0');if(line.current)line.current.style.transform=`scaleX(${value.value/100})`;},onComplete:()=>{if(progress===100)setExiting(true);}});return()=>{tween.kill();};},[progress,reduced,visible]);
 useEffect(()=>{if(!visible||!exiting)return;const context=gsap.context(()=>{gsap.set('.preloader-word',{animation:'none'});const tl=gsap.timeline({delay:.3,onComplete:()=>{window.scrollTo(0,0);introCompleted=true;setVisible(false);}});if(reduced)tl.to(root.current,{opacity:0,duration:.25});else tl.to('.preloader-word',{y:-25,letterSpacing:'.10em',opacity:0,duration:.65,ease:'power3.in'},0).to('.preloader-track',{scaleX:1.06,duration:.45},0).to(root.current,{clipPath:'inset(0 0 100% 0)',duration:1,ease:'power3.inOut'},.12);},root);return()=>context.revert();},[exiting,reduced,visible]);
 if(!visible)return null;
 return <div ref={root} className="velocity-preloader" data-progress={progress} data-loading-fallback={timedOut||undefined} role="status" aria-live="polite" aria-label="Loading Velocity">
  <div className="preloader-haze" aria-hidden="true"/><div className="preloader-center"><div className="preloader-word">VELOCITY</div><p>{timedOut?'ENTERING — ASSETS CONTINUE LOADING':exiting?'READY':'INITIALIZING RACE ENVIRONMENT'}</p><div className="preloader-percent" aria-hidden="true"><span ref={number}>00</span><small>%</small></div><div className="preloader-track" role="progressbar" aria-label="Critical assets loaded" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div ref={line}/></div></div><span className="preloader-edition">FORM / SPEED / LIGHT</span>
 </div>;
}
