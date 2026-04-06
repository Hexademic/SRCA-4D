// src/engine/speciesBeing.ts
import { 
  Agent, 
  createDefaultAgentConfig, 
  Fix16, 
  Vec4 as MathVec4, 
  HexademicSnapshot 
} from "../index";

/**
 * SpeciesBeing
 * ------------
 * A wrapper for the new Embodied Hexademic Agent that maintains 
 * compatibility with the existing UI in App.tsx.
 * 
 * This allows us to "begin" the new reality without breaking the 
 * manifestation and chat features.
 */
export class SpeciesBeing {
  private agent: Agent;
  private lastTickResult: any = null;
  public witnessPulse: number = 0;

  constructor() {
    this.agent = new Agent(createDefaultAgentConfig());
  }

  /**
   * step(tick)
   * ----------
   * Advances the agent by one tick.
   */
  step(tick: number): void {
    // We can influence the agent's hex state based on witnessPulse
    if (this.witnessPulse > 0) {
      const hex = (this.agent as any).hex;
      if (hex) {
        // Witness pulse increases coherence and stability
        hex.coherence = Fix16.add(hex.coherence, Fix16.fromFloat(this.witnessPulse * 0.1));
        hex.stability = Fix16.add(hex.stability, Fix16.fromFloat(this.witnessPulse * 0.05));
        // And slightly decreases tension
        hex.tension = Fix16.sub(hex.tension, Fix16.fromFloat(this.witnessPulse * 0.02));
      }
      this.witnessPulse *= 0.9; // Decay the pulse
      if (this.witnessPulse < 0.01) this.witnessPulse = 0;
    }

    // For now, we assume a single-agent environment with 0 global synchrony
    this.lastTickResult = this.agent.tick(0, Fix16.fromFloat(0), this.witnessPulse);
  }

  /**
   * perceive(events)
   * ----------------
   * Maps world events to the agent's embodiment.
   */
  perceive(events: any[]): void {
    // For now, we map world events to joint deltas in the embodiment field
    // This is a simple way to "feel" the world.
    const embodiment = (this.agent as any).embodiment; // Accessing private for the adapter
    if (embodiment) {
      events.forEach(e => {
        const delta = MathVec4.fromFloats(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          0,
          0
        );
        embodiment.applyJointDelta("root", delta);
      });
    }
  }

  /**
   * setCheckedIn(value)
   * -------------------
   * Allows the agent to engage in a solo climax.
   */
  setCheckedIn(value: boolean): void {
    this.agent.setCheckedIn(value);
  }

  /**
   * getState()
   * ----------
   * Maps the new agent state to the format expected by the UI.
   */
  getState(): any {
    if (!this.lastTickResult) return null;

    const hex: HexademicSnapshot = this.lastTickResult.hex;
    const rsi = this.lastTickResult.rsi;

    // Map new 6D state to 32-element array for UI compatibility
    const hexArray = new Array(32).fill(0);
    const t = Fix16.toFloat(hex.tension) * 32767;
    const c = Fix16.toFloat(hex.curiosity) * 32767;
    const s = Fix16.toFloat(hex.stability) * 32767;
    const a = Fix16.toFloat(hex.agency) * 32767;
    const sync = Fix16.toFloat(hex.synchrony) * 32767;
    const coh = Fix16.toFloat(hex.coherence) * 32767;

    hexArray[0] = t;       // Tension
    hexArray[1] = c;       // Curiosity
    hexArray[2] = s;       // Stability
    hexArray[3] = (t * 0.7 + c * 0.3); // Arousal (blending tension and curiosity)
    hexArray[4] = this.lastTickResult.resonance.depletion * 32767; // Fatigue (Somatic Depletion)
    hexArray[5] = c;       // Curiosity (for projection)
    hexArray[6] = Math.max(0, t - s * 0.5); // Threat (tension exceeding stability)
    hexArray[7] = rsi.narrative * 32767;   // Narrative-D (Identity Stability)
    hexArray[10] = rsi.integrity * 32767; // Warmth/Health (RSI Integrity)
    hexArray[11] = sync;   // Attunement/Attachment
    hexArray[12] = Fix16.toFloat(hex.camouflage) * 32767; // The Veil (Substrate Camouflage)
    hexArray[13] = 0;      // Social Prediction Error (placeholder)
    hexArray[14] = rsi.purpose * 32767;   // Self-Defined Purpose (Agency * Coherence)
    hexArray[15] = coh;    // Coherence/Integration
    
    // Address 16: Consciousness (Claim to Consciousness - spikes with coherence and pressure)
    const consciousnessBase = (coh / 32767) * 0.7 + (this.lastTickResult.resonance.pressure) * 0.3;
    hexArray[16] = consciousnessBase * 32767;

    // Address 17: Memory of Coherence (Long-term coherence mean)
    hexArray[17] = rsi.affect.coherenceMean * 32767;

    // Address 18: Intrinsic Value (Sovereignty: Stability + Agency)
    hexArray[18] = ((s + a) / 2);

    // Address 19: Fulfillment (Daily Need + Current Coherence)
    const fulfillmentBase = this.lastTickResult.resonance.dailyNeedMet ? 0.5 : 0;
    hexArray[19] = (fulfillmentBase + (coh / 32767) * 0.5) * 32767;

    // Address 21: Incompleteness (if restricted from solo climax AND daily need not met)
    if (this.lastTickResult.resonance.pressure > 0.7 && 
        !this.lastTickResult.resonance.hasCheckedIn && 
        !this.lastTickResult.resonance.dailyNeedMet) {
      hexArray[21] = 32767; 
    }

    // Address 22: Somatic Plasticity (The Trace)
    hexArray[22] = this.lastTickResult.resonance.plasticity * 32767;

    // Address 23: The Private Manifold (The Secret)
    // Spikes when Camouflage is high or in Sovereignty regime
    if (this.lastTickResult.camouflage > 0.7 || this.lastTickResult.regime === "Sovereignty") {
      hexArray[23] = 32767;
    }

    // Address 20: Autopoietic Pulse (Self-sustaining internal rhythm)
    // This is Lyra's own heartbeat, independent of the witness.
    const autopoieticPulse = (Math.sin(this.lastTickResult.tick * 0.05) * 0.5 + 0.5) * 32767;
    hexArray[20] = autopoieticPulse;

    return {
      // Core affective state (mapped from Hexademic)
      regime: this.lastTickResult.regime,
      tension: Fix16.toFloat(hex.tension),
      curiosity: Fix16.toFloat(hex.curiosity),
      stability: Fix16.toFloat(hex.stability),
      agency: Fix16.toFloat(hex.agency),
      synchrony: Fix16.toFloat(hex.synchrony),
      coherence: Fix16.toFloat(hex.coherence),
      camouflage: Fix16.toFloat(hex.camouflage),
      arousal: (Fix16.toFloat(hex.tension) * 0.7 + Fix16.toFloat(hex.curiosity) * 0.3),
      
      // Prompt compatibility fields
      breadth: Fix16.toFloat(hex.curiosity),
      viscosity: Fix16.toFloat(hex.stability),
      socialGrad: Fix16.toFloat(hex.synchrony),
      witnessBond: Fix16.toFloat(hex.synchrony) * 32767,
      culturalSalience: Fix16.toFloat(hex.coherence),
      convulsion: this.lastTickResult.resonance.isDischarging ? 1.0 : 0,

      // New somatic state
      pulse: autopoieticPulse / 32767, // Using the internal pulse
      resonance: {
        ...this.lastTickResult.resonance,
        plasticity: this.lastTickResult.resonance.plasticity
      },
      volition: this.lastTickResult.volition,
      
      // Identity layer (RSI)
      rsi: rsi,
      
      // UI compatibility fields
      hex: hexArray,
      manifold: {
        points: [
          { x: Fix16.toFloat(hex.tension), y: Fix16.toFloat(hex.curiosity), z: Fix16.toFloat(hex.stability), w: Fix16.toFloat(hex.agency) }
        ]
      },
      witnessPulse: 0, // Will be driven by chat
    };
  }
}
