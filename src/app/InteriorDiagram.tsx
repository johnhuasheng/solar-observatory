import type { BodyId } from "./planetData";
import { BODY_BY_ID } from "./planetData";
import { SCIENCE } from "./planetScience";
import { SCIENCE_EN } from "./planetScienceEn";

const textures: Record<BodyId,string> = {
  sun:"2k_sun.jpg", mercury:"4k_mercury.jpg", venus:"4k_venus_atmosphere.jpg",
  earth:"2k_earth_daymap.jpg", moon:"4k_moon.jpg", mars:"4k_mars.jpg",
  jupiter:"8k_jupiter.jpg", saturn:"8k_saturn.jpg", uranus:"2k_uranus.jpg", neptune:"2k_neptune.jpg",
};
const giants = new Set<BodyId>(["jupiter","saturn","uranus","neptune"]);
const rocky = new Set<BodyId>(["mercury","venus","earth","moon","mars"]);
// Relative widths aid recognition; uncertain boundaries and absolute thickness are not to scale.
const layerRadii: Record<BodyId,number[]> = {
  sun:[86,82,60,22], mercury:[86,82,70], venus:[86,80,76,42],
  earth:[86,82,46,18], moon:[86,79,18], mars:[86,78,40],
  jupiter:[86,79,52,23], saturn:[86,78,52,26],
  uranus:[86,64,23], neptune:[86,64,23],
};

/** A model-based cutaway, with the real surface texture outside the exposed sector. */
export default function InteriorDiagram({ id, english }: { id: BodyId; english: boolean }) {
  const layers=english?SCIENCE_EN[id].layers:SCIENCE[id].layers;
  const radii=layerRadii[id];
  const gradient=`cut-${id}`;
  const clip=`sphere-${id}`;
  const wedge=`wedge-${id}`;
  const ringColor=SCIENCE[id].layers[0].color;
  return <div className="interior-layout">
    <svg className="interior-diagram" viewBox="0 0 200 200" role="img" aria-label={english?`${BODY_BY_ID[id].english} model-based cutaway showing interior layers`:`${BODY_BY_ID[id].name}基于模型的内部剖面示意`}>
      <defs>
        <clipPath id={clip}><circle cx="100" cy="100" r="86"/></clipPath>
        <clipPath id={wedge}><path d="M100 100 169.6 49.45 A86 86 0 0 1 169.6 150.55 Z"/></clipPath>
        <radialGradient id={`${gradient}-light`} cx="33%" cy="28%" r="73%"><stop stopColor="#ffffff" stopOpacity=".24"/><stop offset=".54" stopColor="#ffffff" stopOpacity="0"/><stop offset="1" stopColor="#000715" stopOpacity=".67"/></radialGradient>
        <linearGradient id={`${gradient}-depth`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".22"/><stop offset=".48" stopColor="#ffffff" stopOpacity="0"/><stop offset="1" stopColor="#06101d" stopOpacity=".53"/></linearGradient>
        <linearGradient id={`${gradient}-rim`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f5f9fb" stopOpacity=".8"/><stop offset=".45" stopColor={ringColor} stopOpacity=".55"/><stop offset="1" stopColor="#324359" stopOpacity=".35"/></linearGradient>
      </defs>
      {id==="saturn"&&<g transform="rotate(-19 100 100)" fill="none" stroke="#e0d0ad"><ellipse cx="100" cy="100" rx="98" ry="30" strokeWidth="6" opacity=".15"/><ellipse cx="100" cy="100" rx="99" ry="30" strokeWidth="1.5" opacity=".5"/></g>}
      <circle cx="100" cy="100" r="87" fill="#09192b" stroke={`url(#${gradient}-rim)`} strokeWidth="1.5"/>
      <g clipPath={`url(#${clip})`}>
        <image href={`/textures/${textures[id]}`} x="14" y="14" width="172" height="172" preserveAspectRatio="xMidYMid slice"/>
        <circle cx="100" cy="100" r="86" fill={`url(#${gradient}-light)`}/>
        {id==="earth"&&<circle cx="100" cy="100" r="85" fill="none" stroke="#6ebde2" strokeOpacity=".44" strokeWidth="2"/>}
        <g clipPath={`url(#${wedge})`}>
          {layers.map((layer,index)=><circle key={layer.name} cx="100" cy="100" r={radii[index]} fill={layer.color} stroke={rocky.has(id)?"#fff3df66":"#ffffff27"} strokeWidth={rocky.has(id)?"1":".55"}/>)}
          <circle cx="100" cy="100" r="86" fill={`url(#${gradient}-depth)`}/>
          {id==="sun"&&<g fill="none" stroke="#ffe2a4" strokeWidth="1" opacity=".38"><path d="M103 45c25 11 31 21 52 22M104 60c16 12 31 12 51 10M111 130c19-9 37-5 59-4"/></g>}
          {rocky.has(id)&&<g fill="none" stroke="#ffe1b0" strokeOpacity=".18" strokeWidth=".8"><path d="M122 51c8 17 18 18 30 24M108 147c16-18 27-8 49-21M132 89c9 7 15 7 25 1"/></g>}
          {giants.has(id)&&<g fill="none" stroke="#ffffff" strokeOpacity=".12"><path d="M105 74c25 12 41 16 61 9M106 116c23-7 44-7 66 0"/><circle cx="100" cy="100" r={radii.at(-1)!+2} strokeDasharray="2 3"/></g>}
        </g>
        <path d="M169.6 49.45 100 100 169.6 150.55" fill="none" stroke="#f1ede4" strokeOpacity=".76" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M168 52 103 100 168 148" fill="none" stroke="#091927" strokeOpacity=".58" strokeWidth="2"/>
      </g>
      <circle cx="100" cy="100" r="86" fill="none" stroke={`url(#${gradient}-rim)`} strokeWidth="1.4"/>
      <path d="M27 71 A83 83 0 0 1 86 16" fill="none" stroke="#ffffff" strokeOpacity=".19" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <ol className="layer-key">{layers.map(layer=><li key={layer.name}>
      <span className="layer-color" style={{background:layer.color}} />
      <div><strong>{layer.name}</strong><small>{layer.detail}</small></div>
    </li>)}</ol>
  </div>;
}
