"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { raceImage } from "../../racing/raceData";
export function LightTrailRaceImage({active}:{active:boolean}){
 const reduced=useReducedMotion();const duration=reduced?0:1.1;
 return <div className="race-effect light-trail-effect" data-effect="light-trail">
  <Image src={raceImage} alt="AFTER DARK — light across the circuit" fill sizes="(max-width:767px) 92vw, 68vw" style={{opacity:.08}}/>
  <motion.div className="race-effect-image" initial={false} animate={{clipPath:active?"inset(0 0% 0 0)":"inset(0 100% 0 0)",opacity:active?.95:.08}} transition={{duration,ease:[.16,1,.3,1]}}><Image src={raceImage} alt="" fill sizes="(max-width:767px) 92vw, 68vw"/></motion.div>
  <motion.div className="race-light-trail" initial={false} animate={{x:active?"120%":"-100%",opacity:active?[0,1,0]:0}} transition={{duration,ease:[.16,1,.3,1]}}/>
  <motion.div className="race-light-dust" initial={false} animate={{opacity:active?.3:0}} transition={{duration}}/>
 </div>;
}
