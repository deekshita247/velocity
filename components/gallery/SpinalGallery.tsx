"use client";
import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useScroll } from "framer-motion";
import { GalleryScene } from "./GalleryScene";
import { createGalleryPath, getActivePhoto, getGalleryProgress, photographs } from "./galleryData";
import { GalleryInteraction, useGalleryInteraction } from "./GalleryInteraction";

class GalleryBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?<div className="velocity-gallery-fallback">The gallery could not load.<a href="#archive">Explore the photographic index</a></div>:this.props.children;}
}
function GalleryChapter(){
 const track=useRef<HTMLElement>(null);const closeButton=useRef<HTMLButtonElement>(null);const openButton=useRef<HTMLButtonElement>(null);
 const hadDetail=useRef(false);const scrollState=useRef({fixed:false,active:0});
 const [mobile,setMobile]=useState(false);const [active,setActive]=useState(0);
 const inputEvents=useMotionValue<"auto"|"none">("none");
 const chrome=useMotionValue<"visible"|"hidden">("hidden");
 const opacity=useMotionValue(1);const {selected,phase,locked,open,close}=useGalleryInteraction();
 useEffect(()=>{const query=matchMedia('(max-width: 767px)');const update=()=>setMobile(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const update=()=>{if(!track.current||locked.current)return;const rect=track.current.getBoundingClientRect();chrome.set(rect.top<=0&&rect.bottom>=innerHeight?"visible":"hidden");inputEvents.set(rect.top<=0&&rect.bottom>=innerHeight?"auto":"none");const nextFixed=rect.top<=0&&rect.bottom>-innerHeight;if(nextFixed!==scrollState.current.fixed){scrollState.current.fixed=nextFixed;}const hero=document.getElementById("hero-transition");const heroRect=hero?.getBoundingClientRect();const entrance=heroRect?Math.max(0,Math.min(1,(-heroRect.top/Math.max(1,heroRect.height-innerHeight)-.15)/.45)):Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight*.8)));opacity.set(entrance*Math.max(0,Math.min(1,(1-(-rect.top/Math.max(1,rect.height-innerHeight)))/0.10)));const nextActive=getActivePhoto(getGalleryProgress(-rect.top/Math.max(1,rect.height-innerHeight)));if(nextActive!==scrollState.current.active){scrollState.current.active=nextActive;setActive(nextActive);}};
  update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[locked,opacity,inputEvents,chrome]);
 useEffect(()=>{if(selected!==null){hadDetail.current=true;closeButton.current?.focus({preventScroll:true});}else if(phase==='closed'&&hadDetail.current){hadDetail.current=false;openButton.current?.focus({preventScroll:true});}},[selected,phase]);
 const nearby=useInView(track,{margin:'0px 0px 2500px 0px'});
 const {scrollYProgress}=useScroll({target:track,offset:['start start','end end']});
 const photo=selected===null?photographs[active]:photographs[selected];
 return <section ref={track} id="spinal-gallery" className="velocity-gallery" aria-label="Immersive spinal photography gallery">
  <motion.div className="velocity-gallery-stage" style={{position:'fixed',top:0,opacity,pointerEvents:inputEvents}}>
   <GalleryBoundary><Canvas dpr={mobile?1:[1,1.5]} frameloop={nearby?'always':'never'} camera={{position:createGalleryPath(mobile).getPointAt(0).toArray(),fov:mobile?68:52,near:0.1,far:65}} gl={{antialias:false,alpha:false,powerPreference:'high-performance'}} fallback={<div className="velocity-gallery-fallback">3D is unavailable. Explore the photographic index below.</div>}>
    <Suspense fallback={null}><ScrollControls enabled={false} pages={6} damping={mobile?0.2:0.15} style={{overflowY:'hidden',touchAction:'pan-y'}}><GalleryScene track={track}/></ScrollControls></Suspense>
   </Canvas></GalleryBoundary>
   <div className="velocity-gallery-vignette"/>
   <motion.div style={{visibility:chrome}} className="velocity-gallery-label chromatic-text"><span>01 / THE SPINAL GALLERY</span><span>SPEED HELD IN SUSPENSION</span></motion.div>
   <AnimatePresence>
    {selected===null?<motion.div key="browse" style={{visibility:chrome}} className="velocity-gallery-bottom" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <button ref={openButton} className="velocity-open-photo chromatic-text" onClick={()=>open(active)} aria-label={`Open ${photo.name}`}>{photo.title} / EXPLORE IMAGE &#8599;</button><a href="#archive">VIEW THE INDEX &#8599;</a>
    </motion.div>:<motion.div key="detail" className="velocity-detail-ui" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <button ref={closeButton} className="velocity-detail-close chromatic-text" data-cursor="close" onClick={close} aria-label="Close photograph">CLOSE &#215;</button>
      <div className="velocity-detail-caption" aria-live="polite"><span className="chromatic-text">{photo.name}</span><span>{photo.title} / MACHINE / MOTION / LIGHT</span></div>
    </motion.div>}
   </AnimatePresence>
   <motion.div className="velocity-gallery-progress" style={{scaleX:scrollYProgress,visibility:chrome}}/>
  </motion.div>
 </section>;
}
export function SpinalGallery(){return <GalleryInteraction><GalleryChapter/></GalleryInteraction>;}
