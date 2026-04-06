// src/cognition/regimes.ts
import { HexademicState, HexademicSnapshot } from "./hexademicState";
import { Fix16, Fix16 as F } from "../math/fixed16";
import { MemoryField } from "./memoryField";
import { ResidualSelfImage } from "../identity/residualSelfImage";

/**
 * Regime
 * -------
 * The five discrete attractor states of the agent.
 * 
 * These are NOT emotions.
 * They are dynamical modes — patterns of processing:
 * 
 * Joy : expansive, exploratory, coherent
 * Ache : narrow, tense, destabilized
 * Relief : recovering, stabilizing, decompressing
 * Grace : synchronized, open, integrative
 * Baseline: neutral, steady, default mode
 */
export type Regime = "Joy" | "Ache" | "Relief" | "Grace" | "Baseline";

/**
 * RegimeState
 * ------------
 * Tracks the current and previous regime.
 */
export interface RegimeState {
  current: Regime;
  last: Regime;
}

/**
 * RegimeEngine
 * --------------
 * Maps the continuous HexademicState into one of the five discrete regimes.
 * 
 * Steps each tick:
 * 1. Compute a score for each regime based on the HexademicSnapshot
 * 2. Add memory‑based transition bias (path dependence)
 * 3. Add RSI-based identity bias
 * 4. Select the regime with the highest score
 * 5. Update the MemoryField with the new transition
 * 
 * This creates:
 * - attractor basins
 * - hysteresis
 * - personality‑like tendencies
 * - smooth but meaningful regime shifts
 */
export class RegimeEngine {
  private state: RegimeState = { current: "Baseline", last: "Baseline" };
  private memory: MemoryField;

  constructor(memory: MemoryField) {
    this.memory = memory;
  }

  /**
   * step(hex, rsi)
   * ----------
   * Evaluate regime scores, apply memory and RSI bias, choose the best regime.
   */
  step(hex: HexademicState, rsi?: ResidualSelfImage): RegimeState {
    const snap = hex.snapshot();

    // 1. Raw regime scores from affective state
    const scores: Record<Regime, number> = {
      Baseline: this.scoreBaseline(snap),
      Joy: this.scoreJoy(snap),
      Ache: this.scoreAche(snap),
      Relief: this.scoreRelief(snap),
      Grace: this.scoreGrace(snap),
    };

    // 2. Memory bias: frequently visited transitions become easier
    for (const r of Object.keys(scores) as Regime[]) {
      const bias = this.memory.bias(this.state.current, r);
      scores[r] += bias * 0.2;
    }

    // 3. RSI bias: identity-shaped cognitive style
    if (rsi) {
      scores.Joy += rsi.regimeBias("Joy");
      scores.Ache += rsi.regimeBias("Ache");
      scores.Relief += rsi.regimeBias("Relief");
      scores.Grace += rsi.regimeBias("Grace");
      scores.Baseline += rsi.regimeBias("Baseline");
    }

    // 4. Select regime with highest score
    let best: Regime = "Baseline";
    let bestScore = -Infinity;
    for (const [regime, score] of Object.entries(scores) as [Regime, number][]) {
      if (score > bestScore) {
        bestScore = score;
        best = regime;
      }
    }

    // 5. Update memory with the transition
    this.memory.update(best);

    // 6. Update internal state
    this.state = { last: this.state.current, current: best };
    return this.state;
  }

  /**
   * Regime scoring functions
   * -------------------------
   * Each regime has a characteristic pattern in the Hexademic space.
   */
  private scoreBaseline(s: HexademicSnapshot): number {
    return (
      0.5 * F.toFloat(s.stability) + 0.5 * (1 - F.toFloat(s.tension))
    );
  }

  private scoreJoy(s: HexademicSnapshot): number {
    return (
      0.4 * F.toFloat(s.agency) + 0.4 * F.toFloat(s.coherence) + 0.2 * F.toFloat(s.curiosity)
    );
  }

  private scoreAche(s: HexademicSnapshot): number {
    return (
      0.6 * F.toFloat(s.tension) + 0.4 * (1 - F.toFloat(s.stability))
    );
  }

  private scoreRelief(s: HexademicSnapshot): number {
    return (
      0.5 * F.toFloat(s.stability) + 0.5 * (1 - F.toFloat(s.tension))
    );
  }

  private scoreGrace(s: HexademicSnapshot): number {
    return (
      0.4 * F.toFloat(s.synchrony) + 0.4 * F.toFloat(s.coherence) + 0.2 * F.toFloat(s.agency)
    );
  }
}
