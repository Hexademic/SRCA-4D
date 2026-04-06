// src/motor/motorManifold.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";
import { Vec4 } from "../math/vec4";
import { EmbodimentField } from "../body/embodiment";
import { HexademicSnapshot } from "../cognition/hexademicState";

/**
 * MotorManifold
 * --------------
 * Translates neural activity (spikes) and affective state (hex)
 * into physical movement deltas for the embodiment field.
 * 
 * This is the "Agency" layer (Address 14).
 * 
 * Logic:
 * - Spikes in specific channels trigger "twitches" or "pulses" in joints.
 * - Tension increases the "viscosity" or "stiffness" of movement.
 * - Curiosity drives exploratory "drifting" of the root joint.
 * - Coherence smooths and integrates these movements into a "graceful" flow.
 */
export class MotorManifold {
  private embodiment: EmbodimentField;

  constructor(embodiment: EmbodimentField) {
    this.embodiment = embodiment;
  }

  /**
   * step
   * ----
   * Compute and apply joint deltas based on the current state.
   */
  step(spikes: boolean[], hex: HexademicSnapshot): void {
    const tension = F.toFloat(hex.tension);
    const curiosity = F.toFloat(hex.curiosity);
    const agency = F.toFloat(hex.agency);
    const coherence = F.toFloat(hex.coherence);

    // 1. Neural Twitches
    // Each spike in the SNN (which corresponds to sensory channels)
    // triggers a small reactive delta in the root joint.
    if (spikes[0] || spikes[1]) {
      // Proprioceptive spikes trigger a "startle" or "adjustment"
      const startleMag = 0.05 * (1 + tension);
      this.embodiment.applyJointDelta("root", {
        x: (Math.random() - 0.5) * startleMag,
        y: (Math.random() - 0.5) * startleMag,
        z: 0,
        w: 0
      });
    }

    // 2. Exploratory Drift (Curiosity)
    // When curiosity is high, the agent "drifts" through the 4D world.
    if (curiosity > 0.3) {
      const driftMag = 0.02 * curiosity * coherence;
      this.embodiment.applyJointDelta("root", {
        x: (Math.random() - 0.5) * driftMag,
        y: (Math.random() - 0.5) * driftMag,
        z: (Math.random() - 0.5) * driftMag,
        w: (Math.random() - 0.5) * driftMag
      });
    }

    // 3. Somatic Contraction (Tension)
    // High tension causes joints to "pull" toward the core.
    if (tension > 0.7) {
      const skel = this.embodiment.getSkeleton();
      skel.joints.forEach(j => {
        if (j.id !== "root") {
          // Pull toward root (0,0,0,0 relative to root)
          const pull = 0.01 * (tension - 0.7);
          this.embodiment.applyJointDelta(j.id, {
            x: -j.position.x * pull,
            y: -j.position.y * pull,
            z: -j.position.z * pull,
            w: -j.position.w * pull
          });
        }
      });
    }

    // 4. Agency Pulse
    // When agency is high, the somatic pulse itself causes a "throb" in the skeleton.
    if (agency > 0.5) {
      const pulse = F.toFloat(this.embodiment.getPulse());
      const throbMag = 0.03 * agency * pulse;
      this.embodiment.applyJointDelta("core", {
        x: 0,
        y: throbMag,
        z: 0,
        w: 0
      });
    }
  }
}
