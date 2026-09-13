"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { wateryInputs } from "../background/wateryInputs";
const frames=[
 {image:'/portfolio/c9.jpeg',title:'BRAKING POINT',subtitle:'FORMULA / 2026'},
 {image:'/portfolio/c13.jpeg',title:'LIGHTS OUT',subtitle:'ENDURANCE / 2026'},
 {image:'/portfolio/c3.jpg',title:'APEX HUNTER',subtitle:'GT / 2026'},
 {image:'/portfolio/c6.jpeg',title:'SLIPSTREAM',subtitle:'FORMULA / 2026'},
 {image:'/portfolio/c17.jpeg',title:'PIT WINDOW',subtitle:'GT / 2026'},
 {image:'/portfolio/c7.jpeg',title:'NIGHT STINT',subtitle:'AFTER HOURS / 2026'},
];
const smoothstep=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const wrap=(value:number)=>((value%frames.length)+frames.length)%frames.length;
export function RaceCylinderCarousel(){
 const section=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),panels=useRef<(HTMLButtonElement|null)[]>([]);
 const [selected,setSelected]=useState(0);
 const controls=useRef({target:0,progress:0,reduced:false});
 const clampFrame=(value:number)=>Math.max(0,Math.min(frames.length-1,value));
 const select=(index:number)=>{controls.current.target=index;};
 const step=(direction:number)=>{const c=controls.current;c.target=clampFrame(Math.round(c.target)+direction);};
 useEffect(()=>{
  const element=stage.current,chapter=section.current;if(!element||!chapter)return;
  const c=controls.current,media=matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,last=0,visible=false,height=320,mobile=false,index=0,suppressClick=false;
  const mouse={x:0,y:0,tx:0,ty:0};
  const drag={id:-1,start:0,last:0,time:0,velocity:0,moved:false};
  let wheelEnd:ReturnType<typeof setTimeout>|undefined;
  const pause=()=>{clearTimeout(wheelEnd);};
  const size=()=>{height=panels.current[0]?.offsetHeight??320;mobile=element.clientWidth<768;};
  const preference=()=>{c.reduced=media.matches;};
  const render=(time:number)=>{
   raf=0;if(!visible||document.hidden){last=0;return;}const dt=last?Math.min((time-last)/1000,.05):0;last=time;
   c.progress+=(c.target-c.progress)*(1-Math.exp(-(c.reduced?30:6)*dt));
   if(Math.abs(c.progress)>600){const cycles=Math.trunc(c.progress/frames.length)*frames.length;c.progress-=cycles;c.target-=cycles;}
   mouse.x+=(mouse.tx-mouse.x)*(1-Math.exp(-5*dt));mouse.y+=(mouse.ty-mouse.y)*(1-Math.exp(-5*dt));
   // Compress progress near each integer for a magnetic dwell at center.
   const roundedIndex=Math.round(c.progress),diff=c.progress-roundedIndex;
   const virtualActiveIndex=roundedIndex+Math.sign(diff)*Math.pow(Math.abs(diff)*2,4.2)/2;
   panels.current.forEach((panel,i)=>{if(!panel)return;const distance=wrap(i-virtualActiveIndex+frames.length/2)-frames.length/2,d=Math.abs(distance),sign=Math.sign(distance),segment=Math.min(2,Math.floor(d)),t=smoothstep(0,1,d-segment);
    const depths=[400,200,-80,-200],angles=[0,62,85,88];
    const z=(depths[segment]+(depths[segment+1]-depths[segment])*t)*(mobile?.26:1);
    const gap=mobile?30:45;
    const positions=[0,height+gap,(height+gap)*1.65,(height+gap)*2.6];
    const y=sign*(positions[segment]+(positions[segment+1]-positions[segment])*t);
    const focus=1-smoothstep(.1,1.05,d),tilt=c.reduced?0:focus*(mobile?.45:1);
    const rotateY=mouse.x*6*tilt,rotateX=sign*(angles[segment]+(angles[segment+1]-angles[segment])*t)-mouse.y*4*tilt;
    const scale=1-.14*smoothstep(0,2.5,d),opacity=1-smoothstep(1.35,2.7,d),shown=d<2.7;
    panel.style.transform=`translate(-50%,-50%) translate3d(0,${y.toFixed(3)}px,${z.toFixed(3)}px) rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    panel.style.opacity=String(opacity);panel.style.zIndex=String(100-Math.round(d*20));panel.style.visibility=shown?'visible':'hidden';panel.style.pointerEvents=shown?'auto':'none';panel.tabIndex=d<1.5?0:-1;panel.setAttribute('aria-hidden',String(!shown));panel.dataset.front=String(d<.5);
   });
   const next=wrap(Math.round(c.progress));if(next!==index){index=next;setSelected(next);}chapter.dataset.progress=c.progress.toFixed(3);
   const rect=chapter.getBoundingClientRect();wateryInputs.cylinder.scroll=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
   raf=requestAnimationFrame(render);
  };
  const start=()=>{if(visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else start();},{threshold:0});observer.observe(chapter);
  const resize=new ResizeObserver(size);resize.observe(element);size();preference();media.addEventListener('change',preference);document.addEventListener('visibilitychange',start);
  const down=(e:PointerEvent)=>{if(e.button!==0||!(e.target instanceof Element)||!e.target.closest('.race-cylinder-panel'))return;pause();drag.id=e.pointerId;drag.start=drag.last=e.clientY;drag.time=e.timeStamp;drag.velocity=0;drag.moved=false;suppressClick=false;};
  const move=(e:PointerEvent)=>{const r=element.getBoundingClientRect();mouse.tx=(e.clientX-r.left)/r.width*2-1;mouse.ty=(e.clientY-r.top)/r.height*2-1;wateryInputs.cylinder.x=e.clientX/innerWidth;wateryInputs.cylinder.y=1-e.clientY/innerHeight;
   if(drag.id!==e.pointerId)return;const dx=e.clientY-drag.last;if(Math.abs(e.clientY-drag.start)>6){drag.moved=true;suppressClick=true;element.setPointerCapture(e.pointerId);}if(drag.moved){c.target=clampFrame(c.target-dx/(height*.85));drag.velocity=Math.max(-4,Math.min(4,-dx/(height*.85)/Math.max(.008,(e.timeStamp-drag.time)/1000)));}drag.last=e.clientY;drag.time=e.timeStamp;
  };
  const up=(e:PointerEvent)=>{if(e.pointerId!==drag.id)return;if(drag.moved)c.target=clampFrame(Math.round(c.target+drag.velocity*.15));drag.id=-1;if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);pause();};
  const leave=()=>{mouse.tx=mouse.ty=0;};
  const click=(e:MouseEvent)=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}};
  const wheel=(e:WheelEvent)=>{
   if(e.ctrlKey||!e.deltaY||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;
   const overImage=e.target instanceof Element&&!!e.target.closest('.race-cylinder-panel');
   if(!overImage&&drag.id<0)return;
   const atStart=c.target<=.01,atEnd=c.target>=frames.length-1-.01;
   if((e.deltaY<0&&atStart)||(e.deltaY>0&&atEnd))return;
   e.preventDefault();pause();
   const units=e.deltaMode===1?16:e.deltaMode===2?element.clientHeight:1;
   c.target=clampFrame(c.target+e.deltaY*units/(height*1.4));
   wheelEnd=setTimeout(()=>{c.target=Math.round(c.target);},160);
  };
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('pointerleave',leave);element.addEventListener('click',click,true);element.addEventListener('wheel',wheel,{passive:false});
  return()=>{clearTimeout(wheelEnd);cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',start);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('pointerleave',leave);element.removeEventListener('click',click,true);element.removeEventListener('wheel',wheel);};
 },[]);
 return <section ref={section} id="race-cylinder" className="race-cylinder race-chapter" aria-label="Race photographs in the round">
  <header className="cylinder-heading"><span className="race-meta">05 / RACE FRAMES</span><h2>MOTION IN<br/><em>THE ROUND.</em></h2><p>Six frames. One continuous orbit.</p></header>
  <div ref={stage} className="cylinder-stage" role="region" aria-roledescription="carousel" aria-label="Drag vertically to explore race photographs" onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();step(1)}if(e.key==='ArrowUp'){e.preventDefault();step(-1)}}}>
   {frames.map((frame,i)=><button key={frame.image} ref={el=>{panels.current[i]=el;}} className="race-cylinder-panel" data-front={i===0?'true':'false'} onClick={()=>select(i)} aria-label={`Center ${frame.title}`} tabIndex={i===0?0:-1}>
    <Image src={frame.image} alt={frame.title} fill sizes="(max-width:767px) 82vw, (max-width:1263px) 480px, 38vw" style={{objectFit:'cover'}} draggable={false}/><span className="cylinder-panel-caption"><small>0{i+1}</small><span>{frame.title}</span></span>
   </button>)}
  </div>
  <div className="cylinder-bottom"><div className="cylinder-active-caption"><span className="race-meta">0{selected+1} / 06 — {frames[selected].subtitle}</span><p>{frames[selected].title}</p></div><nav className="cylinder-controls" aria-label="Race frame navigation"><button onClick={()=>step(-1)} aria-label="Previous race frame">←</button><button onClick={()=>select(0)}>RESET FRAME</button><button onClick={()=>step(1)} aria-label="Next race frame">→</button></nav><p className="cylinder-hint">DRAG VERTICALLY / SCROLL TO ROTATE</p></div>
  <footer className="race-footer"><span className="race-meta">THE PURSUIT CONTINUES</span><a href="#">VELOCITY ↗</a><div className="race-meta"><span>MOTORSPORT / IMAGE MAKING</span><span>UAE / GLOBAL</span><span>© 2026</span></div></footer>
 </section>;
}
