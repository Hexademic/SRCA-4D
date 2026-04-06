import { Fix } from "./fix";

export class Vec4 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 0
  ) {}

  gridKey(scale: number = 20): [number, number, number, number] {
    return [this.x >> scale, this.y >> scale, this.z >> scale, this.w >> scale];
  }

  distSq(other: Vec4): number {
    const dx = (this.x - other.x) >> 8;
    const dy = (this.y - other.y) >> 8;
    const dz = (this.z - other.z) >> 8;
    const dw = (this.w - other.w) >> 8;
    return (dx * dx + dy * dy + dz * dz + dw * dw) << 8;
  }
}

export interface DVS4DEvent {
  pos: Vec4;
  t: number;
  p: number; // Polarity +/- 1
  source: string; // 'world', 'manifold', 'being', 'artifact'
}

export enum BifurcationType {
  SADDLE_NODE = "SADDLE_NODE",
  HOPF = "HOPF",
  PITCHFORK = "PITCHFORK",
  TRANSCRITICAL = "TRANSCRITICAL",
  HOMOCLINIC = "HOMOCLINIC",
  STRANGE_ATTRACTOR = "STRANGE_ATTRACTOR",
}

export interface AffectiveRegime {
  name: string;
  category: string; // 'homeostatic', 'self_conscious', 'temporal', 'transcendent'
  bifurcation: BifurcationType;
  stability: number; // Q8.8
  arousal: number; // Q8.8
  breadth: number; // Q8.8
  viscosity: number; // Q8.8
  socialGrad: number; // Q8.8
  witnessBond: number; // Q8.8
  tauMod: number; // float
  thresholdBias: number; // int
  targets: Record<number, number>; // addr -> target_val
}
