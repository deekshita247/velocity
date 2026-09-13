"use client";
import { motion, useReducedMotion } from "framer-motion";
import { raceImage } from "../../racing/raceData";
export function MaskRevealRaceImage({active}:{active:boolean}){
 const reduced=useReducedMotion();const transition={duration:reduced?0:.8,ease:[.16,1,.3,1] as const};
 return <div className="race-effect" data-effect="slice-reveal">
  {Array.from({length:8},(_,i)=><motion.div key={i} className="grid-photo-slice" style={{left:0,width:"100%",clipPath:`inset(0 ${100-(i+1)*12.5}% 0 ${i*12.5}%)`,backgroundSize:"cover",backgroundImage:`url(${raceImage})`,backgroundPosition:"center"}} initial={false} animate={{y:active?"0%":i%2?"-105%":"105%"}} transition={{duration:reduced?0:.75,delay:active?i*.045:0,ease:[.16,1,.3,1]}}/>)}
  <motion.div className="grid-scan-track" initial={false} animate={{x:active?"100%":"0%",opacity:active?[1,1,0]:0}} transition={transition}><span/></motion.div>
 </div>;
}
