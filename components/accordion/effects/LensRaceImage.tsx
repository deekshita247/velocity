"use client";
import { LiquidImage } from "../../images/LiquidImage";
export function LensRaceImage({active}:{active:boolean}){
 return <div className="race-effect" data-effect="liquid"><LiquidImage active={active}/></div>;
}
