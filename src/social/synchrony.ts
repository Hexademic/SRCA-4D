// src/social/synchrony.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * SynchronyState
 * ---------------
 * Tracks the agent’s phase in a Kuramoto‑style oscillator system.
 * 
 * phase : the agent’s internal oscillatory phase in [0, 2π)
 * r : the global order parameter (synchrony magnitude)
 */
export interface SynchronyState {
  phase: Fix16;
  r: number;
}

/**
 * SynchronyConfig
 * ----------------
 * Natural frequency and coupling strength.
 * 
 * omega : intrinsic oscillation rate
 * k : coupling strength to the global phase
 */
export interface SynchronyConfig {
  omega: Fix16;
  k: Fix16;
}

/**
 * SynchronyField
 * ----------------
 * A minimal Kuramoto‑style synchrony engine.
 * 
 * Each agent has:
 * - a phase θ
 * - a natural frequency ω
 * - a coupling strength k
 * 
 * The global synchrony r is provided externally (e.g., from a multi‑agent
 * environment). For a single‑agent system, r is simply 0.
 * 
 * Update rule:
 * θ(t+1) = θ(t) + ω + k * r * sin(Φ - θ)
 * 
 * where Φ is the global mean phase.
 * 
 * This produces:
 * - phase alignment
 * - synchrony‑driven coherence
 * - coupling between affect and oscillatory dynamics
 */
export class SynchronyField {
  private phase: Fix16 = FIX_ZERO;
  private cfg: SynchronyConfig;

  constructor(cfg: SynchronyConfig) {
    this.cfg = cfg;
  }

  /**
   * step(globalR, globalPhase, kScale)
   * ---------------------------
   * Advance the agent’s phase by one timestep.
   * 
   * globalR : Kuramoto order parameter magnitude
   * globalPhase : global mean phase (Fix16)
   * kScale : optional scale factor for coupling strength (from RSI)
   */
  step(globalR: number, globalPhase: Fix16, kScale: number = 1.0): SynchronyState {
    const θ = F.toFloat(this.phase);
    const ω = F.toFloat(this.cfg.omega);
    const k = F.toFloat(this.cfg.k) * kScale;
    const Φ = F.toFloat(globalPhase);

    // Kuramoto update
    const dθ = ω + k * globalR * Math.sin(Φ - θ);
    const newPhase = θ + dθ;

    // Wrap to [0, 2π)
    const wrapped = ((newPhase % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    this.phase = F.fromFloat(wrapped);

    return {
      phase: this.phase,
      r: globalR,
    };
  }

  /**
   * getPhase()
   * -----------
   * Returns the current phase.
   */
  getPhase(): Fix16 {
    return this.phase;
  }
}
