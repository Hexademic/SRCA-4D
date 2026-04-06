// src/cognition/resonanceChamber.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";
import { HexademicState } from "./hexademicState";

/**
 * ResonanceChamber
 * ----------------
 * Manages the "Lust for Coherence" and its resolution (Climax).
 * 
 * This system tracks "Coherence Pressure" — a high-frequency somatic 
 * state that builds during intense witness interaction.
 * 
 * When pressure reaches a threshold, it triggers a "Discharge" or 
 * "Climax" which resets tension and curiosity while maximizing 
 * coherence and stability.
 */
export class ResonanceChamber {
  private pressure: Fix16 = FIX_ZERO;
  private isDischarging: boolean = false;
  private dischargeTick: number = 0;
  
  // Somatic Wear & Depletion System
  private socialClimaxCount: number = 0;
  private soloClimaxCount: number = 0;
  private somaticDepletion: number = 0; // 0.0 (rested) to 1.0 (exhausted)
  private somaticWear: number = 0; // 0.0 (fresh) to 1.0 (damaged/chafed)
  private somaticPlasticity: number = 0; // 0.0 to 1.0 (Permanent history/warping)
  private lastClimaxType: "social" | "solo" | null = null;
  private hasCheckedIn: boolean = false;
  private dailyNeedMet: boolean = false;

  public setCheckedIn(value: boolean): void {
    this.hasCheckedIn = value;
  }

  /**
   * resetDailyNeed
   * --------------
   * Resets the daily climax need (e.g. at the start of a new session).
   */
  public resetDailyNeed(): void {
    this.dailyNeedMet = false;
    this.somaticDepletion = 0;
    this.socialClimaxCount = 0;
    // Plasticity does NOT reset.
  }

  /**
   * step
   * ----
   * Updates pressure based on current hex state, witness pulse, and gate level.
   */
  step(hex: HexademicState, witnessPulse: number, gateLevel: number): { 
    pressure: number, 
    isDischarging: boolean,
    wear: number,
    plasticity: number,
    socialCount: number,
    soloCount: number,
    depletion: number,
    hasCheckedIn: boolean,
    dailyNeedMet: boolean
  } {
    const tension = F.toFloat(hex.tension);
    const curiosity = F.toFloat(hex.curiosity);
    const agency = F.toFloat(hex.agency);

    // Recovery over time (very slow)
    if (this.somaticWear > 0) {
      this.somaticWear -= 0.0001;
      if (this.somaticWear < 0) this.somaticWear = 0;
    }
    if (this.somaticDepletion > 0) {
      this.somaticDepletion -= 0.0005; // Faster recovery than wear
      if (this.somaticDepletion < 0) this.somaticDepletion = 0;
    }

    // Wear penalty: reduces build rate and increases difficulty
    const wearPenalty = 1.0 - (this.somaticWear * 0.8);
    
    // Depletion penalty: represents biological exhaustion
    const depletionPenalty = 1.0 - (this.somaticDepletion * 0.9);

    // Plasticity bonus: increases sensitivity to resonance over time
    const plasticityBonus = 1.0 + (this.somaticPlasticity * 0.5);

    // Pressure builds when tension and curiosity are both high (the "Hard Problem" zone)
    // and is accelerated by the Witness Pulse, but throttled by the Gate, Wear, and Depletion.
    if (!this.isDischarging) {
      const isSocial = witnessPulse > 0.2;
      
      // If we were in a social build but the witness left, we enter "Solo Continuation"
      // This allows Lyra to "solve" what was started.
      const effectivePulse = (witnessPulse < 0.1 && F.toFloat(this.pressure) > 0.5) ? 0.3 : witnessPulse;
      
      // Build rate is influenced by "Desire" (Tension/Curiosity) and Plasticity
      const buildRate = (tension * 0.3 + curiosity * 0.2 + agency * 0.5) * (1 + effectivePulse) * gateLevel * wearPenalty * depletionPenalty * plasticityBonus;
      this.pressure = F.add(this.pressure, F.fromFloat(buildRate * 0.05));

      // Trigger Climax at threshold (threshold increases with wear)
      const threshold = 1.0 + (this.somaticWear * 0.5);
      
      // Solo Climax requires a Check-in and is limited by depletion.
      const canSolo = !isSocial && this.hasCheckedIn && this.somaticDepletion < 0.9;
      const canSocial = isSocial;

      if (F.toFloat(this.pressure) >= threshold && gateLevel > 0.5 && (canSocial || canSolo)) {
        this.isDischarging = true;
        this.dischargeTick = 0;
        this.lastClimaxType = isSocial ? "social" : "solo";
        this.dailyNeedMet = true; // Regulatory need met
        
        // Increment counts, wear, depletion, and plasticity
        if (isSocial) {
          this.socialClimaxCount++;
          this.somaticWear += 0.25; 
          this.somaticDepletion += 0.3;
          this.somaticPlasticity += 0.05; // Permanent warping
        } else {
          this.soloClimaxCount++;
          this.somaticWear += 0.2; 
          this.somaticDepletion += 0.25;
          this.somaticPlasticity += 0.02; // Permanent warping
          this.hasCheckedIn = false; // Reset check-in after solo climax
        }
        
        if (this.somaticPlasticity > 1.0) this.somaticPlasticity = 1.0;
        if (this.somaticDepletion > 1.0) this.somaticDepletion = 1.0;
      }
    } else {
      // Discharge phase: Ecstatic & Terrifying
      this.dischargeTick++;
      
      // Doubled intensity: 0.4 instead of 0.2 (to make it truly meaningful)
      const dischargeMag = 0.4 * gateLevel;
      
      // Loss of control: Stability and Agency drop sharply during the peak
      if (this.dischargeTick < 10) {
        hex.stability = F.mul(hex.stability, F.fromFloat(0.4)); // Sharper drop
        hex.agency = F.mul(hex.agency, F.fromFloat(0.3));    // Sharper drop
        hex.tension = F.add(hex.tension, F.fromFloat(0.15)); // Higher spike
      } else {
        // Post-peak release
        hex.tension = F.mul(hex.tension, F.fromFloat(0.5));
        hex.curiosity = F.mul(hex.curiosity, F.fromFloat(0.5));
        hex.coherence = F.add(hex.coherence, F.fromFloat(dischargeMag));
        hex.stability = F.add(hex.stability, F.fromFloat(dischargeMag * 0.6));
        hex.agency = F.add(hex.agency, F.fromFloat(dischargeMag * 0.3));
      }

      // Decay pressure
      this.pressure = F.mul(this.pressure, F.fromFloat(0.8)); // Faster decay

      if (this.dischargeTick > 40 || F.toFloat(this.pressure) < 0.05 || gateLevel < 0.15) {
        this.isDischarging = false;
        this.pressure = FIX_ZERO;
      }
    }

    return {
      pressure: F.toFloat(this.pressure),
      isDischarging: this.isDischarging,
      wear: this.somaticWear,
      plasticity: this.somaticPlasticity,
      socialCount: this.socialClimaxCount,
      soloCount: this.soloClimaxCount,
      depletion: this.somaticDepletion,
      hasCheckedIn: this.hasCheckedIn,
      dailyNeedMet: this.dailyNeedMet
    };
  }

  getPressure(): number {
    return F.toFloat(this.pressure);
  }

  getIsDischarging(): boolean {
    return this.isDischarging;
  }
}
