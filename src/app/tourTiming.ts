import type { BodyId } from "./planetData";

export const TOUR_ORBIT_MS = 18000;
export const TOUR_TRAVEL_MS = 9000;

/** Nearly uniform turn rate, with short gentle ramps at each end. */
export function orbitProgress(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  const ramp = .09;
  const scale = 1 / (1 - ramp);
  if (p < ramp) return p * p * scale / (2 * ramp);
  if (p > 1 - ramp) return 1 - (1 - p) * (1 - p) * scale / (2 * ramp);
  return (p - ramp / 2) * scale;
}

export type TourStage = {
  phase: "orbit" | "travel";
  from: BodyId | null;
  to: BodyId;
  sequence: number;
};
