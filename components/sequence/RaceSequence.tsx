"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, cubicBezier, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { raceFrames } from "../racing/raceData";
import { wateryInputs } from "../background/wateryInputs";
const sequenceImages=["/portfolio/c9.jpeg","/portfolio/c13.jpeg","/portfolio/c3.jpg","/portfolio/c6.jpeg","/portfolio/c17.jpeg","/portfolio/c7.jpeg"];
const sequenceFrames=raceFrames.map((frame,i)=>({...frame,image:sequenceImages[i]}));
const titles=["BRAKING POINT","LIGHTS OUT","APEX HUNTER","SLIPSTREAM","PIT WINDOW","NIGHT STINT"];
const cinematic=cubicBezier(.16,1,.3,1);
function SequenceCard({i,index,enter,progress,reduced,select}:{i:number;index:number;enter:MotionValue<number>;progress:MotionValue<number>;reduced:boolean;select:(index:number)=>void}){
 const distance=((i-index+9)%6)-3,angle=distance*Math.PI/4,center=distance===0,frame=sequenceFrames[i],delay=Math.min(Math.abs(distance)*.1,.25);
 const x=useTransform(enter,[delay,1],[Math.sign(distance)*100,0],{ease:cinematic});
 const entryY=useTransform(enter,[delay,1],[center?80:35,0],{ease:cinematic});
 const depth=useTransform(progress,[0,1],[center?20:35,center?-20:-35]);const y=useTransform(()=>entryY.get()+depth.get());
 const scale=useTransform(enter,[delay,1],[center?.88:1,1],{ease:cinematic}),opacity=useTransform(enter,[delay,1],[0,1],{ease:cinematic}),rotateY=useTransform(enter,[delay,1],[-Math.sign(distance)*12,0],{ease:cinematic});
 return <motion.div className="sequence-entry" style={{zIndex:6-Math.abs(distance),x:reduced?0:x,y:reduced?0:y,scale:reduced?1:scale,opacity:reduced?1:opacity,rotateY:reduced?0:rotateY}}>
  <motion.button className={`sequence-photo${center?' is-selected':''}`} aria-label={`Select ${titles[i]}`} aria-current={center?"true":undefined} tabIndex={Math.abs(distance)<3?0:-1} style={{zIndex:6-Math.abs(distance),pointerEvents:Math.abs(distance)<3?'auto':'none'}} initial={false} animate={{x:`${Math.sin(angle)*112}%`,z:(Math.cos(angle)-1)*380,scale:center?1:Math.abs(distance)===1?.8:.62,rotateY:-distance*28,opacity:Math.abs(distance)===3?0:center?1:Math.abs(distance)===1?.65:.22}} transition={{duration:reduced?0:.72,ease:[.16,1,.3,1]}} onClick={()=>select(i)}>
   <Image src={frame.image} alt={titles[i]} fill sizes="(max-width:767px) 76vw, 58vw" draggable={false} style={{objectFit:'cover',objectPosition:frame.position}}/>
   <span className="sequence-card-number">0{i+1}</span>
  </motion.button>
 </motion.div>;
}
export function RaceSequence(){
 const [index,setIndex]=useState(0),reduced=useReducedMotion();const section=useRef<HTMLElement>(null),header=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null);
 const {scrollYProgress:progress,scrollY}=useScroll({target:section,offset:['start end','end start']});const {scrollYProgress:heading}=useScroll({target:header,offset:['start end','start 25%']});const {scrollYProgress:enter}=useScroll({target:stage,offset:['start end','start 45%']});
 const velocity=useVelocity(scrollY),speed=useSpring(velocity,{stiffness:100,damping:25});useMotionValueEvent(speed,'change',v=>{wateryInputs.sequence.velocity=v;});useMotionValueEvent(progress,'change',v=>{wateryInputs.sequence.scroll=v;});
 const firstY=useTransform(heading,[0,.75],[70,0],{ease:cinematic}),firstOpacity=useTransform(heading,[0,.75],[0,1]);const secondY=useTransform(heading,[.15,1],[90,0],{ease:cinematic}),secondOpacity=useTransform(heading,[.15,1],[0,1]),tracking=useTransform(heading,[.15,1],['-.025em','-.06em']);
 const advance=(step:number)=>setIndex(current=>(current+step+6)%6);
 return <section ref={section} id="race-sequence" className="race-sequence race-chapter" data-index={index} onPointerMove={e=>{wateryInputs.sequence.x=e.clientX/innerWidth;wateryInputs.sequence.y=1-e.clientY/innerHeight;}}>
  <header ref={header} className="sequence-header"><span className="race-meta">04 / RACE SEQUENCE</span><h2><motion.span className="sequence-heading-first" style={{y:reduced?0:firstY,opacity:reduced?1:firstOpacity}}>CHOOSE YOUR</motion.span><motion.span className="sequence-heading-second" style={{y:reduced?0:secondY,opacity:reduced?1:secondOpacity,letterSpacing:reduced?'-.06em':tracking}}>RACING LINE.</motion.span></h2><p>Selected frames. One continuous pursuit.</p></header>
  <div ref={stage} className="sequence-stage" role="region" aria-label="Race photo carousel" aria-roledescription="carousel" onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();advance(1)}if(e.key==='ArrowLeft'){e.preventDefault();advance(-1)}}}>
   {sequenceFrames.map((frame,i)=><SequenceCard key={frame.id} i={i} index={index} enter={enter} progress={progress} reduced={!!reduced} select={setIndex}/>)}
  </div>
  <div className="sequence-caption" aria-live="polite"><motion.span key={index} className="race-meta" initial={{y:reduced?0:6,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.3}}>0{index+1} / 06</motion.span><div className="sequence-title-slot"><AnimatePresence mode="wait" initial={false}><motion.h3 key={index} initial={{y:reduced?0:24,opacity:0}} animate={{y:0,opacity:1}} exit={{y:reduced?0:-18,opacity:0}} transition={{duration:reduced?0:.25,ease:[.16,1,.3,1]}}>{titles[index]}</motion.h3></AnimatePresence></div><span className="race-meta">SELECTED FRAMES / 2026</span></div>
  <nav className="sequence-controls" aria-label="Change selected race photograph"><button onClick={()=>advance(-1)} aria-label="Previous photograph">&#8592;</button><button className="sequence-play" onClick={()=>advance(1)} aria-label="Advance photograph">&#9654;</button><button onClick={()=>advance(1)} aria-label="Next photograph">&#8594;</button></nav>
  <footer className="race-footer"><span className="race-meta">THE PURSUIT CONTINUES</span><a href="#">VELOCITY ↗</a><div className="race-meta"><span>MOTORSPORT / IMAGE MAKING</span><span>UAE / GLOBAL</span><span>© 2026</span></div></footer>
 </section>;
}
