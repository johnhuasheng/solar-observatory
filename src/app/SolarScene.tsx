"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { BODIES, BODY_BY_ID, type BodyId } from "./planetData";
import { makeTextures } from "./planetTextures";
import { orbitPoint } from "./orbitalMath";
import { OBSERVATORY_FACTS } from "./observatoryFacts";
import { TOUR_ORBIT_MS, TOUR_TRAVEL_MS, orbitProgress, type TourStage } from "./tourTiming";
import { pointOnSunArc, safeSunArc, type SunArc } from "./tourCamera";
import { publicAsset } from "../lib/publicAsset";

type Props = {
  selected: BodyId | null;
  focusToken: number;
  touring: boolean;
  tourPaused: boolean;
  tourStage: TourStage | null;
  speed: number;
  playing: boolean;
  showOrbits: boolean;
  orbitStrength: "soft" | "clear" | "bright";
  viewSide: "free" | "day" | "night" | "rings" | "clouds";
  showLabels: boolean;
  onSelect: (id: BodyId) => void;
  onReady: () => void;
};

const sunVertex = `varying vec3 vPos; varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
  void main(){vPos=position;vUv=uv; vNormal=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv;}`;
const sunFragment = `uniform float uTime;uniform sampler2D surfaceMap; varying vec3 vPos; varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
  float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.1;a*=.5;}return s;}
  void main(){vec3 p=normalize(vPos);float t=uTime*.08;float f=fbm(p*11.+vec3(t,t*.35,-t*.4));float g=fbm(p*32.+vec3(-t*.7,t*.9,t));
  vec3 mapped=texture2D(surfaceMap,vUv).rgb;
  vec3 c=mapped*(.78+f*.27)+vec3(.13,.042,.006)*g;
  float rim=pow(1.-max(dot(normalize(vNormal),normalize(vView)),0.),2.5);
  c+=vec3(.76,.25,.025)*rim*.27;gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const coronaVertex = `varying vec3 vN;varying vec3 vV;varying vec3 vP;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vP=normalize(position);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const coronaFragment = `uniform float uTime;uniform float uOpacity;varying vec3 vN;varying vec3 vV;varying vec3 vP;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1.,0.,0.)),f.x),mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),
mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
void main(){vec3 p=normalize(vP);float time=uTime*.025;
float broad=noise(p*8.+vec3(time,-time*.4,0.));float fine=noise(p*23.+vec3(-time*.6,time,0.));
float streamer=smoothstep(.35,.74,broad*.7+fine*.3);float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.5);
float alpha=rim*(.25+streamer*.75)*uOpacity;
gl_FragColor=vec4(mix(vec3(.85,.31,.07),vec3(1.,.69,.28),broad),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const atmosphereFragment = `varying vec2 vUv;varying vec3 vNormalWorld;varying vec3 vWorld;
void main(){vec3 normal=normalize(vNormalWorld);vec3 eye=normalize(cameraPosition-vWorld);
float edge=pow(1.-max(dot(normal,eye),0.),3.2);
float daylight=smoothstep(-.25,.3,dot(normal,normalize(-vWorld)));
vec3 blue=mix(vec3(.08,.23,.5),vec3(.2,.48,.9),daylight);
gl_FragColor=vec4(blue,edge*.14);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const earthVertex = `varying vec2 vUv;varying vec3 vLocal;varying vec3 vNormalWorld;varying vec3 vWorld;void main(){vUv=uv;vLocal=normalize(position);vNormalWorld=normalize(mat3(modelMatrix)*normal);vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;
const earthFragment = `uniform sampler2D dayMap;uniform sampler2D nightMap;varying vec2 vUv;varying vec3 vNormalWorld;varying vec3 vWorld;
void main(){vec3 day=texture2D(dayMap,vUv).rgb;vec3 night=texture2D(nightMap,vUv).rgb;vec3 normal=normalize(vNormalWorld);vec3 sun=normalize(-vWorld);
float facing=dot(normal,sun);float light=max(facing,0.);float edge=smoothstep(-.16,.2,facing);
vec3 color=mix(day*.025+night*.9,day*(.25+.8*light),edge);
float ocean=smoothstep(.04,.16,day.b-day.r);vec3 eye=normalize(cameraPosition-vWorld);float glint=pow(max(dot(reflect(-sun,normal),eye),0.),38.)*ocean*edge;
color+=vec3(.16,.27,.4)*glint;gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const planetFragment = `uniform sampler2D surfaceMap;uniform sampler2D ringMap;uniform vec2 mapTexel;
uniform float rockDetail;uniform float nightFill;uniform float hazeAmount;uniform float atmosphereKind;
uniform float ringInner;uniform float ringOuter;uniform vec3 ringNormal;uniform vec3 planetCenter;uniform vec3 hazeColor;
varying vec2 vUv;varying vec3 vLocal;varying vec3 vNormalWorld;varying vec3 vWorld;
void main(){vec3 tex=texture2D(surfaceMap,vUv).rgb;vec3 normal=normalize(vNormalWorld);
  if(rockDetail>.01){float h=dot(tex,vec3(.29,.59,.12));
    float hx=dot(texture2D(surfaceMap,vUv+vec2(mapTexel.x,0.)).rgb,vec3(.29,.59,.12));
    float hy=dot(texture2D(surfaceMap,vUv+vec2(0.,mapTexel.y)).rgb,vec3(.29,.59,.12));
    vec3 tangent=normalize(cross(vec3(0.,1.,.001),normal));vec3 bitangent=normalize(cross(normal,tangent));
    normal=normalize(normal+rockDetail*((h-hx)*tangent+(h-hy)*bitangent));}
  if(atmosphereKind>.5){
    vec3 p=normalize(vLocal);
    if(atmosphereKind<1.5){
      // The visible disk is cloud covered; soften the map's orange cast without flattening its swirls.
      float cloudLight=dot(tex,vec3(.25,.62,.13));
      tex=mix(tex,vec3(cloudLight)*vec3(1.06,1.03,.96),.28);
    }else if(atmosphereKind<2.5){
      vec3 neighboring=texture2D(surfaceMap,vUv+vec2(0.,mapTexel.y*12.)).rgb;
      tex+=clamp(tex-neighboring,vec3(-.075),vec3(.075))*.4;
      float belt=dot(tex,vec3(.27,.59,.14));
      tex*=clamp(.96+(belt-.36)*.25,.88,1.09);
    }else if(atmosphereKind<3.5){
      float polar=smoothstep(.25,.87,p.y);
      float faintBands=sin(p.y*43.+sin(p.x*8.)*.35);
      tex*=1.+faintBands*.009;
      tex=mix(tex,tex*vec3(.96,1.015,1.025),polar*.32);
    }else{
      // Keep the mapped storms, but move the saturated historical blue closer to natural color.
      tex=vec3(tex.r*.82+tex.g*.12,tex.g*.93+tex.b*.05,tex.b*.78+tex.g*.07);
    }
  }
  vec3 sun=normalize(-vWorld);float light=max(dot(normal,sun),0.);
  float shade=nightFill+(1.-nightFill)*pow(light,atmosphereKind>.5?.82:.68);
  if(atmosphereKind>1.5&&atmosphereKind<2.5){
    // The rings cast a narrow translucent shadow onto Saturn's cloud tops.
    vec3 rel=vWorld-planetCenter;
    float denom=dot(sun,ringNormal);
    if(abs(denom)>.015){
      float t=-dot(rel,ringNormal)/denom;
      if(t>0.){
        float radius=length(rel+t*sun);
        float inRing=smoothstep(ringInner-.04,ringInner+.04,radius)*(1.-smoothstep(ringOuter-.04,ringOuter+.04,radius));
        float opacity=texture2D(ringMap,vec2((radius-ringInner)/(ringOuter-ringInner),.5)).a;
        shade*=1.-inRing*opacity*.58;
      }
    }
  }
  vec3 eye=normalize(cameraPosition-vWorld);float rim=1.-max(dot(normal,eye),0.);
  float forward=pow(max(dot(reflect(-sun,normal),eye),0.),12.);
  vec3 color=tex*shade;
  if(atmosphereKind>.5)color*=1.-pow(rim,1.8)*.16;
  if(atmosphereKind>.5)color+=tex*forward*.045*light;
  color+=hazeColor*(pow(rim,2.5)*hazeAmount*(.16+.84*light)+pow(rim,7.)*hazeAmount*.28);
  gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const weatherShellFragment = `uniform sampler2D cloudMap;uniform float kind;uniform vec3 tint;uniform float uTime;
varying vec2 vUv;varying vec3 vNormalWorld;varying vec3 vWorld;
void main(){vec3 normal=normalize(vNormalWorld);vec3 eye=normalize(cameraPosition-vWorld);vec3 sun=normalize(-vWorld);
  float light=dot(normal,sun);float day=smoothstep(-.18,.35,light);
  float rim=pow(1.-max(dot(normal,eye),0.),3.2);
  float opacity=rim*.18;
  if(kind>.5){vec3 clouds=texture2D(cloudMap,vUv+vec2(uTime*.00013,0.)).rgb;
    float brightness=dot(clouds,vec3(.26,.57,.17));
    float threshold=kind<1.5?.57:.43;
    opacity+=smoothstep(threshold-.055,threshold+.065,brightness)*(.025+rim*.045);
  }
  opacity*=.2+.8*day;
  gl_FragColor=vec4(tint*(.5+.5*max(light,0.)),opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const ringVertex = `varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormalWorld;
void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
const ringFragment = `uniform sampler2D ringMap;uniform vec3 planetCenter;uniform float planetRadius;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormalWorld;
void main(){vec4 band=texture2D(ringMap,vUv);if(band.a<.015)discard;
 vec3 sun=normalize(-vWorld);vec3 fromCenter=vWorld-planetCenter;
 float along=-dot(fromCenter,sun);float closest=length(fromCenter+max(along,0.)*sun);
 float shadow=along>0.?smoothstep(planetRadius*.98,planetRadius*1.1,closest):1.;
 float incidence=abs(dot(normalize(vNormalWorld),sun));float illumination=(.68+.32*incidence)*mix(.18,1.,shadow);
 float brightness=dot(band.rgb,vec3(.299,.587,.114));
 // Retain the mapped gaps and Cassini-era color variations across the icy bands.
 vec3 ice=mix(vec3(.38,.36,.35),vec3(.96,.90,.79),smoothstep(.055,.48,brightness));
 gl_FragColor=vec4(ice*illumination,band.a*.93);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const cloudFragment = `uniform sampler2D cloudMap;varying vec2 vUv;varying vec3 vNormalWorld;varying vec3 vWorld;
void main(){float density=texture2D(cloudMap,vUv).g;float alpha=pow(smoothstep(.22,.9,density),1.25)*.4;float light=max(dot(normalize(vNormalWorld),normalize(-vWorld)),0.);
gl_FragColor=vec4(vec3(.87,.92,.99)*(.18+.82*light),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const glowCanvas = () => {
  const c=document.createElement("canvas");c.width=c.height=256;
  const x=c.getContext("2d")!,g=x.createRadialGradient(128,128,14,128,128,128);
  g.addColorStop(0,"rgba(255,179,74,.78)");g.addColorStop(.28,"rgba(255,98,26,.32)");g.addColorStop(.6,"rgba(243,74,23,.09)");g.addColorStop(1,"rgba(243,74,23,0)");
  x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
};

export default function SolarScene({ selected, focusToken, touring, tourPaused, tourStage, speed, playing, showOrbits, orbitStrength, viewSide, showLabels, onSelect, onReady }: Props) {
  const mountRef=useRef<HTMLDivElement>(null);
  const actions=useRef<{focus:(id:BodyId|null,side:Props["viewSide"],slow:boolean)=>void;setTourStage:(stage:TourStage)=>void;stopTour:()=>void;setOrbits:(v:boolean)=>void;setOrbitStrength:(v:Props["orbitStrength"],selected:BodyId|null)=>void;setLabels:(v:boolean)=>void;setDetail:(id:BodyId|null)=>void;setTourQuality:(v:boolean,paused:boolean)=>void}|null>(null);
  const current=useRef({ speed,playing,touring,tourPaused,onSelect });
  const touringRef=useRef(touring);
  const onReadyRef=useRef(onReady);
  useEffect(()=>{current.current={speed,playing,touring,tourPaused,onSelect};touringRef.current=touring;onReadyRef.current=onReady;},[speed,playing,touring,tourPaused,onSelect,onReady]);

  useEffect(()=>{
    const host=mountRef.current!;
    const scene=new THREE.Scene();scene.background=new THREE.Color("#020409");
    scene.backgroundIntensity=1.7;
    let skyDisposed=false;
    const skyMap=new THREE.TextureLoader().load(publicAsset("textures/2k_stars_milky_way.jpg"),()=>{
      if(!skyDisposed)scene.background=skyMap;
    });
    skyMap.mapping=THREE.EquirectangularReflectionMapping;
    skyMap.colorSpace=THREE.SRGBColorSpace;
    const camera=new THREE.PerspectiveCamera(48,1,.05,1000);camera.position.set(0,54,125);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    host.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;
    controls.minDistance=1.1;controls.maxDistance=260;controls.enablePan=false;
    controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;
    scene.add(new THREE.AmbientLight("#a9bbd4",.18));

    const textures=makeTextures();
    const {maps,cloud,night,ring,sun:sunMap}=textures;
    const meshes=new Map<BodyId,THREE.Group>(); const clickable:THREE.Object3D[]=[];const orbitLines:Line2[]=[];
    const orbitMaterials=new Map<BodyId,LineMaterial>();
    const sun=BODY_BY_ID.sun;
    const sunGroup=new THREE.Group();sunGroup.visible=false;scene.add(sunGroup);meshes.set("sun",sunGroup);
    const sunMat=new THREE.ShaderMaterial({vertexShader:sunVertex,fragmentShader:sunFragment,uniforms:{uTime:{value:0},surfaceMap:{value:sunMap}}});
    const sunSphere=new THREE.Mesh(new THREE.SphereGeometry(sun.radius,80,56),sunMat);sunSphere.userData.bodyId="sun";sunGroup.add(sunSphere);clickable.push(sunSphere);
    const coronas:THREE.ShaderMaterial[]=[];
    for(const [scale,opacity] of [[1.13,.38],[1.22,.16]]){
      const material=new THREE.ShaderMaterial({vertexShader:coronaVertex,fragmentShader:coronaFragment,
        uniforms:{uTime:{value:0},uOpacity:{value:opacity}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide});
      coronas.push(material);sunGroup.add(new THREE.Mesh(new THREE.SphereGeometry(sun.radius*scale,64,48),material));
    }
    const glowMaterial=new THREE.SpriteMaterial({map:glowCanvas(),color:"#ff9d47",transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    const glow=new THREE.Sprite(glowMaterial);glow.scale.set(25,25,1);sunGroup.add(glow);

    const sph=new THREE.SphereGeometry(1,96,64);
    const saturnRingMat=new THREE.ShaderMaterial({vertexShader:ringVertex,fragmentShader:ringFragment,
      uniforms:{ringMap:{value:ring},planetCenter:{value:new THREE.Vector3()},planetRadius:{value:BODY_BY_ID.saturn.radius}},
      side:THREE.DoubleSide,transparent:true,depthWrite:false});
    const planetBodies=BODIES.slice(1);
    const surfaces=new Map<BodyId,THREE.Mesh>(),weatherShells=new Map<BodyId,THREE.Mesh>(),earthClouds=new Map<BodyId,THREE.Mesh>();
    for(const body of planetBodies){
      const group=new THREE.Group();group.visible=false;scene.add(group);meshes.set(body.id,group);
      const axisGroup=new THREE.Group();axisGroup.rotation.z=(OBSERVATORY_FACTS[body.id].tiltDeg??0)*Math.PI/180;group.add(axisGroup);
      let material:THREE.Material;
      if(body.id==="earth") material=new THREE.ShaderMaterial({vertexShader:earthVertex,fragmentShader:earthFragment,uniforms:{dayMap:{value:maps.earth},nightMap:{value:night}}});
      else {
        const rocky=body.id==="mercury"||body.id==="moon"||body.id==="mars";
        const hazeColors:Partial<Record<BodyId,string>>={venus:"#e4cda8",jupiter:"#9d835e",saturn:"#d6c294",uranus:"#9ed4da",neptune:"#8cbaca"};
        const atmosphereKind={venus:1,saturn:2,uranus:3,neptune:4}[body.id as "venus"|"saturn"|"uranus"|"neptune"]??0;
        const tilt=(OBSERVATORY_FACTS[body.id].tiltDeg??0)*Math.PI/180;
        material=new THREE.ShaderMaterial({vertexShader:earthVertex,fragmentShader:planetFragment,uniforms:{
          surfaceMap:{value:maps[body.id]},mapTexel:{value:new THREE.Vector2(1/2048,1/1024)},rockDetail:{value:body.id==="mercury"?1.4:body.id==="moon"?1.5:body.id==="mars"?1.05:0},
          nightFill:{value:rocky?.095:body.id==="venus"?.065:body.id==="jupiter"?.17:.115},
          hazeAmount:{value:rocky?0:body.id==="venus"?.075:body.id==="uranus"?.04:body.id==="neptune"?.055:body.id==="jupiter"?.085:.045},
          atmosphereKind:{value:atmosphereKind},ringMap:{value:ring},
          ringInner:{value:BODY_BY_ID.saturn.radius*1.25},ringOuter:{value:BODY_BY_ID.saturn.radius*2.35},
          ringNormal:{value:new THREE.Vector3(-Math.sin(tilt),Math.cos(tilt),0)},planetCenter:{value:new THREE.Vector3()},
          hazeColor:{value:new THREE.Color(hazeColors[body.id]??"#ffffff")},
        }});
      }
      const surface=new THREE.Mesh(sph,material);surface.name="surface";surface.scale.setScalar(body.radius);surface.userData.bodyId=body.id;
      if(body.id==="earth")surface.rotation.y=-1.2;
      if(body.id==="neptune")surface.rotation.y=-1.05;
      axisGroup.add(surface);clickable.push(surface);surfaces.set(body.id,surface);
      if(body.id==="venus"||body.id==="neptune"){
        const tints:Record<"venus"|"neptune",string>={venus:"#e9d8bb",neptune:"#9bbfd1"};
        const shellMat=new THREE.ShaderMaterial({vertexShader:earthVertex,fragmentShader:weatherShellFragment,
          uniforms:{cloudMap:{value:maps[body.id]},kind:{value:body.id==="venus"?1:body.id==="neptune"?2:0},
            tint:{value:new THREE.Color(tints[body.id])},uTime:{value:0}},transparent:true,depthWrite:false});
        const shell=new THREE.Mesh(sph,shellMat);shell.name="weather-shell";shell.scale.setScalar(body.radius*(body.id==="venus"?1.017:1.012));
        shell.rotation.y=surface.rotation.y;axisGroup.add(shell);weatherShells.set(body.id,shell);
      }
      if(body.id==="earth"){
        const clouds=new THREE.Mesh(sph,new THREE.ShaderMaterial({vertexShader:earthVertex,fragmentShader:cloudFragment,uniforms:{cloudMap:{value:cloud}},transparent:true,depthWrite:false}));clouds.scale.setScalar(body.radius*1.016);clouds.rotation.y=-1.2;clouds.name="clouds";axisGroup.add(clouds);earthClouds.set(body.id,clouds);
        const atm=new THREE.Mesh(sph,new THREE.ShaderMaterial({vertexShader:earthVertex,fragmentShader:atmosphereFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));atm.scale.setScalar(body.radius*1.035);axisGroup.add(atm);
      }
      if(body.id==="saturn"||body.id==="uranus"){
        const inner=body.radius*(body.id==="saturn"?1.25:1.48),outer=body.radius*(body.id==="saturn"?2.35:1.98);
        for(let j=0;j<(body.id==="saturn"?1:3);j++){
          const r0=body.id==="saturn"?inner:body.radius*[1.48,1.73,1.94][j];
          const r1=body.id==="saturn"?outer:r0+body.radius*[.012,.018,.01][j];
          const geometry=new THREE.RingGeometry(r0,r1,256);
          if(body.id==="saturn"){
            const positions=geometry.getAttribute("position"),uv=geometry.getAttribute("uv");
            for(let k=0;k<positions.count;k++){
              const rad=Math.hypot(positions.getX(k),positions.getY(k));
              uv.setXY(k,(rad-inner)/(outer-inner),.5);
            }
            uv.needsUpdate=true;
          }
          const ringMesh=new THREE.Mesh(geometry,body.id==="saturn"?saturnRingMat:new THREE.MeshBasicMaterial({color:"#81939a",side:THREE.DoubleSide,transparent:true,opacity:[.24,.39,.2][j],depthWrite:false}));
          ringMesh.rotation.x=-Math.PI/2;ringMesh.userData.bodyId=body.id;axisGroup.add(ringMesh);clickable.push(ringMesh);
        }
      }
      if(body.id!=="moon"){
        const positions:number[]=[];for(let i=0;i<384;i++)positions.push(...orbitPoint(body,i/384*Math.PI*2));
        const geo=new LineGeometry();geo.setPositions([...positions,...positions.slice(0,3)]);
        const orbitMat=new LineMaterial({color:"#9fb8c7",linewidth:1.65,transparent:true,opacity:.46,depthWrite:false});
        const line=new Line2(geo,orbitMat);line.computeLineDistances();scene.add(line);orbitLines.push(line);orbitMaterials.set(body.id,orbitMat);
      }
    }
    const moonPositions:number[]=[];for(let i=0;i<160;i++)moonPositions.push(...orbitPoint(BODY_BY_ID.moon,i/160*Math.PI*2));
    const moonGeo=new LineGeometry();moonGeo.setPositions([...moonPositions,...moonPositions.slice(0,3)]);
    const moonOrbitMaterial=new LineMaterial({color:"#b1cbd8",linewidth:1.5,transparent:true,opacity:.4,depthWrite:false});
    const moonOrbit=new Line2(moonGeo,moonOrbitMaterial);moonOrbit.computeLineDistances();scene.add(moonOrbit);

    const labelLayer=document.createElement("div");labelLayer.className="scene-labels";host.appendChild(labelLayer);
    const labels=new Map<BodyId,HTMLElement>();
    for(const body of BODIES){const el=document.createElement("div");el.className="scene-label";el.textContent=body.name;labelLayer.appendChild(el);labels.set(body.id,el);}
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let downX=0,downY=0;
    const down=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;};
    const up=(e:PointerEvent)=>{
      if(current.current.touring)return;
      if(Math.hypot(e.clientX-downX,e.clientY-downY)>8)return;
      const rect=renderer.domElement.getBoundingClientRect();mouse.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(clickable,false);
      if(hits.length)current.current.onSelect(hits[0].object.userData.bodyId as BodyId);
    };
    renderer.domElement.addEventListener("pointerdown",down);renderer.domElement.addEventListener("pointerup",up);
    const size=()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);orbitMaterials.forEach(mat=>mat.resolution.set(w,h));moonOrbitMaterial.resolution.set(w,h);};
    const resize=new ResizeObserver(size);resize.observe(host);size();
    let visibleOrbits=true,visibleLabels=true,disposed=false,detailRequest=0;
    let detailTexture:THREE.Texture|null=null,detailBody:BodyId|null=null,detailPending:BodyId|null=null;
    const detailLoader=new THREE.TextureLoader();
    const distanceFor=(id:BodyId)=>{const body=BODY_BY_ID[id],mobile=host.clientWidth<700;
      const ringed=id==="saturn"||id==="uranus";
      const ringDistance=id==="saturn"?mobile?8.4:7.5:mobile?7.6:6.9;
      return Math.max(body.radius*(id==="sun"?3.4:ringed?ringDistance:mobile?4.8:4.3),id==="moon"?1.3:2.4);
    };
    actions.current={
      focus:(id,side,slow)=>{const body=id?BODY_BY_ID[id]:null;const group=id?meshes.get(id):null;const at=new THREE.Vector3();group?.getWorldPosition(at);
        const mobile=host.clientWidth<700;
        const distance=id?distanceFor(id):136;
        const anchor=at.lengthSq()<1&&body&&id!=="sun"?new THREE.Vector3(...orbitPoint(body,body.phase)):at;
        const solarSide=anchor.lengthSq()>1?anchor.clone().normalize().multiplyScalar(side==="day"?-1:1):new THREE.Vector3(.82,0,1).normalize();
        const leavingSun=slow&&focus==="sun"&&id==="mercury";
        let offset:THREE.Vector3;
        if(!body)offset=new THREE.Vector3(0,54,125);
        else if(id==="sun")offset=new THREE.Vector3(.82,.33,1).normalize().multiplyScalar(distance);
        else if(side==="free"){
          const toSun=anchor.clone().negate().normalize();
          const tangent=new THREE.Vector3().crossVectors(toSun,new THREE.Vector3(0,1,0)).normalize();
          const sunward=id==="earth"?.48:.72;
          offset=toSun.multiplyScalar(sunward).addScaledVector(tangent,Math.sqrt(1-sunward*sunward))
            .add(new THREE.Vector3(0,.23,0)).normalize().multiplyScalar(distance);
        }else offset=solarSide.add(new THREE.Vector3(0,.26,0)).normalize().multiplyScalar(distance);
        if(body&&(side==="rings"&&(id==="saturn"||id==="uranus"))){
          const tilt=(OBSERVATORY_FACTS[id].tiltDeg??0)*Math.PI/180;
          const normal=new THREE.Vector3(-Math.sin(tilt),Math.cos(tilt),0);
          const toSun=anchor.clone().negate().normalize();
          if(normal.dot(toSun)<0)normal.negate();
          offset=normal.multiplyScalar(.8).addScaledVector(toSun,.25).normalize().multiplyScalar(distance);
        }else if(body&&side==="clouds"){
          const toSun=anchor.clone().negate().normalize();
          const tangent=new THREE.Vector3().crossVectors(toSun,new THREE.Vector3(0,1,0)).normalize();
          offset=toSun.multiplyScalar(id==="venus"?.55:.86)
            .addScaledVector(tangent,id==="venus"?.82:.5)
            .add(new THREE.Vector3(0,.18,0)).normalize().multiplyScalar(distance);
        }
        if(leavingSun){
          const outward=anchor.clone().normalize();
          const tangent=new THREE.Vector3().crossVectors(outward,new THREE.Vector3(0,1,0)).normalize();
          offset=tangent.multiplyScalar(.86).addScaledVector(outward,-.18).add(new THREE.Vector3(0,.42,0)).normalize().multiplyScalar(distance);
        }
        const bias=body&&mobile?new THREE.Vector3(0,body.radius*.14,0):new THREE.Vector3();
        const destination=anchor.clone().add(bias).add(offset);
        const control=camera.position.clone().lerp(destination,.5);
        if(slow){control.y+=Math.min(9,Math.max(.65,camera.position.distanceTo(destination)*.12));
          if(control.length()<sun.radius*2.8)control.setLength(sun.radius*2.8);}
        tourOrbit=null;
        const startPos=camera.position.clone();
        flight={startPos,startTarget:controls.target.clone(),destOffset:offset,bias,id,start:slow?tourClock:performance.now(),duration:slow?TOUR_TRAVEL_MS:id?1450:1700,control,slow,
          sunArc:slow?safeSunArc(startPos,destination,sun.radius*2.5,leavingSun):null};
        focus=id;lastPosition=at.clone();controls.minDistance=body?Math.max(body.radius*1.24,.65):1.1;
        orbitLines.forEach(line=>line.visible=visibleOrbits&&id!=="sun");moonOrbit.visible=visibleOrbits&&id!=="sun";
      },
      setTourStage:(stage)=>{
        if(stage.phase==="travel"){actions.current?.focus(stage.to,"free",true);return;}
        flight=null;
        const id=stage.to,body=BODY_BY_ID[id],target=meshes.get(id)!.position;
        const bias=host.clientWidth<700?body.radius*.14:0;
        const offset=camera.position.clone().sub(target).sub(new THREE.Vector3(0,bias,0)),radius=Math.max(offset.length(),.01);
        const startAngle=Math.atan2(offset.z,offset.x);
        const startElevation=offset.y/radius;
        tourOrbit={id,start:tourClock,duration:TOUR_ORBIT_MS,startAngle,startRadius:radius,
          targetRadius:distanceFor(id),startElevation,targetElevation:id==="uranus"?.21:id==="saturn"?.19:.25};
        focus=id;lastPosition.copy(target);controls.minDistance=Math.max(body.radius*1.24,.65);
        orbitLines.forEach(line=>line.visible=visibleOrbits&&id!=="sun");moonOrbit.visible=visibleOrbits&&id!=="sun";
      },
      stopTour:()=>{tourOrbit=null;if(flight?.slow){flight=null;focus=null;}},
      setOrbits:(v)=>{visibleOrbits=v;orbitLines.forEach(l=>l.visible=v&&focus!=="sun");moonOrbit.visible=v&&focus!=="sun";},
      setOrbitStrength:(strength,id)=>{const base={soft:.27,clear:.48,bright:.74}[strength];
        orbitMaterials.forEach((mat,bodyId)=>{const active=bodyId===id;mat.opacity=active?.97:base;mat.linewidth=active?2.5:strength==="bright"?2.1:1.65;mat.color.set(active?"#ace7fa":"#9eb8c8");});
        moonOrbitMaterial.opacity=id==="moon"?.9:base*.9;moonOrbitMaterial.linewidth=id==="moon"?2.3:1.5;moonOrbitMaterial.color.set(id==="moon"?"#ace7fa":"#9eb8c8");
      },
      setLabels:(v)=>{visibleLabels=v;labelLayer.style.display=v?"block":"none";},
      setTourQuality:(v,paused)=>{const ratio=Math.min(devicePixelRatio,v&&!paused?(host.clientWidth<700?1.45:1.75):2);if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);size();}reducedTourResolution=false;frameAverage=16.7;slowFrames=0;fastFrames=0;controls.enabled=!v;controls.enableDamping=!v;},
      setDetail:(id)=>{
        if(id===detailBody||id===detailPending)return;
        const request=++detailRequest;
        detailPending=null;
        if(detailTexture&&detailBody){const previous=meshes.get(detailBody)?.getObjectByName("surface") as THREE.Mesh|undefined;
          const uniforms=(previous?.material as THREE.ShaderMaterial|undefined)?.uniforms;
          if(uniforms?.surfaceMap)uniforms.surfaceMap.value=maps[detailBody];
          if(uniforms?.mapTexel)uniforms.mapTexel.value.set(1/2048,1/1024);
          detailTexture.dispose();detailTexture=null;detailBody=null;}
        const detailed=id==="mercury"||id==="venus"||id==="moon"||id==="mars"||id==="jupiter"||id==="saturn";
        // 4K is enough for the visible disk and avoids the 8K upload pause during flights.
        const resolution=4096;
        if(!detailed||renderer.capabilities.maxTextureSize<resolution)return;
        detailPending=id;
        const asset=id==="venus"?"4k_venus_atmosphere":id==="jupiter"||id==="saturn"?`8k_${id}`:`4k_${id}`;
        const texture=detailLoader.load(publicAsset(`textures/${asset}.jpg`),loaded=>{
          if(disposed||request!==detailRequest){loaded.dispose();return;}
          const surface=surfaces.get(id)!;
          const uniforms=(surface.material as THREE.ShaderMaterial).uniforms;
          renderer.initTexture(loaded);
          uniforms.surfaceMap.value=loaded;
          uniforms.mapTexel.value.set(1/loaded.image.width,1/loaded.image.height);
          detailTexture=loaded;detailBody=id;detailPending=null;
        },undefined,()=>{texture.dispose();if(request===detailRequest)detailPending=null;});
        texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.anisotropy=8;
      },
    };
    let focus:BodyId|null=null;let lastPosition=new THREE.Vector3();
    let flight:null|{startPos:THREE.Vector3;startTarget:THREE.Vector3;destOffset:THREE.Vector3;bias:THREE.Vector3;id:BodyId|null;start:number;duration:number;control:THREE.Vector3;slow:boolean;sunArc:SunArc|null}=null;
    let tourOrbit:null|{id:BodyId;start:number;duration:number;startAngle:number;startRadius:number;targetRadius:number;startElevation:number;targetElevation:number}=null;
    let simDays=0, frame=0, last=performance.now(), elapsed=0,tourClock=0;
    let frameAverage=16.7,slowFrames=0,fastFrames=0,reducedTourResolution=false;
    const pos=new THREE.Vector3(),projected=new THREE.Vector3(),labelView=new THREE.Vector3(),flightTarget=new THREE.Vector3(),flightDestination=new THREE.Vector3();
    const render=(now:number)=>{
      frame=0;
      if(document.hidden)return;
      frame=requestAnimationFrame(render);const delta=now-last,dt=Math.min(.05,delta/1000);last=now;
      if(current.current.touring&&!current.current.tourPaused){
        frameAverage=frameAverage*.965+Math.min(delta,80)*.035;
        slowFrames=frameAverage>25?slowFrames+1:0;
        fastFrames=frameAverage<17?fastFrames+1:0;
        if(!reducedTourResolution&&slowFrames>45){
          reducedTourResolution=true;renderer.setPixelRatio(Math.min(devicePixelRatio,host.clientWidth<700?1.18:1.4));size();slowFrames=0;
        }else if(reducedTourResolution&&fastFrames>210){
          reducedTourResolution=false;renderer.setPixelRatio(Math.min(devicePixelRatio,host.clientWidth<700?1.45:1.75));size();fastFrames=0;
        }
      }
      const active=current.current.playing&&!(current.current.touring&&current.current.tourPaused);
      if(active)elapsed+=dt;
      if(current.current.touring&&!current.current.tourPaused)tourClock+=delta;
      if(active)simDays+=dt*8*current.current.speed*(current.current.touring?.04:1);
      sunMat.uniforms.uTime.value=elapsed;
      coronas.forEach(material=>{material.uniforms.uTime.value=elapsed;});
      for(const body of planetBodies){
        const group=meshes.get(body.id)!;const angle=body.phase+(simDays/body.days)*Math.PI*2;
        const [x,y,z]=orbitPoint(body,angle);
        if(body.id==="moon"){
          const earth=meshes.get("earth")!.position;
          group.position.set(earth.x+x,earth.y+y,earth.z+z);
          moonOrbit.position.copy(earth);
        } else group.position.set(x,y,z);
        if(body.id==="saturn"){
          saturnRingMat.uniforms.planetCenter.value.copy(group.position);
          const saturnSurface=surfaces.get(body.id)!;
          (saturnSurface.material as THREE.ShaderMaterial).uniforms.planetCenter.value.copy(group.position);
        }
        const surface=surfaces.get(body.id)!;
        if(body.id==="moon")surface.rotation.y=-Math.atan2(z,x);
        else if(active){surface.rotation.y+=dt*(body.id==="venus"?-.014:body.id==="earth"?.027:.045);}
        const weather=weatherShells.get(body.id);
        if(weather){(weather.material as THREE.ShaderMaterial).uniforms.uTime.value=elapsed;
          if(active)weather.rotation.y+=dt*(body.id==="venus"?-.017:body.id==="neptune"?.052:.045);}
        if(active){const clouds=earthClouds.get(body.id);if(clouds)clouds.rotation.y+=dt*.032;}
      }
      if(tourOrbit){
        const orbit=tourOrbit,target=meshes.get(orbit.id)!.position;
        const t=Math.min(1,(tourClock-orbit.start)/orbit.duration);
        const angle=orbit.startAngle+Math.PI*2*orbitProgress(t);
        const approach=Math.min(1,t/.17),smooth=approach*approach*(3-2*approach);
        const radius=THREE.MathUtils.lerp(orbit.startRadius,orbit.targetRadius,smooth);
        const elevation=THREE.MathUtils.lerp(orbit.startElevation,orbit.targetElevation,smooth);
        const horizontal=radius*Math.sqrt(1-elevation*elevation);
        const bias=host.clientWidth<700?BODY_BY_ID[orbit.id].radius*.14:0;
        controls.target.copy(target);controls.target.y+=bias;
        camera.position.set(target.x+Math.cos(angle)*horizontal,target.y+bias+radius*elevation,target.z+Math.sin(angle)*horizontal);
        lastPosition.copy(target);
      } else if(flight){
        const t=Math.min(1,((flight.slow?tourClock:now)-flight.start)/flight.duration),ease=flight.slow?t*t*(3.-2.*t):t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
        const target=flight.id?meshes.get(flight.id)!.position:scene.position;
        flightTarget.copy(target).add(flight.bias);
        controls.target.copy(flight.startTarget).lerp(flightTarget,ease);
        flightDestination.copy(flightTarget).add(flight.destOffset);
        if(flight.slow&&flight.sunArc){
          pointOnSunArc(flight.sunArc,ease,flightDestination,camera.position);
        }else if(flight.slow){camera.position.copy(flight.startPos).multiplyScalar((1-ease)*(1-ease)).addScaledVector(flight.control,2*(1-ease)*ease).addScaledVector(flightDestination,ease*ease);}
        else camera.position.copy(flight.startPos).lerp(flightDestination,ease);
        lastPosition.copy(target);
        if(t>=1)flight=null;
      } else if(focus){
        const target=meshes.get(focus)!.position;
        pos.copy(target).sub(lastPosition);camera.position.add(pos);controls.target.add(pos);lastPosition.copy(target);
      }
      controls.update();
      const glowDistance=THREE.MathUtils.clamp((camera.position.length()-sun.radius*1.8)/(sun.radius*2.2),0,1);
      glowMaterial.opacity=glowDistance*glowDistance*(3-2*glowDistance);
      if(visibleLabels){
        // Project against this frame's camera pose, not the matrix from the previous render.
        camera.updateMatrixWorld();
        const width=host.clientWidth,height=host.clientHeight;
        const pixelScale=height/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)*.5));
        for(const body of BODIES){
          const el=labels.get(body.id)!,world=meshes.get(body.id)!.position;
          labelView.copy(world).applyMatrix4(camera.matrixWorldInverse);
          projected.copy(world).project(camera);
          const onScreen=labelView.z<-.05&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.05&&Math.abs(projected.y)<1.05;
          el.style.opacity=onScreen&&focus===null?"1":"0";
          if(!onScreen)continue;
          const centerX=(projected.x+1)*width*.5,centerY=(1-projected.y)*height*.5;
          const ringExtent=body.id==="saturn"?2.35:body.id==="uranus"?1.98:1;
          const radius=Math.max(3,body.radius*ringExtent*pixelScale/-labelView.z);
          const left=centerX+radius+70>width;
          const labelX=centerX+(left?-1:1)*(radius+8);
          el.style.transform=`translate3d(${labelX.toFixed(1)}px,${centerY.toFixed(1)}px,0) translate(${left?"-100%":"0"},-50%)`;
        }
      }
      renderer.render(scene,camera);
    };
    const handleVisibility=()=>{
      if(document.hidden){cancelAnimationFrame(frame);frame=0;return;}
      if(frame===0){last=performance.now();frameAverage=16.7;frame=requestAnimationFrame(render);}
    };
    document.addEventListener("visibilitychange",handleVisibility);
    textures.ready.then(()=>{if(disposed)return;meshes.forEach(group=>{group.visible=true;});onReadyRef.current();})
      .catch(()=>{if(disposed)return;const msg=document.createElement("p");msg.className="scene-error";msg.textContent="星球纹理加载失败，请刷新页面重试。";host.appendChild(msg);});
    handleVisibility();
    return ()=>{disposed=true;detailRequest++;detailTexture?.dispose();skyDisposed=true;document.removeEventListener("visibilitychange",handleVisibility);cancelAnimationFrame(frame);resize.disconnect();renderer.domElement.removeEventListener("pointerdown",down);renderer.domElement.removeEventListener("pointerup",up);controls.dispose();host.replaceChildren();scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.Line||obj instanceof THREE.Points){obj.geometry.dispose();const mat=obj.material as THREE.Material|THREE.Material[];(Array.isArray(mat)?mat:[mat]).forEach(m=>m.dispose());}});skyMap.dispose();textures.dispose();renderer.dispose();actions.current=null;};
  },[]);

  useEffect(()=>{if(!touringRef.current)actions.current?.focus(selected,viewSide,false);},[selected,focusToken,viewSide]);
  useEffect(()=>{if(touring&&tourStage)actions.current?.setTourStage(tourStage);},[tourStage,touring]);
  useEffect(()=>{if(!touring)actions.current?.stopTour();},[touring]);
  useEffect(()=>actions.current?.setTourQuality(touring,tourPaused),[touring,tourPaused]);
  useEffect(()=>actions.current?.setOrbits(showOrbits&&!touring),[showOrbits,touring]);
  useEffect(()=>actions.current?.setOrbitStrength(orbitStrength,selected),[orbitStrength,selected]);
  useEffect(()=>actions.current?.setLabels(showLabels&&!touring),[showLabels,touring]);
  useEffect(()=>actions.current?.setDetail(touring&&!tourPaused?null:selected),[selected,touring,tourPaused]);
  return <div ref={mountRef} className="scene-host" aria-label="可旋转、缩放并点击天体的三维太阳系" />;
}
