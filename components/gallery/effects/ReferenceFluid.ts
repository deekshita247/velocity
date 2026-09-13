import * as THREE from "three";
import { referenceShaders as shaders } from "./referenceShaders";

// Active Theory Fluid passes, adapted to Three.js ping-pong render targets.
export class ReferenceFluid {
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  private materials = new Map<string, THREE.ShaderMaterial>();
  private targets: THREE.WebGLRenderTarget[] = [];
  private velocity: THREE.WebGLRenderTarget[];
  private dye: THREE.WebGLRenderTarget[];
  private pressure: THREE.WebGLRenderTarget[];
  private curl: THREE.WebGLRenderTarget;
  private divergence: THREE.WebGLRenderTarget;
  private last = new THREE.Vector2(0.5, 0.5);
  private initialized = false;
  constructor(private size: number) {
    const target = () => { const rt = new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType, depthBuffer: false }); this.targets.push(rt); return rt; };
    this.velocity = [target(), target()]; this.dye = [target(), target()]; this.pressure = [target(), target()];
    this.curl = target(); this.divergence = target(); this.scene.add(this.quad);
    for (const name of ["advectionShader.fs", "clearShader.fs", "curlShader.fs", "divergenceShader.fs", "gradientSubtractShader.fs", "pressureShader.fs", "splatShader.fs", "vorticityShader.fs"] as const) {
      this.materials.set(name, new THREE.ShaderMaterial({ vertexShader: shaders["fluidBase.vs"], fragmentShader: shaders[name], depthTest: false, depthWrite: false, uniforms: { texelSize: { value: new THREE.Vector2(1 / size, 1 / size) } } }));
    }
  }
  get texture() { return this.velocity[0].texture; }
  get mask() { return this.dye[0].texture; }
  step(gl: THREE.WebGLRenderer, pointer: THREE.Vector2, dt: number, aspect: number) {
    const old = gl.getRenderTarget();
    if (!this.initialized) { for (const rt of this.targets) { gl.setRenderTarget(rt); gl.clear(); } this.initialized = true; }
    const run = (name: string, target: THREE.WebGLRenderTarget, uniforms: Record<string, unknown>) => {
      const material = this.materials.get(name)!;
      for (const [key, value] of Object.entries(uniforms)) { if (material.uniforms[key]) material.uniforms[key].value = value; else material.uniforms[key] = { value }; }
      this.quad.material = material; gl.setRenderTarget(target); gl.render(this.scene, this.camera);
    };
    const swap = (pair: THREE.WebGLRenderTarget[]) => pair.reverse();
    const point = new THREE.Vector2(pointer.x * 0.5 + 0.5, pointer.y * 0.5 + 0.5);
    const dx = point.x - this.last.x, dy = point.y - this.last.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.0001) {
      const shared = { point, prevPoint: this.last, aspectRatio: aspect, radius: 0.055, canRender: 1, uAdd: 1, bgColor: new THREE.Color(0) };
      run("splatShader.fs", this.velocity[1], { ...shared, uTarget: this.texture, color: new THREE.Vector3(dx * 700, dy * 700, 0) }); swap(this.velocity);
      run("splatShader.fs", this.dye[1], { ...shared, uAdd: 0, uTarget: this.mask, color: new THREE.Vector3(0.8, 0.8, 0.8) }); swap(this.dye);
    }
    this.last.copy(point);
    run("curlShader.fs", this.curl, { uVelocity: this.texture });
    run("vorticityShader.fs", this.velocity[1], { uVelocity: this.texture, uCurl: this.curl.texture, curl: 30, dt }); swap(this.velocity);
    run("divergenceShader.fs", this.divergence, { uVelocity: this.texture });
    run("clearShader.fs", this.pressure[1], { uTexture: this.pressure[0].texture, value: Math.pow(0.8, dt * 60) }); swap(this.pressure);
    for (let i = 0; i < 5; i++) { run("pressureShader.fs", this.pressure[1], { uPressure: this.pressure[0].texture, uDivergence: this.divergence.texture }); swap(this.pressure); }
    run("gradientSubtractShader.fs", this.velocity[1], { uVelocity: this.texture, uPressure: this.pressure[0].texture }); swap(this.velocity);
    run("advectionShader.fs", this.velocity[1], { uVelocity: this.texture, uSource: this.texture, dt, dissipation: Math.pow(0.98, dt * 60) }); swap(this.velocity);
    run("advectionShader.fs", this.dye[1], { uVelocity: this.texture, uSource: this.mask, dt, dissipation: Math.pow(0.97, dt * 60) }); swap(this.dye);
    gl.setRenderTarget(old);
  }
  dispose() { this.targets.forEach(rt => rt.dispose()); this.materials.forEach(m => m.dispose()); this.quad.geometry.dispose(); }
}
