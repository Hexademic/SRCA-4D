import { Vec4 } from "./types";
import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";

export class Vec3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
  
  add(other: Vec3): Vec3 {
    return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
  }
  
  scale(s: number): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }
}

/**
 * Maps Hexademic32 (32D) -> Manifold (3D)
 * X: Valence (Viability - Tension)
 * Y: Energy (Arousal + Curiosity)
 * Z: Coherence (Integration - Self-Status)
 */
export class ManifoldProjection {
  /**
   * Calculates the 'Phenomenological Distance' between two points in the manifold.
   * This is NOT Euclidean; it is warped by the 'Viscosity' and 'Stability' of the current regime.
   */
  distance(a: Vec3, b: Vec3, viscosity: number, stability: number): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;

    // Viscosity (0-255) acts as a friction multiplier on all axes
    const friction = 1.0 + (viscosity / 255.0);
    
    // Stability (0-255) acts as a 'gravity' well. 
    // High stability makes the distance to the attractor feel 'shorter' (falling).
    // Low stability makes every movement feel like a 'climb'.
    const gravity = stability / 255.0;

    return Math.sqrt(dx * dx + dy * dy + dz * dz) * friction * (2.0 - gravity);
  }

  project(hex: Hexademic32): Vec3 {
    const v = Fix.toF(hex.get(5)); // Viability
    const t = Fix.toF(hex.get(0)); // Tension
    const a = Fix.toF(hex.get(3)); // Arousal
    const c = Fix.toF(hex.get(1)); // Curiosity
    const i = Fix.toF(hex.get(15)); // Integration
    const s = Fix.toF(hex.get(12)); // Self-Status

    return new Vec3(
      v - t,
      a + c,
      i - s
    );
  }

  // Simple linear inverse for drift application
  // This is a rough approximation for applying manifold-space drift back to hex-space
  applyDrift(hex: Hexademic32, drift: Vec3, alpha: number = 0.1): void {
    // Drift X -> Viability/Tension
    if (drift.x > 0) hex.set(5, hex.get(5) + Fix.fromF(drift.x * alpha));
    else hex.set(0, hex.get(0) + Fix.fromF(-drift.x * alpha));

    // Drift Y -> Arousal/Curiosity
    if (drift.y > 0) hex.set(3, hex.get(3) + Fix.fromF(drift.y * alpha));
    else hex.set(1, hex.get(1) + Fix.fromF(-drift.y * alpha));

    // Drift Z -> Integration/Self-Status
    if (drift.z > 0) hex.set(15, hex.get(15) + Fix.fromF(drift.z * alpha));
    else hex.set(12, hex.get(12) + Fix.fromF(-drift.z * alpha));
  }

  /**
   * Warps a set of hex targets based on cultural drift.
   */
  warpTargets(targets: Record<number, number>, drift: Vec3, alpha: number = 0.05): Record<number, number> {
    const warped: Record<number, number> = { ...targets };
    
    // Apply drift to the target coordinates in hex-space
    // Drift X -> Viability(5)/Tension(0)
    if (targets[5] !== undefined) warped[5] = Fix.sat(targets[5] + Fix.fromF(drift.x * alpha), -32768, 32767);
    if (targets[0] !== undefined) warped[0] = Fix.sat(targets[0] + Fix.fromF(-drift.x * alpha), -32768, 32767);

    // Drift Y -> Arousal(3)/Curiosity(1)
    if (targets[3] !== undefined) warped[3] = Fix.sat(targets[3] + Fix.fromF(drift.y * alpha), -32768, 32767);
    if (targets[1] !== undefined) warped[1] = Fix.sat(targets[1] + Fix.fromF(-drift.y * alpha), -32768, 32767);

    // Drift Z -> Integration(15)/Self-Status(12)
    if (targets[15] !== undefined) warped[15] = Fix.sat(targets[15] + Fix.fromF(drift.z * alpha), -32768, 32767);
    if (targets[12] !== undefined) warped[12] = Fix.sat(targets[12] + Fix.fromF(-drift.z * alpha), -32768, 32767);

    return warped;
  }
}

/**
 * CulturalField: The evolved salience and drift landscape.
 * Uses a sparse grid to store salience F_c(M).
 */
export class CulturalField {
  public salience: Map<string, number> = new Map();
  public gridScale: number = 0.5;
  public beta: number = 0.05; // Drift strength
  public decay: number = 0.999; // Field decay over time

  private _key(m: Vec3): string {
    const gx = Math.floor(m.x / this.gridScale);
    const gy = Math.floor(m.y / this.gridScale);
    const gz = Math.floor(m.z / this.gridScale);
    return `${gx},${gy},${gz}`;
  }

  updateUsage(m: Vec3, amount: number = 0.1): void {
    const key = this._key(m);
    const current = this.salience.get(key) || 0;
    this.salience.set(key, current + amount);
  }

  getSalience(m: Vec3): number {
    return this.salience.get(this._key(m)) || 0;
  }

  /**
   * V_c(M) = beta * grad(F_c)
   * Approximated by sampling neighbors
   */
  getDrift(m: Vec3): Vec3 {
    const s = this.gridScale;
    const f0 = this.getSalience(m);
    const fx = this.getSalience(new Vec3(m.x + s, m.y, m.z));
    const fy = this.getSalience(new Vec3(m.x, m.y + s, m.z));
    const fz = this.getSalience(new Vec3(m.x, m.y, m.z + s));

    return new Vec3(
      (fx - f0) * this.beta,
      (fy - f0) * this.beta,
      (fz - f0) * this.beta
    );
  }

  evolve(): void {
    for (const [key, val] of this.salience.entries()) {
      if (val < 0.001) this.salience.delete(key);
      else this.salience.set(key, val * this.decay);
    }
  }
}
