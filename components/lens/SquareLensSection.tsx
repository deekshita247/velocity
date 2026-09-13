"use client";
import { LiquidImage } from "../images/LiquidImage";
export function SquareLensSection(){
 return <section className="race-lens race-chapter" id="race-lens">
  <header className="race-chapter-header"><span className="race-meta">03 / DETAILS AT 300 KM/H</span><h2>DETAILS AT<br/><span>300 KM/H</span></h2><p>Speed hides complexity. Move across the image to uncover the surfaces, heat and engineering beneath the silhouette.</p></header>
  <div className="editorial-liquid"><LiquidImage src="/portfolio/c18.jpeg" /></div>
  <div className="race-section-carry"><span>ONE SURFACE. A THOUSAND FRAMES.</span><a href="#race-sequence">FOLLOW THE SEQUENCE &#8594;</a></div>
 </section>;
}
