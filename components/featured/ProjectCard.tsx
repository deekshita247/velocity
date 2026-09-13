"use client";
import Image from "next/image";
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { LiquidImage } from "../images/LiquidImage";
export type Project={title:string;description:string;image:string;detail:string};
export function ProjectCard({project,index,onHover,onOpen}:{project:Project;index:number;onHover:(value:number)=>void;onOpen:()=>void}){
 const ref=useRef<HTMLButtonElement>(null),reduced=useReducedMotion();const [hover,setHover]=useState(false);
 const x=useMotionValue(0),y=useMotionValue(0),sx=useSpring(x,{stiffness:110,damping:22}),sy=useSpring(y,{stiffness:110,damping:22});
 const {scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});
 const drift=useTransform(scrollYProgress,[0,1],[index%2?22:12,index%2?-22:-12]);const photoY=useTransform(scrollYProgress,[0,1],['-3%','3%']);
 const tiltX=useTransform(sy,[-1,1],[3,-3]),tiltY=useTransform(sx,[-1,1],[-3,3]);const photoX=useTransform(sx,[-1,1],[-12,12]);
 const visible=useInView(ref,{margin:'100px'});
 return <motion.button ref={ref} className={`featured-card featured-card-${index+1}`} data-hover-effect={['parallax','tilt','liquid','rgb'][index]} style={{y:reduced?0:drift,rotateX:index===1&&!reduced?tiltX:0,rotateY:index===1&&!reduced?tiltY:0}} initial={{opacity:0,translateY:45}} whileInView={{opacity:1,translateY:0}} viewport={{once:true,amount:.12}} transition={{duration:reduced?0:1,delay:index%2*.14,ease:[.16,1,.3,1]}} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();x.set((e.clientX-r.left)/r.width*2-1);y.set((e.clientY-r.top)/r.height*2-1);}} onPointerEnter={()=>{setHover(true);onHover(1)}} onPointerLeave={()=>{setHover(false);onHover(0);x.set(0);y.set(0)}} onFocus={()=>{setHover(true);onHover(1)}} onBlur={()=>{setHover(false);onHover(0)}} onClick={onOpen} aria-label={`View ${project.title}`}>
  <div className="featured-card-media"><motion.div className="featured-main-image" style={{x:index===0&&!reduced?photoX:0,y:reduced?0:photoY}} initial={{scale:1.08}} whileInView={{scale:1}} viewport={{once:true}} transition={{duration:1.4,ease:[.16,1,.3,1]}}>
   <Image src={project.image} alt={project.title} fill sizes="(max-width:767px) 92vw, 52vw" style={{objectFit:'cover'}}/>
   {index===2&&<div className="featured-liquid" style={{opacity:hover?1:0}}><LiquidImage src={project.image} active={hover&&visible} interactive={false}/></div>}
   {index===3&&<><div className="featured-rgb red" style={{backgroundImage:`url(${project.image})`}}/><div className="featured-rgb cyan" style={{backgroundImage:`url(${project.image})`}}/></>}
  </motion.div><div className="featured-card-shade"/><span className="featured-card-index">0{index+1} / SELECTED FRAME</span><span className="featured-view">VIEW <i>↗</i></span></div>
  <div className="featured-card-copy"><div><h3>{project.title}</h3><p>{project.description}</p></div><div className="featured-detail-thumb"><Image src={project.detail} alt={`${project.title}, second study`} fill sizes="96px" style={{objectFit:'cover'}}/></div></div>
 </motion.button>;
}
