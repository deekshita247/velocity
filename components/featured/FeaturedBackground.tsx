"use client";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, useTexture } from "@react-three/drei";
import { useMemo, useRef, type RefObject } from "react";
import { Group, MathUtils, Mesh, RepeatWrapping, ShaderMaterial, SRGBColorSpace, Vector2 } from "three";
import { referenceShaders } from "../gallery/effects/referenceShaders";
import type { WateryInput } from "../background/wateryInputs";
export type FeaturedInput=WateryInput;
const noise=referenceShaders['simplenoise.glsl'].replace(/#test Device\.mobile[\s\S]*?#endtest/g,'').replace(/#test !Device\.mobile/g,'').replace(/#endtest/g,'');
// GlobalComposite's normal-map frost and RGB sampling, adapted to a two-environment lens.
const fragment=`uniform sampler2D uBase,uNight,uNormal;uniform vec2 uSize,uMouse;uniform float uTime,uActive,uScroll,uHighlight,uBaseAspect,uNightAspect,uVelocity,uSequence;varying vec2 vUv;
${noise}
vec2 cover(vec2 uv,float aspect){float a=(uSize.x/uSize.y)/aspect;return (uv-.5)*vec2(min(a,1.),min(1./a,1.))+.5;}
void main(){
 vec2 normal=texture2D(uNormal,vUv*vec2(.8,.8+abs(uVelocity)*.035)+vec2(uTime*.008,-uTime*.004)+uMouse*uSequence*.006).rg-.5;
 vec2 p=(vUv-uMouse)*vec2(uSize.x/uSize.y,1.);
 float turbulence=cnoise(vUv*5.+uTime*.12);
 float radius=min(290.,uSize.x*.32)/uSize.y;
 float dist=length(p+normal*.04);
 float lens=(1.-smoothstep(radius-.045,radius+.045,dist+turbulence*.022))*uActive*(1.-uSequence);
 float edge=exp(-abs(dist-radius)*95.)*uActive*(1.-uSequence);
 vec2 uv=vUv+normal*.025+normal*lens*.045;uv.y+=uScroll*.035;
 vec3 base=texture2D(uBase,cover(uv,uBaseAspect)).rgb;
 vec2 nightUV=cover(uv,uNightAspect);vec2 rgb=normal*.005+vec2(edge*.004+uVelocity*.001,0.);
 vec3 night=vec3(texture2D(uNight,nightUV+rgb).r,texture2D(uNight,nightUV).g,texture2D(uNight,nightUV-rgb).b);
 float haze=cnoise(vUv*2.4+normal*.4+uTime*.035)*.5+.5;
 float ribbon=pow(.5+.5*sin(vUv.y*13.+haze*7.+uTime*.09),9.);
 vec3 oil=mix(vec3(.018,.11,.12),vec3(.085,.015,.15),haze);
 vec3 color=vec3(.0024,.0033,.006)+base*.022*(1.-uSequence)+oil*(.05+ribbon*.10)*(1.+uHighlight*.25);
 color+=uSequence*(oil*(.035+abs(uVelocity)*.008)+vec3(.10,.01,.08)*pow(haze,8.)*.035);
 float redRibbon=pow(.5+.5*sin((vUv.y+uVelocity*.003)*13.+haze*7.+uTime*.09),9.);
 float blueRibbon=pow(.5+.5*sin((vUv.y-uVelocity*.003)*13.+haze*7.+uTime*.09),9.);
 color.rb+=uSequence*oil.rb*(vec2(redRibbon,blueRibbon)-ribbon)*.1;
 color=mix(color,night*.30+oil*.15,lens*.92);
 color+=edge*mix(vec3(.03,.24,.20),vec3(.14,.025,.23),haze)*.13;
 float grain=fract(sin(dot(gl_FragCoord.xy+floor(uTime*12.),vec2(12.9898,78.233)))*43758.5453)-.5;
 gl_FragColor=vec4(color*(1.-uSequence*smoothstep(.3,.85,length(vUv-.5))*.55)+grain*.003,1.);
 #include <colorspace_fragment>
}`;
export function EnvironmentScene({input,reduced}:{input:RefObject<FeaturedInput>;reduced:boolean}){
 const base=useTexture('/portfolio/c8.jpeg',t=>{t.colorSpace=SRGBColorSpace;});
 const night=useTexture('/portfolio/c7.jpeg',t=>{t.colorSpace=SRGBColorSpace;});
 const normal=useTexture('/assets/reference/waternormals.jpg',t=>{t.wrapS=t.wrapT=RepeatWrapping;});
 const material=useRef<ShaderMaterial>(null),object=useRef<Mesh>(null),particles=useRef<Group>(null);
 const uniforms=useMemo(()=>({uVelocity:{value:0},uSequence:{value:0},uBase:{value:base},uNight:{value:night},uNormal:{value:normal},uSize:{value:new Vector2(1,1)},uMouse:{value:new Vector2(.5,.5)},uTime:{value:0},uActive:{value:0},uScroll:{value:0},uHighlight:{value:0},uBaseAspect:{value:(base.image as HTMLImageElement).width/(base.image as HTMLImageElement).height},uNightAspect:{value:(night.image as HTMLImageElement).width/(night.image as HTMLImageElement).height}}),[base,night,normal]);
 useFrame(({clock,size},delta)=>{
  if(!material.current)return;const u=material.current.uniforms,dt=Math.min(delta,.05),v=input.current;
  u.uSize.value.set(size.width,size.height);u.uMouse.value.x=MathUtils.damp(u.uMouse.value.x,v.x,5,dt);u.uMouse.value.y=MathUtils.damp(u.uMouse.value.y,v.y,5,dt);u.uTime.value=reduced?0:clock.elapsedTime;u.uActive.value=MathUtils.damp(u.uActive.value,v.active,4,dt);u.uScroll.value=v.scroll;u.uSequence.value=v.sequence?1:0;u.uVelocity.value=MathUtils.damp(u.uVelocity.value,reduced?0:MathUtils.clamp((v.velocity??0)/2000,-1.5,1.5),4,dt);u.uHighlight.value=MathUtils.damp(u.uHighlight.value,v.highlight,4,dt);
  if(particles.current){particles.current.position.y=v.scroll*.12;particles.current.rotation.z=reduced?0:clock.elapsedTime*.004+u.uVelocity.value*.006;}
  if(object.current){object.current.visible=!v.sequence;object.current.rotation.set(.3+(v.y-.5)*.15,reduced?0:clock.elapsedTime*.07+v.scroll*.65+(v.x-.5)*.2,.3);object.current.position.y=-.65+Math.sin(clock.elapsedTime*.2)*.04;object.current.scale.setScalar(MathUtils.damp(object.current.scale.x,.52,2,dt));}
 });
 return <>
  <mesh frustumCulled={false} renderOrder={-1000}><planeGeometry args={[2,2]}/><shaderMaterial ref={material} uniforms={uniforms} vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}" fragmentShader={fragment} depthWrite={false} depthTest={false}/></mesh>
  <mesh ref={object} name="featured-aerodynamic-sculpture" position={[0,-.65,0]} scale={.1}><torusKnotGeometry args={[.9,.12,96,12,2,3]}/><meshPhysicalMaterial color="#182A3A" roughness={.18} metalness={.5} transmission={.3} transparent opacity={.62} clearcoat={1} iridescence={.8} thickness={.5}/></mesh>
  <ambientLight intensity={.4}/><pointLight position={[-2,2,3]} color="#5BF2E6" intensity={12}/><pointLight position={[2,-1,2]} color="#955BFA" intensity={9}/>
  <Environment frames={1} resolution={64}><Lightformer position={[-3,2,2]} scale={[2,5,1]} intensity={3} color="#5BF2E6"/><Lightformer position={[3,0,2]} scale={[2,4,1]} intensity={2} color="#955BFA"/></Environment>
  <group ref={particles}><Sparkles count={100} scale={[10,7,3]} size={1} speed={reduced?0:.12} opacity={.22} color="#5BF2E6"/></group>
 </>;
}
