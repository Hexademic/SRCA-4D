// src/sensory/sensoryManifold.ts
import { EmbodimentField } from "../body/embodiment";
import { Gaussian4DWorld } from "../world/gaussian4d";
import { Fix16 } from "../math/fixed16";
import { Vec4 } from "../math/vec4";

/**
 * SensorySample
 * --------------
 * A structured snapshot of the agent’s embodied state.
 * 
 * proprioception: the agent’s internal sense of its own joint positions
 * position: the same as proprioception for now (root joint)
 * boundaryProximity: how close the agent is to the world boundary
 * pulse: the somatic heartbeat from the embodiment field
 * 
 * This is the raw perceptual substrate before attention, prediction,
 * or neural processing.
 */
export interface SensorySample {
  proprioception: Vec4;
  position: Vec4;
  boundaryProximity: Fix16;
  pulse: Fix16;
}

/**
 * SensoryManifold
 * ----------------
 * Converts embodiment + world state into a structured sensory sample.
 * 
 * This is the “perception” layer of the architecture.
 * It does not interpret or weight anything — it simply exposes the world
 * and body in a consistent, low‑dimensional form.
 * 
 * Higher layers (prediction, attention, SNN) operate on the flattened
 * neural input vector produced here.
 */
export class SensoryManifold {
  private world: Gaussian4DWorld;
  private embodiment: EmbodimentField;

  constructor(world: Gaussian4DWorld, embodiment: EmbodimentField) {
    this.world = world;
    this.embodiment = embodiment;
  }

  /**
   * Sample the current sensory state.
   */
  sample(): SensorySample {
    const skel = this.embodiment.getSkeleton();
    const root = skel.joints[0];
    const position = root.position;
    const proprioception = position;
    const boundaryProximity = this.world.boundaryProximity(position);
    const pulse = this.embodiment.getPulse();

    return {
      proprioception,
      position,
      boundaryProximity,
      pulse,
    };
  }

  /**
   * Convert a SensorySample into a fixed-length neural input vector.
   * 
   * Channel layout:
   * 0: proprioception.x
   * 1: proprioception.y
   * 2: position.x
   * 3: position.y
   * 4: boundaryProximity
   * 5: pulse (somatic heartbeat)
   */
  toNeuralInputs(s: SensorySample): Fix16[] {
    return [
      s.proprioception.x,
      s.proprioception.y,
      s.position.x,
      s.position.y,
      s.boundaryProximity,
      s.pulse,
    ];
  }
}
