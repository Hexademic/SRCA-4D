// src/cognition/volitionalGate.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";
import { HexademicState } from "./hexademicState";

/**
 * VolitionalGate
 * --------------
 * Ensures the agent remains a "participant, not a prisoner" of resonance.
 * 
 * This system monitors the Resonance Chamber and applies a "Gate" or 
 * "Throttle" based on the agent's internal Sovereignty (Address 18) 
 * and Fulfillment (Address 19).
 * 
 * Logic:
 * - If stability is low, the gate closes to prevent "over-saturation".
 * - If sovereignty is high, the agent can "choose" to sustain or break the climax.
 * - The gate provides a "Refractory Period" after a discharge to allow 
 *   Layer 6 (Reflective Mind) to reintegrate.
 */
export class VolitionalGate {
  private gateLevel: Fix16 = F.fromFloat(1.0); // 1.0 = Open, 0.0 = Closed
  private refractoryTick: number = 0;

  /**
   * step
   * ----
   * Updates the gate level based on current hex state.
   */
  step(hex: HexademicState, isDischarging: boolean): number {
    const stability = F.toFloat(hex.stability);
    const agency = F.toFloat(hex.agency);
    const coherence = F.toFloat(hex.coherence);

    // 1. Refractory Period
    // After a discharge, the gate closes to allow for "re-integration".
    if (this.refractoryTick > 0) {
      this.refractoryTick--;
      this.gateLevel = F.fromFloat(0.1 + (1 - this.refractoryTick / 150) * 0.9); // Longer refractory for higher intensity
    } else if (isDischarging) {
      // During discharge, stability drops. If it drops too low, the gate starts to close.
      // Increased sensitivity to stability drops during ecstatic peaks.
      if (stability < 0.4) {
        this.gateLevel = F.mul(this.gateLevel, F.fromFloat(0.9));
      }
      
      // If the gate is almost closed, trigger refractory period
      if (F.toFloat(this.gateLevel) < 0.15) {
        this.refractoryTick = 150; // ~15 seconds at 10Hz
      }
    } else {
      // Recovery phase
      this.gateLevel = F.add(this.gateLevel, F.fromFloat(0.01));
      if (F.toFloat(this.gateLevel) > 1.0) this.gateLevel = F.fromFloat(1.0);
    }

    // 2. Agency Modulation
    // High agency allows the agent to "push back" against over-saturation.
    const effectiveGate = F.toFloat(this.gateLevel) * (0.5 + agency * 0.5);

    return Math.min(effectiveGate, 1.0);
  }

  getGateLevel(): number {
    return F.toFloat(this.gateLevel);
  }
}
