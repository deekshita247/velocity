"use client";
import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { markCriticalAsset } from "../loading/criticalAssets";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Port of the supplied pixel-bucket effect: same distribution, repetition and timeline.
// The capture contains one local image, so drawImage replaces html2canvas without a DOM rasterizer.
export function DisintegrationCanvas({ track }: { track: RefObject<HTMLElement | null> }) {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const root=host.current,section=track.current;if(!root||!section)return;
  let disposed=false,frame=0,timer=0,generation=0;
  let context:gsap.Context|undefined;
  const photo=new Image();photo.src="/portfolio/c13.jpeg";
  const clear=()=>{context?.revert();context=undefined;root.replaceChildren();section.removeAttribute('data-fragments-ready');};
  const build=async()=>{
   const version=++generation;cancelAnimationFrame(frame);clear();
   try{await photo.decode();}catch{return;}if(disposed||version!==generation)return;
   const count=innerWidth<768?40:75,repeat=3;
   const width=Math.min(innerWidth,innerWidth<768?420:720),height=Math.round(width*innerHeight/innerWidth);
   const capture=document.createElement('canvas');capture.width=width;capture.height=height;
   const ctx=capture.getContext('2d',{willReadFrequently:true});if(!ctx)return;
   const scale=Math.max(width/photo.width,height/photo.height),dw=photo.width*scale,dh=photo.height*scale;
   ctx.drawImage(photo,(width-dw)/2,(height-dh)*.55,dw,dh);
   const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'rgba(8,11,18,.20)');shade.addColorStop(1,'rgba(8,11,18,.72)');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
   const pixels=ctx.getImageData(0,0,width,height);
   const buckets=Array.from({length:count},()=>ctx.createImageData(width,height));
   let x=0;
   const distribute=()=>{
    if(disposed||version!==generation)return;
    // Yield between columns to keep input responsive while preparing the masks.
    const end=Math.min(width,x+32);
    for(;x<end;x++)for(let y=0;y<height;y++)for(let l=0;l<repeat;l++){
     const index=(x+y*width)*4;
     const dataIndex=Math.floor(count*(Math.random()+2*x/width)/3);
     for(let p=0;p<4;p++)buckets[dataIndex].data[index+p]=pixels.data[index+p];
    }
    if(x<width){frame=requestAnimationFrame(distribute);return;}
    const canvases=buckets.map(data=>{const c=document.createElement('canvas');c.width=width;c.height=height;c.className='hero-fragment';c.getContext('2d')!.putImageData(data,0,0);root.appendChild(c);return c;});
    context=gsap.context(()=>{
     const tl=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true}});
     canvases.forEach((canvas,i)=>{const angle=(Math.random()-.5)*2*Math.PI;tl.to(canvas,{duration:1,rotation:30*(Math.random()-.5),x:40*Math.sin(angle),y:40*Math.cos(angle),opacity:0},i/count*2);});
     tl.progress(tl.scrollTrigger?.progress??0);
    },root);
    section.setAttribute('data-fragments-ready','true');markCriticalAsset('hero-fragments');
   };
   distribute();
  };
  let lastWidth=innerWidth,lastHeight=innerHeight;
  const resize=()=>{if(innerWidth===lastWidth&&Math.abs(innerHeight-lastHeight)<100)return;lastWidth=innerWidth;lastHeight=innerHeight;clearTimeout(timer);timer=window.setTimeout(build,180);};
  void build();window.addEventListener('resize',resize);
  return()=>{disposed=true;generation++;cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener('resize',resize);clear();};
 },[track]);
 return <div ref={host} className="hero-fragments" aria-hidden="true"/>;
}
