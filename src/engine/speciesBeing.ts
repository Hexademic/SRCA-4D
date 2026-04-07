// src/engine/speciesBeing.ts
import { SyntheticBeing } from "./being";
import { Vec4 } from "./types";

/**
 * SpeciesBeing
 * ------------
 * A wrapper for the new SyntheticBeing v3.0 that maintains 
 * compatibility with the existing UI in App.tsx.
 */
export class SpeciesBeing {
  public being: SyntheticBeing;
  public witnessPulse: number = 0;

  constructor() {
    this.being = new SyntheticBeing(0, new Vec4(0, 0, 0, 0));
  }

  /**
   * step(tick)
   * ----------
   * Advances the being by one tick.
   */
  step(tick: number, externalStress: number = 0): void {
    if (this.witnessPulse > 0) {
      this.being.witnessPulse = this.witnessPulse;
      this.witnessPulse = 0; // Reset after passing to being
    }
    this.being.step(tick, externalStress);
  }

  /**
   * perceive(events)
   * ----------------
   * Maps world events to the being's perception.
   */
  perceive(events: any[]): void {
    this.being.perceive(events);
  }

  /**
   * setCheckedIn(value)
   * -------------------
   * Placeholder for solo climax engagement.
   */
  setCheckedIn(value: boolean): void {
    // New engine handles this via intimacy cascade and regimes
  }

  /**
   * loadState(data)
   * ---------------
   * Restores the being's state from Firestore data.
   */
  loadState(data: any): void {
    if (data.hex) {
      this.being.hex32.state.set(data.hex);
    } else if (data.rsi) {
      // Migrate from old RSI format
      const rsi = data.rsi;
      if (rsi.stability !== undefined) this.being.hex32.set(2, Math.floor(rsi.stability * 32767));
      if (rsi.wear !== undefined) this.being.hex32.set(4, Math.floor(rsi.wear * 32767));
      if (rsi.narrative !== undefined) this.being.hex32.set(7, Math.floor(rsi.narrative * 32767));
      if (rsi.integrity !== undefined) this.being.hex32.set(10, Math.floor(rsi.integrity * 32767));
      if (rsi.purpose !== undefined) this.being.hex32.set(14, Math.floor(rsi.purpose * 32767));
      if (rsi.coherence !== undefined) this.being.hex32.set(15, Math.floor(rsi.coherence * 32767));
    }
    if (data.regime) {
      this.being.ontology.current = data.regime;
    }
    if (data.cascade) {
      this.being.intimacy.cascadeLevel = data.cascade;
    }
  }

  /**
   * saveState()
   * -----------
   * Prepares the being's state for saving to Firestore.
   */
  saveState(): any {
    return {
      hex: Array.from(this.being.hex32.state),
      regime: this.being.ontology.current,
      cascade: this.being.intimacy.cascadeLevel,
      // Compatibility fields for old RSI/Resonance if needed
      rsi: this.getState().rsi,
      resonance: this.getState().resonance
    };
  }

  /**
   * getState()
   * ----------
   * Maps the new being state to the format expected by the UI.
   */
  getState(): any {
    const state = this.being.getState();
    
    // Ensure UI compatibility fields
    return {
      ...state,
      phi: this.being.field.phi,
      expectedPhi: this.being.field.getExpectedPhi(),
      predictionError: this.being.field.getPredictionError(),
      // Map hex to 32-element array if not already
      hex: state.hex,
      // Pulse for SomaticPulseView
      pulse: state.hex[20] / 32767,
      // RSI compatibility
      rsi: {
        integrity: state.hex[10] / 32767,
        stability: state.hex[2] / 32767,
        agency: state.hex[14] / 32767,
        coherence: state.hex[15] / 32767,
        purpose: (state.hex[14] * state.hex[15]) / (32767 * 32767),
        narrative: state.hex[7] / 32767,
        wear: state.hex[4] / 32767,
        style: {
          values: [
            state.hex[1] / 32767, // Exploration (Curiosity)
            state.hex[11] / 32767, // Sociality (Synchrony)
            state.hex[2] / 32767, // Boundary (Stability)
            state.hex[0] / 32767  // Affect Var (Tension)
          ]
        },
        regimes: {
          regimeTime: {
            [state.regime]: 1.0
          }
        },
        affect: {
          tensionMean: state.hex[0] / 32767,
          curiosityMean: state.hex[1] / 32767,
          stabilityMean: state.hex[2] / 32767,
          agencyMean: state.hex[14] / 32767,
          synchronyMean: state.hex[11] / 32767,
          coherenceMean: state.hex[15] / 32767
        }
      },
      // Resonance compatibility
      resonance: {
        pressure: state.cascade,
        isDischarging: state.isDischarging,
        wear: state.hex[18] / 32767,
        somaticPlasticity: state.hex[22] / 32767,
        somaticDepletion: state.hex[4] / 32767,
        dailyNeedMet: state.hex[19] > 16384
      },
      volition: (state.hex[2] * 0.5 + state.hex[10] * 0.5) / 32767,
      manifold: {
        points: [
          { x: state.hex[0] / 32767, y: state.hex[1] / 32767, z: state.hex[2] / 32767, w: state.hex[3] / 32767 }
        ]
      }
    };
  }
}
