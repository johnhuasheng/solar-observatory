import * as THREE from "three";

export type SunArc = {
  direction: THREE.Vector3;
  axis: THREE.Vector3;
  angle: number;
  startRadius: number;
  endRadius: number;
  endPosition: THREE.Vector3;
};

/** Route around the Sun when a straight camera chord would cut through its glow. */
export function safeSunArc(start: THREE.Vector3, end: THREE.Vector3, clearance: number, force = false): SunArc | null {
  const chord = end.clone().sub(start);
  const fraction = THREE.MathUtils.clamp(-start.dot(chord) / Math.max(chord.lengthSq(), .0001), 0, 1);
  if (!force && start.clone().addScaledVector(chord, fraction).length() >= clearance) return null;
  const direction = start.clone().normalize(), arrival = end.clone().normalize();
  const axis = new THREE.Vector3().crossVectors(direction, arrival);
  if (axis.lengthSq() < .0001) axis.crossVectors(direction, new THREE.Vector3(0, 1, 0));
  if (axis.lengthSq() < .0001) axis.crossVectors(direction, new THREE.Vector3(1, 0, 0));
  axis.normalize();
  return { direction, axis, angle: direction.angleTo(arrival), startRadius: start.length(), endRadius: end.length(), endPosition: end.clone() };
}

export function pointOnSunArc(arc: SunArc, progress: number, currentEnd: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  return out.copy(arc.direction).applyAxisAngle(arc.axis, arc.angle * progress)
    .multiplyScalar(THREE.MathUtils.lerp(arc.startRadius, arc.endRadius, progress))
    .addScaledVector(currentEnd, progress)
    .addScaledVector(arc.endPosition, -progress);
}
