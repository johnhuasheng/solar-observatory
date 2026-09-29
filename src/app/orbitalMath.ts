import type { Body, BodyId } from "./planetData";

// Approximate J2000 eccentricities and inclinations from JPL SSD.
// Orbital distances are compressed separately for this visual scene;
// phases are illustrative, not a live ephemeris.
const SHAPE: Partial<Record<BodyId,{e:number;inclination:number}>>={
  mercury:{e:.2056,inclination:7.005},venus:{e:.0068,inclination:3.395},
  earth:{e:.0167,inclination:0},moon:{e:.055,inclination:5.1},
  mars:{e:.0934,inclination:1.850},jupiter:{e:.0484,inclination:1.304},
  saturn:{e:.0539,inclination:2.486},uranus:{e:.0473,inclination:.773},
  neptune:{e:.0086,inclination:1.770},
};

export function orbitPoint(body:Body,meanAnomaly:number):[number,number,number]{
  const {e,inclination}=SHAPE[body.id]??{e:0,inclination:0};
  let anomaly=meanAnomaly;
  for(let n=0;n<5;n++) anomaly-=(anomaly-e*Math.sin(anomaly)-meanAnomaly)/(1-e*Math.cos(anomaly));
  const x=body.orbit*(Math.cos(anomaly)-e);
  const other=body.orbit*Math.sqrt(1-e*e)*Math.sin(anomaly);
  const tilt=inclination*Math.PI/180;
  return [x,other*Math.sin(tilt),other*Math.cos(tilt)];
}
