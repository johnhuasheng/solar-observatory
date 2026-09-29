import * as THREE from "three";
import type { BodyId } from "./planetData";

type TexturePack = {
  maps: Partial<Record<BodyId, THREE.Texture>>;
  night: THREE.Texture;
  cloud: THREE.Texture;
  sun: THREE.Texture;
  ring: THREE.Texture;
  ready: Promise<void>;
  dispose: () => void;
};

/** Locally bundled Solar System Scope maps, CC BY 4.0. */
export function makeTextures(): TexturePack {
  const loader = new THREE.TextureLoader();
  const all: THREE.Texture[] = [];
  const pending: Promise<void>[] = [];
  const load = (name: string, isColor = true) => {
    let texture!: THREE.Texture;
    const ext = name === "saturn_ring_alpha" ? "png" : "jpg";
    const url = `/textures/2k_${name}.${ext}`;
    pending.push(new Promise<void>((resolve, reject) => {
      texture = loader.load(url, () => resolve(), undefined, () => reject(new Error(`无法加载纹理 ${name}`)));
    }));
    if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    all.push(texture);
    return texture;
  };
  const maps: Partial<Record<BodyId, THREE.Texture>> = {
    mercury: load("mercury"), venus: load("venus_atmosphere"),
    earth: load("earth_daymap"), moon: load("moon"), mars: load("mars"),
    jupiter: load("jupiter"), saturn: load("saturn"),
    uranus: load("uranus"), neptune: load("neptune"),
  };
  const night = load("earth_nightmap");
  const cloud = load("earth_clouds", false);
  const sun = load("sun");
  const ring = load("saturn_ring_alpha");
  return { maps, night, cloud, sun, ring, ready: Promise.all(pending).then(() => undefined), dispose: () => all.forEach(t => t.dispose()) };
}
