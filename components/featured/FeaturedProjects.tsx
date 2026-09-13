"use client";
import Image from "next/image";
import { motion, useInView, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ProjectCard, type Project } from "./ProjectCard";
import { wateryInputs, type WateryInput } from "../background/wateryInputs";

type FeaturedInput = WateryInput;
const projects:Project[]=[
 {title:'APEX MOMENTS',description:'Race cars captured at maximum lateral load and commitment.',image:'/portfolio/c14.jpeg',detail:'/portfolio/c10.jpeg'},
 {title:'GRID PRESSURE',description:'The stillness before launch, where tension builds before movement.',image:'/portfolio/c11.jpeg',detail:'/portfolio/c15.jpeg'},
 {title:'PITLANE PRECISION',description:'Split-second coordination, tyres, tools and mechanical choreography.',image:'/portfolio/c12.jpeg',detail:'/portfolio/c16.jpeg'},
 {title:'NIGHT STINT',description:'Headlights, brake glow and illuminated asphalt after dark.',image:'/portfolio/c13.jpeg',detail:'/portfolio/c17.jpeg'},
];
export function FeaturedProjects(){
 const section=useRef<HTMLElement>(null),dialog=useRef<HTMLDialogElement>(null),input=useRef<FeaturedInput>(wateryInputs.featured);
 const [selected,setSelected]=useState<number|null>(null);const reduced=useReducedMotion();
 const entered=useInView(section,{once:true,amount:.08});

 const {scrollYProgress}=useScroll({target:section,offset:['start end','end start']});useMotionValueEvent(scrollYProgress,'change',v=>{input.current.scroll=v;});
 useEffect(()=>{if(selected!==null)dialog.current?.showModal();},[selected]);
 return <section id="featured-projects" ref={section} className="featured-projects" onPointerMove={e=>{input.current.x=e.clientX/innerWidth;input.current.y=1-e.clientY/innerHeight;input.current.active=1;}} onPointerLeave={()=>{input.current.active=0;input.current.highlight=0;}} onPointerDown={e=>{input.current.x=e.clientX/innerWidth;input.current.y=1-e.clientY/innerHeight;input.current.active=1;}}>
  <div id="archive" className="featured-content">
   <header className="featured-heading"><motion.p className="race-meta" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:.8}}>02 / FEATURED PROJECTS</motion.p><div className="featured-title-mask"><motion.h2 initial={{y:'105%'}} animate={{y:entered?0:'105%'}} transition={{duration:reduced?0:1.1,ease:[.16,1,.3,1]}}>Featured<br/><em>projects</em></motion.h2></div><motion.p className="featured-intro" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:.3,duration:.9}}>CURATED FRAMES<br/>Four perspectives on the pursuit.</motion.p></header>
   <div className="featured-grid">{projects.map((project,index)=><ProjectCard key={project.title} project={project} index={index} onHover={v=>{input.current.highlight=v;}} onOpen={()=>setSelected(index)}/>)}</div>
   <footer className="featured-end race-meta"><span>VELOCITY / FIELD NOTES</span><span>FORM. PRESSURE. LIGHT.</span></footer>
  </div>
  <dialog ref={dialog} className="featured-dialog" onClose={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}} aria-label={selected===null?'Project photographs':projects[selected].title}>
   <button className="featured-dialog-close" onClick={()=>dialog.current?.close()}>CLOSE ×</button>
   {selected!==null&&<><h2>{projects[selected].title}</h2><div className="featured-dialog-images"><Image src={projects[selected].image} alt={projects[selected].title} width={1400} height={933} sizes="(max-width:767px) 86vw, 76vw" style={{width:"100%",height:"auto",objectFit:"cover"}}/></div><p>{projects[selected].description}</p></>}
  </dialog>
 </section>;
}
