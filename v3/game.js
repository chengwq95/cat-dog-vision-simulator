import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/*
 * V3 single-room vertical slice.
 * This is deliberately NOT a claim of photoreal, final animal quality.
 * Geometry primitives are used for ARCHITECTURE and debug only.
 * Every furnishing is an independently licensed CC0 GLB, with no procedural
 * substitute spawned if it fails. Pet references are not accepted characters.
 */

const $ = id => document.getElementById(id);
const canvas = $("canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb5c4ca);
scene.fog = new THREE.Fog(0xb5c4ca, 13, 36);
const camera = new THREE.PerspectiveCamera(69, 1, 0.035, 85);
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: "high-performance"});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xb5c4ca, 1);
const target = new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
target.texture.colorSpace = THREE.SRGBColorSpace;

const filterMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: {value:target.texture},
    uMode: {value:1},
    uNight: {value:0},
    uCompare: {value:0},
    uSplit: {value:0.5},
    uTime: {value:0},
    uResolution: {value:new THREE.Vector2(1,1)}
  },
  depthWrite:false,
  depthTest:false,
  vertexShader: [
    "varying vec2 vUv;",
    "void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}"
  ].join("\n"),
  fragmentShader: [
    "precision highp float;",
    "uniform sampler2D tDiffuse;",
    "uniform int uMode;",
    "uniform float uNight,uCompare,uSplit,uTime;",
    "uniform vec2 uResolution;",
    "varying vec2 vUv;",
    "vec3 sampleVision(vec2 uv,int mode){",
    "  vec3 col=texture2D(tDiffuse,uv).rgb;",
    "  if(mode==0)return col;",
    "  float amount=mode==1?1.25:0.85;",
    "  vec2 pix=vec2(1.)/max(uResolution,vec2(1.));",
    "  vec2 o=pix*amount*1.7;",
    "  vec3 blur=(col*4.0+texture2D(tDiffuse,uv+vec2(o.x,0.)).rgb+texture2D(tDiffuse,uv-vec2(o.x,0.)).rgb+texture2D(tDiffuse,uv+vec2(0.,o.y)).rgb+texture2D(tDiffuse,uv-vec2(0.,o.y)).rgb)/8.;",
    "  col=mix(col,blur,mode==1?.65:.46);",
    "  float yellow=.50*col.r+.48*col.g;",
    "  float blue=.12*col.g+.89*col.b;",
    "  float lum=dot(col,vec3(.299,.587,.114));",
    "  vec3 dich=vec3(yellow*.91+blue*.05,yellow*.87+blue*.08,blue*.78+yellow*.20);",
    "  col=mix(dich,vec3(lum),.11);",
    "  if(uNight>.5){col*=mode==1?1.9:1.5;col=col*vec3(.80,.96,1.02);}",
    "  return col;",
    "}",
    "void main(){",
    "  vec2 uv=vUv;",
    "  int mode=uMode;",
    "  vec3 c=sampleVision(uv,mode);",
    "  if(uCompare>.5){",
    "     vec3 h=sampleVision(uv,0);",
    "     c=uv.x<uSplit?h:c;",
    "     if(abs(uv.x-uSplit)<.0018)c=vec3(.95,.79,.51);",
    "  }",
    "  float gr=fract(sin(dot(gl_FragCoord.xy+vec2(uTime*17.),vec2(12.9898,78.233)))*43758.5453)-.5;",
    "  c+=gr*(uNight>.5?.013:.005);",
    "  c=clamp(c,0.,1.);",
    "  gl_FragColor=vec4(c,1.);",
    "}"
  ].join("\n")
});
const fullScene = new THREE.Scene();
const fullCamera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2),filterMaterial);
quad.frustumCulled=false;
fullScene.add(quad);

const ambient = new THREE.HemisphereLight(0xdce6ff,0xa18c7b,2.25);
scene.add(ambient);
const sky = new THREE.DirectionalLight(0xfff0d6,3.4);
sky.position.set(4.5,8.5,5.5);
sky.castShadow=true;
sky.shadow.mapSize.set(2048,2048);
sky.shadow.camera.left=-11;sky.shadow.camera.right=11;
sky.shadow.camera.top=11;sky.shadow.camera.bottom=-11;
sky.shadow.camera.near=.5;sky.shadow.camera.far=28;
sky.shadow.normalBias=.025;
scene.add(sky);
const warm = new THREE.PointLight(0xffcb91,12,8,1.8);
warm.position.set(-3.6,2.3,-3.1);
warm.castShadow=false;
scene.add(warm);
const accent = new THREE.PointLight(0xd6eaff,5,6,1.9);
accent.position.set(2,2.4,1.7);
scene.add(accent);

const mat = (color,roughness=.75,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const plaster = mat(0xd6d4cd,.92);
const timber=mat(0x654c39,.53);
const white=mat(0xeceae3,.32);
const dark=mat(0x22272a,.28,.32);
const rugmat=mat(0xb0a9a0,1);
const glass = new THREE.MeshPhysicalMaterial({color:0xd9eff3,metalness:0,roughness:.11,transparent:true,opacity:.27,depthWrite:false,side:THREE.DoubleSide});
function cube(name,pos,size,material,shadow=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),material);
  m.name=name;m.position.set(pos[0],pos[1],pos[2]);
  m.castShadow=shadow;m.receiveShadow=true;
  scene.add(m);return m;
}
// The architecture is geometry (not a claim of imported furnishing).
function woodTexture(){
  const c=document.createElement("canvas");c.width=512;c.height=512;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#9e866c";ctx.fillRect(0,0,512,512);
  let seed=31;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<512;y+=64){
    ctx.fillStyle=y%128===0?"rgba(44,22,9,.07)":"rgba(242,215,170,.05)";
    ctx.fillRect(0,y,512,64);
    ctx.fillStyle="rgba(45,29,18,.25)";ctx.fillRect(0,y,512,1);
    for(let i=0;i<45;i++){
      let x=random()*512,yy=y+random()*63;
      ctx.strokeStyle="rgba(55,35,22,"+(.012+random()*.055)+")";
      ctx.lineWidth=.5+random()*.9;
      ctx.beginPath();ctx.moveTo(x,yy);ctx.bezierCurveTo(x+12,yy+random()*2,x+38,yy+random()*4,x+85,yy);
      ctx.stroke();
    }
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.4,2.0);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
  return t;
}
const floorMat=new THREE.MeshStandardMaterial({map:woodTexture(),roughness:.67,metalness:0});
cube("timber floor",[0,-.16,0],[13.8,.3,9.6],floorMat,false);
cube("north wall",[0,1.6,-4.75],[13.8,3.3,.2],plaster,false);
cube("west wall",[-6.8,1.6,0],[.2,3.3,9.6],plaster,false);
cube("east wall",[6.8,1.6,0],[.2,3.3,9.6],plaster,false);
// South wall is a glass facade: large landscape view with side posts.
cube("south wall left",[-5.0,1.65,4.75],[3.7,3.3,.20],plaster,false);
cube("south wall right",[5.0,1.65,4.75],[3.7,3.3,.20],plaster,false);
cube("south lintel",[0,3.05,4.75],[6.3,.5,.2],plaster,false);
cube("south sill",[0,.17,4.75],[6.3,.34,.2],plaster,false);
cube("window beam",[0,1.68,4.75],[.055,2.6,.05],timber,false);
const windowPlane=new THREE.Mesh(new THREE.PlaneGeometry(6.3,2.63),glass);
windowPlane.position.set(0,1.69,4.73);
scene.add(windowPlane);
cube("north skirting",[0,.08,-4.61],[13.5,.16,.06],white,false);
cube("western skirting",[-6.67,.08,0],[.06,.16,9.2],white,false);
cube("eastern skirting",[6.67,.08,0],[.06,.16,9.2],white,false);
cube("ceiling cornice",[0,3.21,-4.62],[13.6,.09,.1],white,false);
cube("rug base",[0,.015,-1.2],[4.9,.025,2.6],rugmat,false);
// TV is architectural mockup, not a professional model.
cube("wall media panel",[0,1.65,-4.56],[2.7,1.48,.09],dark);
cube("wall media trim",[0,1.65,-4.495],[2.50,1.29,.02],mat(0x080d12,.16));
cube("console",[0,.28,-4.12],[3.3,.48,.56],timber);
// South garden outside the house, visible through glass.
cube("terrace",[0,-.13,6],[13.5,.23,4],mat(0xb5afa3,.94),false);
for(let i=0;i<10;i++){
  const x=-6+i*1.36;
  const height=1.25+.55*Math.sin(i*1.91);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.05,.09,height,6),mat(0x5c5543));
  trunk.position.set(x,height*.5,8);
  scene.add(trunk);
  const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),mat(0x5b755d,1));
  leaf.scale.set(1,1.3,.9);leaf.position.set(x,height+.25,8);
  scene.add(leaf);
}
const obstacles=[];
function collider(x,z,hx,hz){obstacles.push({x,z,hx,hz});}
collider(0,-4.0,1.9,.65);
collider(-.5,-3.0,1.55,.48);
collider(-.5,-1.15,.78,.55);
collider(2.7,-2.4,.45,.5);
collider(-4.1,-3.1,.43,.43);
collider(4.8,-3.3,.7,.7);
const loader=new GLTFLoader();
const assets=[
  {id:"sofa",title:"Three-seat sofa",url:"https://cdn.3dassets.dev/assets/38778/v1/model.glb",x:-.5,z:-3.0,rot:0},
  {id:"table",title:"Coffee table",url:"https://cdn.3dassets.dev/assets/38790/v1/model.glb",x:-.5,z:-1.15,rot:0},
  {id:"chair",title:"Upholstered chair",url:"https://cdn.3dassets.dev/assets/38785/v1/model.glb",x:2.7,z:-2.4,rot:-.9},
  {id:"lamp",title:"Arc floor lamp",url:"https://cdn.3dassets.dev/assets/38797/v1/model.glb",x:-4.1,z:-3.1,rot:-.3},
  {id:"dining",title:"Six seat table",url:"https://cdn.3dassets.dev/assets/38791/v1/model.glb",x:4.3,z:1.8,rot:Math.PI/2}
];
collider(4.3,1.8,1.0,1.2);
let loaded=0,failed=0;
assets.forEach(async item=>{
  try{
    const gltf=await loader.loadAsync(item.url);
    const g=gltf.scene;
    g.position.set(item.x,0,item.z);
    g.rotation.y=item.rot;
    g.traverse(o=>{
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true; o.material.side=THREE.FrontSide;}
    });
    scene.add(g);loaded++;
  }catch(err){
    failed++;
    console.warn("Asset failed",item.id,err);
  }
  $("assetProgress").textContent="家具 "+loaded+"/"+assets.length+" 已载入"+(failed?" · "+failed+" 个失败":"")+" · CC0 GLB";
});
// A static ginger model is used only as a first pass camera reference.
// Never claim it is a playable rigged character.
const catModelUrl="https://cdn.3dassets.dev/assets/28155/v1/model.glb";
let petCat=null,petRigAccepted=false;
loader.load(catModelUrl,gltf=>{
  const root=gltf.scene;
  let hasSkin=false;root.traverse(o=>{if(o.isSkinnedMesh)hasSkin=true;});
  const clips=gltf.animations||[];
  petRigAccepted=hasSkin && clips.length>=3;
  const box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  if(size.y>0&&Number.isFinite(size.y)){
    root.scale.setScalar(Math.min(1,.62/size.y));
    const shiftedBox=new THREE.Box3().setFromObject(root);
    root.position.y-=shiftedBox.min.y;
  }
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(root);petCat=root;
  // Static reference remains visible only for honest third-person comparison.
  $("micro").textContent=petRigAccepted?"猫模型有骨骼与动画，动作仍待验收":"橘猫暂为静态 GLB · 不属于最终动画角色";
},undefined,err=>{
  console.warn("Cat GLB not loaded",err);
  $("micro").textContent="猫模型加载失败 · 仍可用第一人称体验";
});
const state={
 mode:1,night:false,compare:false,third:false,quality:false,
 yaw:0,pitch:-.12,pos:new THREE.Vector3(-2,0,1.25),velY:0,
 walking:false,started:false,drag:false,mouseX:0,mouseY:0
};
const keys=new Set();
const control=[["cat",1],["dog",2],["human",0]];
const toast=msg=>{
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  toast.until=performance.now()+2800;
};
function refresh(){
 for(const [id,v] of control)$(id).setAttribute("aria-pressed",String(state.mode===v));
 for(const [id,prop] of [["compare","compare"],["night","night"],["third","third"],["quality","quality"]])$(id).setAttribute("aria-pressed",String(state[prop]));
 const labels=["人类视觉 · HUMAN","橘猫视觉 · CAT","狗狗视觉 · DOG"];
 $("mode").textContent=labels[state.mode];
 $("third").disabled=state.mode===2 && !petRigAccepted;
 filterMaterial.uniforms.uMode.value=state.mode;
 filterMaterial.uniforms.uCompare.value=state.compare?1:0;
 filterMaterial.uniforms.uNight.value=state.night?1:0;
 ambient.intensity=state.night?.35:2.25;
 sky.intensity=state.night?.12:3.4;
 warm.intensity=state.night?17:12;
 accent.intensity=state.night?2:5;
 scene.background.set(state.night?0x172333:0xb5c4ca);
 scene.fog.color.set(state.night?0x172333:0xb5c4ca);
 renderer.toneMappingExposure=state.night?.9:1.25;
 resize();
}
function setMode(n){
 state.mode=n;
 if(n===2&&state.third){state.third=false;toast("柴犬高品质动画模型尚未采购，暂时仅支持第一人称狗狗视觉");}
 if(n===0&&state.third)state.third=false;
 refresh();
}
$("cat").onclick=()=>setMode(1);
$("dog").onclick=()=>setMode(2);
$("human").onclick=()=>setMode(0);
$("compare").onclick=()=>{state.compare=!state.compare;refresh();};
$("night").onclick=()=>{state.night=!state.night;refresh();};
$("third").onclick=()=>{
 if(state.mode!==1){toast("目前只有橘猫静态参考模型；狗狗与人类第三人称暂不可用");return;}
 state.third=!state.third;
 if(state.third&&!petRigAccepted)toast("注意：第三人称橘猫为静态参考，不具有真实行走骨骼动画");
 refresh();
};
$("quality").onclick=()=>{state.quality=!state.quality;renderer.shadowMap.enabled=!state.quality;refresh();};
$("start").onclick=()=>{
 state.started=true;
 $("veil").classList.add("hidden");
 setTimeout(()=>{$("veil").style.display="none";},450);
 toast("按 W A S D 自由探索 · 鼠标拖动转向");
};
window.addEventListener("keydown",e=>{
 if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==="KeyQ")setMode(state.mode===1?2:1);
 if(e.code==="KeyV")$("third").click();
 if(e.code==="KeyN")$("night").click();
 if(e.code==="KeyC")$("compare").click();
 if(e.code==="Space"&&state.pos.y<.02)state.velY=3.2;
 if(e.code==="KeyE")toast("这一阶段聚焦于移动、视觉和材质。交互将在角色动画验收后加入。");
});
window.addEventListener("keyup",e=>keys.delete(e.code));
window.addEventListener("blur",()=>keys.clear());
for(const b of document.querySelectorAll("#touch button")){
 b.onpointerdown=e=>{e.preventDefault();keys.add(b.dataset.key);};
 b.onpointerup=()=>keys.delete(b.dataset.key);
 b.onpointercancel=()=>keys.delete(b.dataset.key);
}
if(matchMedia("(pointer:coarse)").matches)document.body.classList.add("mobile");
canvas.addEventListener("pointerdown",e=>{
 state.drag=true;state.mouseX=e.clientX;state.mouseY=e.clientY;
 if(e.pointerType==="mouse"&&state.started&&canvas.requestPointerLock)canvas.requestPointerLock().catch(()=>{});
});
window.addEventListener("pointerup",()=>{state.drag=false;});
window.addEventListener("pointermove",e=>{
 if(!state.started)return;
 const locked=document.pointerLockElement===canvas;
 if(!state.drag&&!locked)return;
 const dx=locked?e.movementX:e.clientX-state.mouseX;
 const dy=locked?e.movementY:e.clientY-state.mouseY;
 state.mouseX=e.clientX;state.mouseY=e.clientY;
 if(Math.abs(dx)>250||Math.abs(dy)>250)return;
 state.yaw-=dx*.003;
 state.pitch=Math.max(-1.12,Math.min(1.12,state.pitch-dy*.003));
});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
window.addEventListener("pointerup",()=>{});
function blocked(x,z){
 if(x<-6.4||x>6.4||z<-4.42||z>4.40)return true;
 const r=state.mode===2?.30:.22;
 for(const c of obstacles)if(Math.abs(x-c.x)<c.hx+r && Math.abs(z-c.z)<c.hz+r)return true;
 return false;
}
const forward=new THREE.Vector3(),right=new THREE.Vector3(),delta=new THREE.Vector3();
let dpr=1,lastWidth=0,lastHeight=0;
function resize(){
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
 const nextDpr=state.quality?1:Math.min(window.devicePixelRatio||1,1.5);
 if(w===lastWidth&&h===lastHeight&&nextDpr===dpr)return;
 dpr=nextDpr;lastWidth=w;lastHeight=h;
 renderer.setPixelRatio(dpr);
 renderer.setSize(w,h,false);
 target.setSize(Math.max(1,Math.round(w*dpr)),Math.max(1,Math.round(h*dpr)));
 filterMaterial.uniforms.uResolution.value.set(w*dpr,h*dpr);
 camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize);
refresh();
resize();

let prev=performance.now(),elapsed=0,frames=0,frameTime=0;
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min((now-prev)/1000,.045);prev=now;
 elapsed+=dt;frames++;frameTime+=dt;
 if(frameTime>=1){
   const fps=Math.round(frames/frameTime);
   $("fps").textContent=fps+" FPS";
   frames=0;frameTime=0;
 }
 if($("toast").classList.contains("show")&&now>toast.until)$("toast").classList.remove("show");
 if(state.started){
   forward.set(Math.sin(state.yaw),0,-Math.cos(state.yaw));
   right.set(Math.cos(state.yaw),0,Math.sin(state.yaw));
   delta.set(0,0,0);
   if(keys.has("KeyW")||keys.has("ArrowUp"))delta.add(forward);
   if(keys.has("KeyS")||keys.has("ArrowDown"))delta.sub(forward);
   if(keys.has("KeyD")||keys.has("ArrowRight"))delta.add(right);
   if(keys.has("KeyA")||keys.has("ArrowLeft"))delta.sub(right);
   state.walking=delta.lengthSq()>0;
   if(state.walking){
     delta.normalize().multiplyScalar((keys.has("ShiftLeft")?4.5:2.2)*dt);
     const nx=state.pos.x+delta.x,nz=state.pos.z+delta.z;
     if(!blocked(nx,state.pos.z))state.pos.x=nx;
     if(!blocked(state.pos.x,nz))state.pos.z=nz;
   }
   state.velY-=9.81*dt;
   state.pos.y+=state.velY*dt;
   if(state.pos.y<0){state.pos.y=0;state.velY=0;}
 }
 const eye=state.mode===1?.27:state.mode===2?.51:1.60;
 const headBob=state.walking&&state.pos.y<.02?Math.sin(elapsed*13)*.018:0;
 if(state.third&&state.mode===1){
   forward.set(Math.sin(state.yaw),0,-Math.cos(state.yaw));
   camera.position.copy(state.pos).addScaledVector(forward,-2.30);
   camera.position.y+=1.30;
   const tx=state.pos.x,ty=state.pos.y+.35,tz=state.pos.z;
   camera.lookAt(tx,ty,tz);
   camera.rotateX(state.pitch*.45);
 }else{
   camera.position.set(state.pos.x,state.pos.y+eye+headBob,state.pos.z);
   camera.rotation.order="YXZ";
   camera.rotation.set(state.pitch,state.yaw,0);
 }
 if(petCat){
   petCat.visible=state.third&&state.mode===1;
   petCat.position.x=state.pos.x;petCat.position.z=state.pos.z;
   petCat.rotation.y=state.yaw;
   // The model is static; do NOT manufacture a walk cycle by bobbing it.
 }
 filterMaterial.uniforms.uTime.value=elapsed;
 renderer.setRenderTarget(target);
 renderer.render(scene,camera);
 renderer.setRenderTarget(null);
 renderer.render(fullScene,fullCamera);
}
requestAnimationFrame(loop);
window.__v3={
 version:"V3 playable room alpha",
 assets:()=>({loaded,failed,total:assets.length}),
 state:()=>({mode:state.mode,night:state.night,compare:state.compare,third:state.third,rigAccepted:petRigAccepted,x:state.pos.x,z:state.pos.z}),
 acceptance:{catRigRequired:true,dogMustBeShiba:true,finalRealismApproved:false}
};
