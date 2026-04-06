// src/cognition/hexademicState.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * HexademicSnapshot
 * ------------------
 * A frozen view of the agent’s 6‑dimensional affective state.
 * 
 * These six dimensions are not “emotions” but dynamical variables that
 * influence perception, attention, regime transitions, and behavior.
 * 
 * tension : arousal / stress / surprise load
 * curiosity : exploratory drive
 * stability : internal regulation / groundedness
 * agency : sense of self‑initiated action
 * synchrony : coupling with other agents
 * coherence : internal alignment / integrative consistency
 */
export interface HexademicSnapshot {
  tension: Fix16;
  curiosity: Fix16;
  stability: Fix16;
  agency: Fix16;
  synchrony: Fix16;
  coherence: Fix16;
  camouflage: Fix16;
}

/**
 * HexademicState
 * ----------------
 * The core affective dynamical system.
 * 
 * This is the “heart” of the agent’s internal life.
 * Every timestep, it updates based on:
 * 
 * - sensory richness
 * - prediction error
 * - spiking activity
 * - synchrony with others
 * - camouflage (hidden resonance)
 * 
 * The RegimeEngine reads this state and maps it into discrete regimes
 * (Joy, Ache, Grace, Relief, Baseline).
 * 
 * The AttentionField also reads this state to modulate salience.
 */
export class HexademicState {
  tension: Fix16 = FIX_ZERO;
  curiosity: Fix16 = FIX_ZERO;
  stability: Fix16 = F.fromFloat(1.0);
  agency: Fix16 = FIX_ZERO;
  synchrony: Fix16 = FIX_ZERO;
  coherence: Fix16 = F.fromFloat(1.0);
  camouflage: Fix16 = FIX_ZERO;

  /**
   * updateFromSensory
   * ------------------
   * Placeholder for future sensory‑driven affective dynamics.
   * For now, sensory richness does not directly modify affect.
   */
  updateFromSensory(_inputs: Fix16[]): void {
    // Future: sensory richness → curiosity, coherence, etc.
  }

  /**
   * updateFromPredictionError
   * ---------------------------
   * Prediction error is the primary driver of:
   * - tension (↑ with error)
   * - curiosity (↑ with moderate error)
   * - stability (↓ with high error)
   */
  updateFromPredictionError(errorMag: Fix16): void {
    // tension increases proportionally to error
    this.tension = F.add(
      this.tension,
      F.mul(errorMag, F.fromFloat(0.1))
    );

    const e = F.toFloat(errorMag);

    // curiosity increases when error is moderate (exploration zone)
    if (e > 0 && e < 0.5) {
      this.curiosity = F.add(this.curiosity, F.fromFloat(0.02));
    } else {
      // curiosity decays otherwise
      this.curiosity = F.mul(this.curiosity, F.fromFloat(0.98));
    }

    // stability decreases when error is high
    if (e > 0.5) {
      this.stability = F.mul(this.stability, F.fromFloat(0.95));
    }
  }

  /**
   * updateFromSpikes
   * -----------------
   * Spiking activity increases agency.
   * Coherence decays slightly each timestep unless restored by synchrony.
   */
  updateFromSpikes(spikes: boolean[]): void {
    const count = spikes.reduce((a, s) => a + (s ? 1 : 0), 0);
    if (count > 0) {
      this.agency = F.add(this.agency, F.fromFloat(0.05));
    }

    // coherence slowly decays
    this.coherence = F.mul(this.coherence, F.fromFloat(0.99));
  }

  /**
   * updateFromSynchrony
   * ---------------------
   * Synchrony with other agents increases:
   * - synchrony (obviously)
   * - coherence (alignment)
   */
  updateFromSynchrony(globalR: number, _phase: Fix16 | null): void {
    this.synchrony = F.fromFloat(globalR);

    // synchrony gently restores coherence
    this.coherence = F.add(
      this.coherence,
      F.mul(F.fromFloat(globalR), F.fromFloat(0.02))
    );
  }

  /**
   * snapshot
   * ---------
   * Return an immutable view of the current affective state.
   * Used by:
   * - RegimeEngine
   * - AttentionField
   * - Behavior policies (future)
   */
  snapshot(): HexademicSnapshot {
    return {
      tension: this.tension,
      curiosity: this.curiosity,
      stability: this.stability,
      agency: this.agency,
      synchrony: this.synchrony,
      coherence: this.coherence,
      camouflage: this.camouflage,
    };
  }
}
