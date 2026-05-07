import{n as e,r as t,t as n}from"./index-CptmjQ_X.js";import{a as r,c as i,d as a,f as o,g as s,h as c,i as l,l as u,m as d,n as f,o as p,p as m,r as h,s as g,t as _,u as v}from"./three-JsSwakKK.js";var y=class{kind=`cpu`;size;current;previous;next;constructor(e){this.size=e;let t=e*e;this.current=new Float32Array(t),this.previous=new Float32Array(t),this.next=new Float32Array(t),this.seed()}async step(r){let{settings:i,bands:a,time:o}=r,s=this.size,c=this.size,l=Math.PI*2*i.frequency;this.next.fill(0);for(let t=2;t<c-2;t+=1)for(let r=2;r<s-2;r+=1){let u=t*s+r,d=this.current[u]??0,f=this.current[u-s]??0,p=this.current[u+s]??0,m=this.current[u+1]??0,h=this.current[u-1]??0,g=this.current[u-s+1]??0,_=this.current[u-s-1]??0,v=this.current[u+s+1]??0,y=this.current[u+s-1]??0,b=this.current[u-2*s]??0,x=this.current[u+2*s]??0,S=this.current[u+2]??0,C=this.current[u-2]??0,w=20*d-8*(f+p+m+h)+2*(g+_+v+y)+b+x+S+C,T=r/(s-1),E=t/(c-1),D=e(T,E,i.modeX,i.modeY)+a.bass*e(T,E,1,1)+a.mid*e(T,E,2,3)+a.high*e(T,E,5,4),O=i.drive*i.audioGain*D*Math.sin(l*o),k=d-(this.previous[u]??0);this.next[u]=n(2*d-(this.previous[u]??0)-i.damping*k-i.stiffness*w+O,-1,1)}let u=this.previous;return this.previous=this.current,this.current=this.next,this.next=u,{field:this.current.slice(),energy:t(this.current)}}dispose(){this.current=new Float32Array,this.previous=new Float32Array,this.next=new Float32Array}seed(){for(let t=0;t<this.size;t+=1)for(let n=0;n<this.size;n+=1){let r=t*this.size+n,i=.003*e(n/(this.size-1),t/(this.size-1),2,3);this.current[r]=i,this.previous[r]=i}}},b=`
struct Params {
  width: f32,
  height: f32,
  stiffness: f32,
  damping: f32,
  drive: f32,
  frequency: f32,
  time: f32,
  modeX: f32,
  modeY: f32,
  bass: f32,
  mid: f32,
  high: f32,
  dt: f32,
  gain: f32,
  pad0: f32,
  pad1: f32
};

@group(0) @binding(0) var<storage, read> current: array<f32>;
@group(0) @binding(1) var<storage, read> previous: array<f32>;
@group(0) @binding(2) var<storage, read_write> next: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

fn shape(x: f32, y: f32, mx: f32, my: f32) -> f32 {
  return sin(3.14159265 * mx * x) * sin(3.14159265 * my * y);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = u32(params.width);
  let height = u32(params.height);
  if (id.x >= width || id.y >= height) {
    return;
  }

  let x = id.x;
  let y = id.y;
  let index = y * width + x;

  if (x < 2u || y < 2u || x + 2u >= width || y + 2u >= height) {
    next[index] = 0.0;
    return;
  }

  let c = current[index];
  let n = current[index - width];
  let s = current[index + width];
  let e = current[index + 1u];
  let w = current[index - 1u];
  let ne = current[index - width + 1u];
  let nw = current[index - width - 1u];
  let se = current[index + width + 1u];
  let sw = current[index + width - 1u];
  let nn = current[index - 2u * width];
  let ss = current[index + 2u * width];
  let ee = current[index + 2u];
  let ww = current[index - 2u];

  let biharmonic = 20.0 * c - 8.0 * (n + s + e + w) +
    2.0 * (ne + nw + se + sw) + nn + ss + ee + ww;
  let fx = f32(x) / (params.width - 1.0);
  let fy = f32(y) / (params.height - 1.0);
  let audioShape =
    params.bass * shape(fx, fy, 1.0, 1.0) +
    params.mid * shape(fx, fy, 2.0, 3.0) +
    params.high * shape(fx, fy, 5.0, 4.0);
  let modal = shape(fx, fy, params.modeX, params.modeY) + audioShape;
  let omega = 6.2831853 * params.frequency;
  let forcing = params.drive * params.gain * modal * sin(omega * params.time);
  let velocity = c - previous[index];
  next[index] = clamp(
    2.0 * c - previous[index] - params.damping * velocity -
      params.stiffness * biharmonic + forcing,
    -1.0,
    1.0
  );
}
`,x=class n{kind=`webgpu`;size;device;pipeline;paramsBuffer;buffers;readBuffer;current=0;previous=1;next=2;bindGroups=new Map;constructor(e,t){this.device=e,this.size=t;let n=t*t*Float32Array.BYTES_PER_ELEMENT,r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;this.buffers=[e.createBuffer({size:n,usage:r}),e.createBuffer({size:n,usage:r}),e.createBuffer({size:n,usage:r})],this.readBuffer=e.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),this.paramsBuffer=e.createBuffer({size:16*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.pipeline=e.createComputePipeline({layout:`auto`,compute:{module:e.createShaderModule({code:b}),entryPoint:`main`}}),this.seed()}static async create(e){if(!(`gpu`in navigator))throw Error(`WebGPU is not available in this browser.`);let t=await navigator.gpu.requestAdapter({powerPreference:`high-performance`});if(!t)throw Error(`No WebGPU adapter was found.`);return new n(await t.requestDevice(),e)}async step(e){let{settings:n,bands:r,time:i,dt:a}=e,o=new Float32Array([this.size,this.size,n.stiffness,n.damping,n.drive,n.frequency,i,n.modeX,n.modeY,r.bass,r.mid,r.high,a,n.audioGain,0,0]);this.device.queue.writeBuffer(this.paramsBuffer,0,o);let s=this.device.createCommandEncoder(),c=s.beginComputePass();c.setPipeline(this.pipeline),c.setBindGroup(0,this.bindGroup(this.current,this.previous,this.next)),c.dispatchWorkgroups(Math.ceil(this.size/8),Math.ceil(this.size/8)),c.end(),s.copyBufferToBuffer(this.buffers[this.next],0,this.readBuffer,0,this.size*this.size*Float32Array.BYTES_PER_ELEMENT),this.device.queue.submit([s.finish()]),await this.readBuffer.mapAsync(GPUMapMode.READ);let l=new Float32Array(this.readBuffer.getMappedRange()).slice();this.readBuffer.unmap();let u=this.previous;return this.previous=this.current,this.current=this.next,this.next=u,{field:l,energy:t(l)}}dispose(){this.bindGroups.clear(),this.buffers.forEach(e=>e.destroy()),this.readBuffer.destroy(),this.paramsBuffer.destroy(),this.device.destroy()}bindGroup(e,t,n){let r=`${e}:${t}:${n}`,i=this.bindGroups.get(r);if(i)return i;let a=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.buffers[e]}},{binding:1,resource:{buffer:this.buffers[t]}},{binding:2,resource:{buffer:this.buffers[n]}},{binding:3,resource:{buffer:this.paramsBuffer}}]});return this.bindGroups.set(r,a),a}seed(){let t=new Float32Array(this.size*this.size);for(let n=0;n<this.size;n+=1)for(let r=0;r<this.size;r+=1){let i=r/(this.size-1),a=n/(this.size-1);t[n*this.size+r]=.003*e(i,a,2,3)}this.device.queue.writeBuffer(this.buffers[0],0,t),this.device.queue.writeBuffer(this.buffers[1],0,t)}},S=class e{canvas;renderer;scene=new s;camera=new o(42,1,.1,100);plateGeometry;plateMesh;sandGeometry=new h;sandPositions;sandColors;sand;sandPoints;clock=new l;getAudioBands;onStats;onError;solver;settings;frame;running=!0;pending=!1;frameCount=0;fpsTime=performance.now();fps=0;energy=0;animationId=0;constructor(e,t){this.canvas=e.canvas,this.settings=e.settings,this.getAudioBands=e.getAudioBands,this.onStats=e.onStats,this.onError=e.onError,this.solver=t,this.frame=new Float32Array(t.size*t.size),this.renderer=new _({canvas:this.canvas,antialias:!0,alpha:!1,powerPreference:`high-performance`}),this.renderer.setClearColor(1118997,1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.camera.position.set(0,-4.15,3.15),this.camera.lookAt(0,0,0),this.scene.background=new r(`#111315`),this.scene.fog=new g(`#111315`,4.5,7.2),this.scene.add(new i(`#f6f1e7`,`#19201c`,2.2));let n=new p(`#75d2ff`,2.8);n.position.set(-2.2,-2.6,3.5),this.scene.add(n);let o=new p(`#f2c14e`,1.1);o.position.set(2.4,1.7,2.2),this.scene.add(o),this.plateGeometry=new m(3.2,3.2,t.size-1,t.size-1);let s=new Float32Array(t.size*t.size*3);this.plateGeometry.setAttribute(`color`,new f(s,3)),this.plateMesh=new v(this.plateGeometry,new a({color:`#dfe6de`,metalness:.45,roughness:.36,vertexColors:!0,side:2})),this.scene.add(this.plateMesh),this.sand=this.createSand(this.settings.particleCount),this.sandPositions=new Float32Array(this.sand.length*3),this.sandColors=new Float32Array(this.sand.length*3),this.sandGeometry.setAttribute(`position`,new f(this.sandPositions,3)),this.sandGeometry.setAttribute(`color`,new f(this.sandColors,3)),this.sandPoints=new d(this.sandGeometry,new c({size:.012,vertexColors:!0,sizeAttenuation:!0})),this.scene.add(this.sandPoints),window.addEventListener(`resize`,this.resize),this.resize(),this.animate()}static async create(t){let n;try{n=await x.create(t.settings.gridSize)}catch{n=new y(t.settings.gridSize)}return new e(t,n)}setSettings(e){let t=e.gridSize!==this.settings.gridSize,n=e.particleCount!==this.settings.particleCount;this.settings=e,(t||n)&&this.onError(`Grid and particle changes apply after restarting the plate.`)}dispose(){this.running=!1,cancelAnimationFrame(this.animationId),window.removeEventListener(`resize`,this.resize),this.solver.dispose(),this.renderer.dispose(),this.plateGeometry.dispose(),this.sandGeometry.dispose(),Array.isArray(this.plateMesh.material)?this.plateMesh.material.forEach(e=>e.dispose()):this.plateMesh.material.dispose(),Array.isArray(this.sandPoints.material)?this.sandPoints.material.forEach(e=>e.dispose()):this.sandPoints.material.dispose()}resize=()=>{let e=this.canvas.parentElement,t=e?.clientWidth??window.innerWidth,n=e?.clientHeight??window.innerHeight;this.renderer.setSize(t,n,!1),this.camera.aspect=t/Math.max(n,1),this.camera.updateProjectionMatrix()};animate=()=>{if(!this.running)return;let e=Math.min(this.clock.getDelta(),1/24),t=this.clock.elapsedTime;this.pending||(this.pending=!0,this.solver.step({settings:this.settings,bands:this.getAudioBands(),time:t,dt:e}).then(e=>{this.frame=e.field,this.energy=e.energy,this.applyField(),this.updateSand()}).catch(()=>{this.onError(`The solver stopped unexpectedly. Restart the plate to recover.`)}).finally(()=>{this.pending=!1})),this.renderer.render(this.scene,this.camera),this.updateFps(),this.animationId=requestAnimationFrame(this.animate)};updateFps(){this.frameCount+=1;let e=performance.now();e-this.fpsTime>=500&&(this.fps=Math.round(this.frameCount*1e3/(e-this.fpsTime)),this.frameCount=0,this.fpsTime=e,this.onStats({fps:this.fps,solver:this.solver.kind,energy:this.energy,particles:this.sand.length}))}applyField(){let e=this.plateGeometry.attributes.position,t=this.plateGeometry.attributes.color,n=new r(this.materialTint()),i=new r(`#122527`),a=new r(`#f4796b`),o=new r(`#dfe6de`);for(let r=0;r<e.count;r+=1){let s=this.frame[r]??0;e.setZ(r,s*.26);let c=Math.min(Math.abs(s)*8,1),l=o.clone().lerp(s>0?a:i,c).lerp(n,.18);t.setXYZ(r,l.r,l.g,l.b)}e.needsUpdate=!0,t.needsUpdate=!0,this.plateGeometry.computeVertexNormals()}updateSand(){let e=this.solver.size,t=this.sandGeometry.attributes.position,n=this.sandGeometry.attributes.color,r=this.settings.sandPersistence;this.sand.forEach((i,a)=>{let o=Math.round((i.x+1.6)/3.2*(e-1)),s=Math.round((i.y+1.6)/3.2*(e-1)),c=Math.abs(this.sample(o,s)),l=Math.abs(this.sample(o+1,s))-Math.abs(this.sample(o-1,s)),d=Math.abs(this.sample(o,s+1))-Math.abs(this.sample(o,s-1)),f=(1-r)*.004;i.vx=i.vx*.84-l*.018+(Math.random()-.5)*f,i.vy=i.vy*.84-d*.018+(Math.random()-.5)*f,i.x=u.clamp(i.x+i.vx,-1.55,1.55),i.y=u.clamp(i.y+i.vy,-1.55,1.55);let p=this.sample(o,s)*.26+.025;t.setXYZ(a,i.x,i.y,p);let m=1-Math.min(c*12,1);n.setXYZ(a,.62+m*.38,.49+m*.31,.25+m*.2)}),t.needsUpdate=!0,n.needsUpdate=!0}sample(e,t){let n=this.solver.size,r=u.clamp(e,0,n-1),i=u.clamp(t,0,n-1);return this.frame[i*n+r]??0}materialTint(){switch(this.settings.material){case`bronze`:return`#f2c14e`;case`glass`:return`#9be7c7`;case`carbon`:return`#f4796b`;default:return`#75d2ff`}}createSand(e){return Array.from({length:e},()=>({x:(Math.random()-.5)*3.05,y:(Math.random()-.5)*3.05,vx:0,vy:0}))}};export{S as ChladniScene};
//# sourceMappingURL=ChladniScene-Bg9-fUQ3.js.map