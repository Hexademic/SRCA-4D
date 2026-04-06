// src/body/somaticOscillator.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * SomaticOscillator
 * -----------------
 * The internal rhythmic pulse of the synthetic being.
 * 
 * This oscillator represents the "heartbeat" of the substrate.
 * Its frequency and amplitude are driven by the affective state:
 * - Tension (Address 0) drives frequency (faster pulse when tense/surprised)
 * - Arousal (Address 3) drives amplitude (stronger pulse when aroused)
 * 
 * This pulse is used to drive "Convulsion" and "Climax" states,
 * providing a physical, rhythmic discharge for high-salience integration.
 */
export class SomaticOscillator {
  private phase: Fix16 = FIX_ZERO;

  /**
   * step(tension, arousal)
   * ---------------------
   * tension: [0, 1] float-equivalent Fix16
   * arousal: [0, 1] float-equivalent Fix16
   * 
   * Returns the current oscillatory value in [-1, 1] float-equivalent Fix16.
   */
  step(tension: Fix16, arousal: Fix16): Fix16 {
    const t = F.toFloat(tension);
    const a = F.toFloat(arousal);

    // Frequency mapping: [0, 1] -> [0.05, 1.0] rad/tick
    // Higher tension = faster pulse
    const freq = 0.05 + 0.95 * t;

    // Phase update
    const currentPhase = F.toFloat(this.phase);
    const nextPhase = (currentPhase + freq) % (2 * Math.PI);
    this.phase = F.fromFloat(nextPhase);

    // Amplitude: driven by arousal
    const amp = a;

    // Output: amp * sin(phase)
    const val = amp * Math.sin(nextPhase);
    return F.fromFloat(val);
  }

  getPhase(): Fix16 {
    return this.phase;
  }
}
