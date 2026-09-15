"use client";

import dynamic from "next/dynamic";
import { Preloader } from "@/components/loading/Preloader";
import { WateryBackground } from "@/components/background/WateryBackground";
const FeaturedProjects=dynamic(()=>import("@/components/featured/FeaturedProjects").then(m=>m.FeaturedProjects));

import { HeroSection } from "@/components/hero/HeroSection";
import { HomeScrollReset } from "@/components/racing/HomeScrollReset";
import { SpinalGallery } from "@/components/gallery/SpinalGallery";
import { AmbientRaceBackground } from "@/components/background/AmbientRaceBackground";
const SquareLensSection=dynamic(()=>import("@/components/lens/SquareLensSection").then(m=>m.SquareLensSection));
const RaceCylinderCarousel=dynamic(()=>import("@/components/carousel/RaceCylinderCarousel").then(m=>m.RaceCylinderCarousel));
const RaceSequence=dynamic(()=>import("@/components/sequence/RaceSequence").then(m=>m.RaceSequence));

export default function Home() {
  return (
    <><link rel="preload" href="/assets/spine/spine.bin" as="fetch" crossOrigin="anonymous" />
    <link rel="preload" href="/assets/reference/waternormals.jpg" as="image" crossOrigin="anonymous" />
    <link rel="preload" href="/portfolio/c9.jpeg" as="image" crossOrigin="anonymous" />
    <Preloader/><main className="velocity-page">
      <WateryBackground/>
      <HomeScrollReset />
      <AmbientRaceBackground />
      <HeroSection />
      <SpinalGallery />
      <FeaturedProjects />
      <SquareLensSection />
      <RaceSequence />
      <RaceCylinderCarousel />
    </main></>
  );
}
