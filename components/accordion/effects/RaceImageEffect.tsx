import { RotatingRaceImage } from "./RotatingRaceImage";
import { MaskRevealRaceImage } from "./MaskRevealRaceImage";
import { VelocityWarpImage } from "../../images/VelocityWarpImage";
import { LensRaceImage } from "./LensRaceImage";
import { ParticleImage } from "../../images/ParticleImage";
export type RaceEffect="rotate-scroll"|"mask-reveal"|"velocity-parallax"|"lens"|"light-trail";
export function RaceImageEffect({effect,active}:{effect:RaceEffect;active:boolean}){
 switch(effect){
  case "rotate-scroll":return <RotatingRaceImage active={active}/>;
  case "mask-reveal":return <MaskRevealRaceImage active={active}/>;
  case "velocity-parallax":return <VelocityWarpImage active={active}/>;
  case "lens":return <LensRaceImage active={active}/>;
  case "light-trail":return <ParticleImage active={active}/>;
 }
}
