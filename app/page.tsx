"use client";

import { Preloader } from "@/components/loading/Preloader";
import { WateryBackground } from "@/components/background/WateryBackground";
import { FeaturedProjects } from "@/components/featured/FeaturedProjects";

import { HeroSection } from "@/components/hero/HeroSection";
import { HomeScrollReset } from "@/components/racing/HomeScrollReset";
import { SpinalGallery } from "@/components/gallery/SpinalGallery";
import { AmbientRaceBackground } from "@/components/background/AmbientRaceBackground";
import { SquareLensSection } from "@/components/lens/SquareLensSection";
import { RaceCylinderCarousel } from "@/components/carousel/RaceCylinderCarousel";
import { RaceSequence } from "@/components/sequence/RaceSequence";

export default function Home() {
  return (
    <><Preloader/><main className="velocity-page">
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
