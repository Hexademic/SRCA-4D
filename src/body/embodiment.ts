// src/body/embodiment.ts
import { Skeleton } from "./joints";
import { Gaussian4DWorld } from "../world/gaussian4d";
import { SomaticOscillator } from "./somaticOscillator";
import { Vec4 } from "../math/vec4";
import { Fix16, Fix16 as F } from "../math/fixed16";

/**
 * EmbodimentField
 * ----------------
 * This module defines the agent’s physical presence inside the 4D manifold.
 * 
 * Responsibilities:
 * - Holds the agent’s skeleton (currently a single root joint)
 * - Applies movement deltas to joints
 * - Ensures all joint positions remain inside the Gaussian4DWorld
 * - Manages the Somatic Oscillator (the heartbeat of the substrate)
 * 
 * This is the “body” layer of the architecture.
 * Everything above it (sensory, prediction, affect, regimes, attention, SNN)
 * depends on this physical substrate.
 */
export interface EmbodimentConfig {
  world: Gaussian4DWorld;
  skeleton: Skeleton;
}

export class EmbodimentField {
  private world: Gaussian4DWorld;
  private skeleton: Skeleton;
  private oscillator: SomaticOscillator;
  private pulseValue: Fix16 = F.fromFloat(0);

  constructor(cfg: EmbodimentConfig) {
    this.world = cfg.world;
    this.skeleton = cfg.skeleton;
    this.oscillator = new SomaticOscillator();
  }

  /**
   * step(tension, arousal)
   * ---------------------
   * Updates the somatic pulse based on affective state.
   */
  step(tension: Fix16, arousal: Fix16): void {
    this.pulseValue = this.oscillator.step(tension, arousal);
  }

  /**
   * getSkeleton()
   * -------------
   * Return the full skeleton.
   * Higher layers (sensory, behavior) read joint positions from here.
   */
  getSkeleton(): Skeleton {
    return this.skeleton;
  }

  /**
   * getPulse()
   * ----------
   * Returns the current value of the somatic heartbeat.
   */
  getPulse(): Fix16 {
    return this.pulseValue;
  }

  /**
   * applyJointDelta(jointId, delta)
   * ------------------------------
   * Apply a movement delta to a specific joint.
   * The new position is then projected back into the 4D manifold.
   */
  applyJointDelta(jointId: string, delta: Vec4): void {
    const j = this.skeleton.joints.find(j => j.id === jointId);
    if (!j) return;

    const newPos: Vec4 = {
      x: j.position.x + delta.x,
      y: j.position.y + delta.y,
      z: j.position.z + delta.z,
      w: j.position.w + delta.w,
    };

    // The world enforces manifold constraints.
    j.position = this.world.projectToManifold(newPos);
  }
}
