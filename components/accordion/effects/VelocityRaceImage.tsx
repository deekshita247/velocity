"use client";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useVelocity, useReducedMotion } from "framer-motion";
import { raceImage } from "../../racing/raceData";
export function VelocityRaceImage({active}:{active:boolean}){
 const ref=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();const {scrollYProgress}=useScroll({target:ref,offset:["start end","end start"]});
 const speed=useVelocity(scrollYProgress);const y=useTransform(scrollYProgress,[0,1],["-8%","8%"]);
 const x=useTransform(speed,v=>Math.max(-18,Math.min(18,v*12)));const skewX=useTransform(speed,v=>Math.max(-3,Math.min(3,v*2)));const opacity=useTransform(speed,v=>Math.min(.18,Math.abs(v)*.1));
 return <div ref={ref} className="race-effect" data-effect="velocity-parallax"><motion.div className="race-effect-image velocity-effect-image" style={{y:active&&!reduced?y:0,x:active&&!reduced?x:0,skewX:active&&!reduced?skewX:0}}><Image src={raceImage} alt="VELOCITY — panning and aerodynamic form" fill sizes="(max-width:767px) 92vw, 68vw"/><motion.div className="velocity-echo" style={{opacity:active&&!reduced?opacity:0}}><Image src={raceImage} alt="" fill sizes="(max-width:767px) 92vw, 68vw"/></motion.div></motion.div></div>;
}
