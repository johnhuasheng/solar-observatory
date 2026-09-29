import type { BodyId } from "./planetData";

// Rounded mean Sun distances in AU, equatorial/mean diameters in km, and axial tilts.
// The light-time display is an average-distance comparison, not an instantaneous position.
export const OBSERVATORY_FACTS: Record<BodyId,{au:number;diameterKm:number;tiltDeg:number|null}>={
  sun:{au:0,diameterKm:1390000,tiltDeg:7.25},
  mercury:{au:.387,diameterKm:4879,tiltDeg:.034},
  venus:{au:.723,diameterKm:12104,tiltDeg:177.4},
  earth:{au:1,diameterKm:12742,tiltDeg:23.4},
  moon:{au:1,diameterKm:3475,tiltDeg:null},
  mars:{au:1.524,diameterKm:6779,tiltDeg:25.2},
  jupiter:{au:5.20,diameterKm:139820,tiltDeg:3.1},
  saturn:{au:9.58,diameterKm:116460,tiltDeg:26.7},
  uranus:{au:19.2,diameterKm:50724,tiltDeg:97.77},
  neptune:{au:30.05,diameterKm:49244,tiltDeg:28.3},
};

export function formatLightTime(id:BodyId){
  const seconds=OBSERVATORY_FACTS[id].au*499.0048;
  if(seconds===0)return "0 秒";
  const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),rest=Math.round(seconds%60);
  return hours?`约 ${hours} 小时 ${minutes} 分钟`:minutes?`约 ${minutes} 分 ${rest} 秒`:`约 ${rest} 秒`;
}
