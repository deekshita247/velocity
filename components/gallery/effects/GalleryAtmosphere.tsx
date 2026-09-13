"use client";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO, useScroll, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { markCriticalAsset } from "../../loading/criticalAssets";
import * as THREE from "three";
import { referenceShaders as reference } from "./referenceShaders";
import { ReferenceFluid } from "./ReferenceFluid";
import { useGalleryInteraction } from "../GalleryInteraction";

const Refraction = createContext<THREE.Texture | null>(null);
export const useRefractionBuffer = () => useContext(Refraction)!;

// Corner-noise, HSV drift and normal-map frost adapted from GlobalComposite.fs.
const backgroundFragment = `
uniform float time; uniform float uScroll; uniform float aspect;
uniform sampler2D tFluid; uniform sampler2D tNormal; varying vec2 vUv;
${reference["simplenoise.glsl"].replace(/#test Device\.mobile[\s\S]*?#endtest/g, "").replace(/#test !Device\.mobile/g, "").replace(/#endtest/g, "")}
${reference["rgb2hsv.fs"]}
void main(){
 vec2 squareUV=(vUv-0.5)*vec2(1.4,aspect)+0.5;
 vec2 flow=texture2D(tFluid,vUv).xy;
 vec3 normal=texture2D(tNormal,squareUV*0.5+time*0.004).rgb*2.0-1.0;
 vec2 p=squareUV+normal.xy*0.025+flow*0.001;
 vec3 gradient=rgb2hsv(vec3(0.5,0.5,1.0));
 gradient.x+=cnoise(p*0.65-time*0.04)*0.065+0.88;
 gradient=hsv2rgb(gradient);
 float gNoise=0.5+cnoise(p*0.6+time*0.03+uScroll*0.08)*0.5;
 float corner=1.05*smoothstep(0.02,0.81,length(p-0.5));
 float ribbon=pow(0.5+0.5*sin(p.y*9.0+cnoise(p*1.5+time*0.035)*3.0+time*0.1),8.0);
 vec3 color=vec3(0.0024,0.0033,0.006)+gradient*(0.012+pow(corner*gNoise,2.0)*0.14);
 color+=mix(vec3(0.01,0.1,0.14),vec3(0.12,0.015,0.15),gNoise)*ribbon*0.23;
 gl_FragColor=vec4(color,1.0);
}`;
class WateryComposite extends Effect {
  constructor() {
    super("VelocityWater", `uniform sampler2D tFluid; uniform float uDelta; uniform float uDetail;
    void mainUv(inout vec2 uv){vec2 flow=texture2D(tFluid,uv).xy;float edge=smoothstep(0.15,0.7,length(uv-0.5));uv+=flow*0.00012*edge*(1.0-uDetail);}
    void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
      vec2 shift=vec2(cos(2.094395),sin(2.094395))*uDelta*0.0001*(1.0-uDetail);
      vec3 color=vec3(texture2D(inputBuffer,uv+shift).r,inputColor.g,texture2D(inputBuffer,uv-shift).b);
      outputColor=vec4(color,inputColor.a);
    }`, { uniforms: new Map<string, THREE.Uniform>([["tFluid",new THREE.Uniform(null)],["uDelta",new THREE.Uniform(0)],["uDetail",new THREE.Uniform(0)]]) });
  }
}
export function GalleryAtmosphere({ children }: { children: ReactNode }) {
  const { size } = useThree();
  const mobile = size.width < 768;
  const buffer = useFBO(Math.round(size.width * (mobile ? 0.5 : 0.65)), Math.round(size.height * (mobile ? 0.5 : 0.65)), { type: THREE.HalfFloatType });
  const fluid = useMemo(() => new ReferenceFluid(mobile ? 96 : 160), [mobile]);
  const effect = useMemo(() => new WateryComposite(), []);
  const normal = useTexture("/assets/reference/waternormals.jpg", t => { t.wrapS=t.wrapT=THREE.RepeatWrapping; });
  useEffect(()=>{markCriticalAsset("water");},[normal]);
  const material = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();
  const { transition } = useGalleryInteraction();
  const lastScroll = useRef(0);
  const uniforms = useMemo(() => ({ time:{value:0}, uScroll:{value:0}, aspect:{value:1}, tFluid:{value:fluid.texture}, tNormal:{value:normal} }), [fluid,normal]);
  useEffect(() => () => fluid.dispose(), [fluid]);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(({ gl, pointer, clock }, delta) => {
    fluid.step(gl, pointer, Math.min(delta,0.033),size.width/size.height);
    if(material.current){material.current.uniforms.time.value=clock.elapsedTime;material.current.uniforms.uScroll.value=scroll.offset*20;material.current.uniforms.aspect.value=size.width/size.height;material.current.uniforms.tFluid.value=fluid.texture;}
    effect.uniforms.get("tFluid")!.value=fluid.texture;
    effect.uniforms.get("uDetail")!.value=transition.current.value;
    const velocity=THREE.MathUtils.clamp((lastScroll.current-scroll.offset)*1500,-3,3);
    effect.uniforms.get("uDelta")!.value=THREE.MathUtils.damp(effect.uniforms.get("uDelta")!.value,velocity,6,Math.min(delta,0.05));
    lastScroll.current=scroll.offset;
  }, -1);
  // A single shared scene snapshot includes particles and transparent spine material.
  // Excluding the photo groups prevents recursive glass sampling and six extra renders.
  useFrame(({ gl, scene, camera }) => {
    const hidden: THREE.Object3D[]=[];
    scene.traverse(object=>{if(object.userData.excludeFromRefraction&&object.visible){object.visible=false;hidden.push(object);}});
    const old=gl.getRenderTarget();gl.setRenderTarget(buffer);gl.render(scene,camera);gl.setRenderTarget(old);
    hidden.forEach(object=>{object.visible=true;});
  }, 0.5);
  return <Refraction.Provider value={buffer.texture}>
    <mesh frustumCulled={false} renderOrder={-1000} name="watery-background">
      <planeGeometry args={[2,2]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.0);}" fragmentShader={backgroundFragment} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    {children}
    <EffectComposer multisampling={0}>
      <primitive object={effect} />
      <Bloom intensity={mobile?0.22:0.32} luminanceThreshold={0.9} luminanceSmoothing={0.35} mipmapBlur />
    </EffectComposer>
  </Refraction.Provider>;
}
