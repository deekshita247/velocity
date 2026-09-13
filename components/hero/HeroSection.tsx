"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { DisintegrationCanvas } from "./DisintegrationCanvas";

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const y = useTransform(scrollYProgress, [.8, 1], [0, -24]);
  const opacity = useTransform(scrollYProgress, [0, .8, 1], [1, 1, 0]);
  const pointerEvents = useTransform(scrollYProgress, p => p > .98 ? "none" as const : "auto" as const);
  return (
    <section ref={ref} id="hero-transition" className="hero-disintegrate-section" aria-label="Velocity photography">
      <div className="hero-sticky velocity-hero">
      <div className="velocity-hero-photo">
        <Image src="/portfolio/c13.jpeg" alt="Purple endurance race car on circuit" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 55%" }} />
      </div>
      <div className="velocity-hero-shade" />
      <DisintegrationCanvas track={ref}/>
      <motion.div className="hero-interface" style={{opacity,pointerEvents}}>
      <div className="velocity-light-streak" />
      <nav className="velocity-nav"><a href="#">V /</a><span>MOTORSPORT / IMAGE MAKING</span><a href="#archive">SELECTED WORK &#8599;</a></nav>
      <motion.div className="velocity-hero-title" style={{ y: reduced ? 0 : y, translateY: "-30%" }}>
        <p className="velocity-kicker">SELECTED MOTORSPORT PHOTOGRAPHY</p>
        <motion.h1 initial={{ opacity: 0, scale: 0.94, letterSpacing: "-0.02em" }} animate={{ opacity: 1, scale: 1, letterSpacing: "-0.075em" }} whileHover={{ letterSpacing: "-0.055em", textShadow: "-2px 0 20px #5bf2e620, 2px 0 30px #955bfa22" }} transition={{ duration: reduced ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}>VELOCITY</motion.h1>
        <div className="velocity-hero-meta"><span>FRAGMENTS OF A WORLD IN MOTION</span><span>DUBAI · AVAILABLE WORLDWIDE</span></div>
      </motion.div>
      <a className="velocity-explore" href="#spinal-gallery">SCROLL TO EXPLORE <span>&#8595;</span></a>
      <span className="velocity-hero-edition">SELECTED WORK / 2026</span>
      </motion.div>
      </div>
    </section>
  );
}
