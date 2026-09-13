"use client";
import { motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";
import { RaceImageEffect, type RaceEffect } from "./effects/RaceImageEffect";
import { photographs, type Photograph } from "@/components/gallery/galleryData";

const CategoryRow = memo(function CategoryRow({photo,index,active,activate}:{photo:Photograph;index:number;active:boolean;activate:(index:number)=>void}){
 const row=useRef<HTMLElement>(null);const reduced=useReducedMotion();
 return <article ref={row} className={`velocity-category${active?' is-active':''}`}>
  <h3><motion.button onClick={()=>activate(index)} aria-expanded={active} aria-controls={`category-${index}`} whileHover="hover" initial="rest" animate={active?'hover':'rest'}>
   <motion.span className="velocity-category-index" variants={{rest:{x:0},hover:{x:-5}}}>0{index+1}</motion.span>
   <motion.span className="velocity-heading-mask" initial="masked" whileInView="revealed" viewport={{once:true}}><motion.span style={{display:'block'}} variants={{masked:{y:'105%'},revealed:{y:0}}} transition={{duration:reduced?0:0.6}}><motion.span className="velocity-category-title" >{photo.title}</motion.span></motion.span></motion.span>
   <motion.span className="velocity-category-symbol" aria-hidden="true" animate={{rotate:active?45:0}}>+</motion.span>
  </motion.button></h3>
  <motion.div id={`category-${index}`} key="content" className="velocity-category-reveal" inert={!active} aria-hidden={!active} initial={false} animate={{height:active?'auto':0,opacity:active?1:0}} transition={{duration:reduced?0:0.45,ease:[0.16,1,0.3,1]}}>
   <div className="velocity-category-content">
    <div className="velocity-category-image"><RaceImageEffect effect={photo.effect as RaceEffect} active={active}/></div>
    <motion.div className="velocity-category-copy" initial="hidden" animate={active?"visible":"hidden"} variants={{hidden:{},visible:{transition:{staggerChildren:0.12,delayChildren:0.15}}}}>
     <motion.span variants={{hidden:{opacity:0,y:14},visible:{opacity:1,y:0}}}>SELECTED SERIES / 0{index+1}</motion.span>
     <motion.h4 variants={{hidden:{opacity:0,y:18},visible:{opacity:1,y:0}}}>{photo.name}</motion.h4>
     <motion.p variants={{hidden:{opacity:0,y:18},visible:{opacity:1,y:0}}}>{photo.description}</motion.p>
     <motion.span className="velocity-category-caption" variants={{hidden:{opacity:0,y:14},visible:{opacity:1,y:0}}}>MOTORSPORT / IMAGE MAKING<br/>VELOCITY / 2026</motion.span>
    </motion.div>
   </div>
  </motion.div>
 </article>;
});
export function AccordionSection(){
 const [active,setActive]=useState<number|null>(0);const activate=useCallback((index:number)=>setActive(current=>current===index?null:index),[]);
 return <section id="archive" className="velocity-archive">
  <motion.header className="velocity-archive-header" initial={{opacity:0,y:45}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.2}} transition={{duration:1}}>
   <span className="chromatic-text">02 / THE RACING LINE</span><h2>On the edge.<br/><em>In the frame.</em></h2><p>Five perspectives on speed. One continuous pursuit.</p>
  </motion.header>
  <div>{photographs.slice(0,5).map((photo,index)=><CategoryRow key={photo.title} photo={photo} index={index} active={active===index} activate={activate}/>)}</div>
  <div className="race-section-carry"><span>FROM THE SILHOUETTE</span><span>INTO THE SURFACE &#8595;</span></div>
 </section>;
}

