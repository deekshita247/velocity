"use client";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { raceImage } from "../../racing/raceData";
export function RotatingRaceImage({active}:{active:boolean}){
 const ref=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();
 const {scrollYProgress}=useScroll({target:ref,offset:["start end","end start"]});
 const rotate=useTransform(scrollYProgress,[0,.5,1],[-12,0,8]);const scale=useTransform(scrollYProgress,[0,.5,1],[1.12,1,1.06]);
 return <div ref={ref} className="race-effect" data-effect="rotate-scroll"><motion.div className="race-effect-image" style={{rotate:active&&!reduced?rotate:0,scale:active&&!reduced?scale:1}}><Image src={raceImage} alt="APEX — commitment at the edge of grip" fill sizes="(max-width:767px) 92vw, 68vw"/></motion.div></div>;
}
