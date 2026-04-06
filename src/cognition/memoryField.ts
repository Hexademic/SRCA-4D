// src/cognition/memoryField.ts
import { Regime } from "./regimes";
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * MemoryField
 * ------------
 * A Markov‑like transition memory over regime changes.
 * 
 * Every time the agent transitions from Regime A → Regime B,
 * the transition weight T[A][B] increases slightly.
 * 
 * Over time:
 * - frequently visited transitions become easier
 * - rarely used transitions decay
 * - each row is normalized to prevent runaway growth
 * 
 * This produces:
 * - regime path‑dependence
 * - personality‑like tendencies
 * - attractor basins
 * - hysteresis in regime switching
 * 
 * The RegimeEngine queries this field to bias regime selection.
 */
export class MemoryField {
  /**
   * transitions[from][to] = Fix16 weight
   * 
   * All initialized to zero.
   */
  private transitions: Record<Regime, Record<Regime, Fix16>> = {
    Baseline: { Baseline: FIX_ZERO, Joy: FIX_ZERO, Ache: FIX_ZERO, Relief: FIX_ZERO, Grace: FIX_ZERO },
    Joy: { Baseline: FIX_ZERO, Joy: FIX_ZERO, Ache: FIX_ZERO, Relief: FIX_ZERO, Grace: FIX_ZERO },
    Ache: { Baseline: FIX_ZERO, Joy: FIX_ZERO, Ache: FIX_ZERO, Relief: FIX_ZERO, Grace: FIX_ZERO },
    Relief: { Baseline: FIX_ZERO, Joy: FIX_ZERO, Ache: FIX_ZERO, Relief: FIX_ZERO, Grace: FIX_ZERO },
    Grace: { Baseline: FIX_ZERO, Joy: FIX_ZERO, Ache: FIX_ZERO, Relief: FIX_ZERO, Grace: FIX_ZERO },
  };

  /**
   * The last regime the agent was in.
   * Used to record transitions.
   */
  private last: Regime = "Baseline";

  /**
   * update(current)
   * ----------------
   * Called every timestep by the RegimeEngine.
   * 
   * Steps:
   * 1. Increment transition weight last → current
   * 2. Decay all weights slightly
   * 3. Normalize each row so total ≤ 1
   * 4. Store current as last
   */
  update(current: Regime): void {
    const prev = this.last;

    // 1. Increment transition weight
    const w = this.transitions[prev][current];
    this.transitions[prev][current] = F.add(w, F.fromFloat(0.05));

    // 2. Decay all weights
    for (const from of Object.keys(this.transitions) as Regime[]) {
      for (const to of Object.keys(this.transitions[from]) as Regime[]) {
        this.transitions[from][to] = F.mul(
          this.transitions[from][to],
          F.fromFloat(0.995)
        );
      }
      // 3. Normalize row
      this.normalizeRow(from);
    }

    // 4. Update last
    this.last = current;
  }

  /**
   * normalizeRow(from)
   * -------------------
   * Ensures the sum of transition weights from a given regime
   * does not exceed 1.0.
   * 
   * This prevents runaway accumulation and keeps the memory stable.
   */
  private normalizeRow(from: Regime): void {
    const row = this.transitions[from];
    const total = Object.values(row).reduce(
      (acc, val) => acc + F.toFloat(val),
      0
    );

    if (total > 1) {
      const inv = F.fromFloat(1 / total);
      for (const r of Object.keys(row) as Regime[]) {
        row[r] = F.mul(row[r], inv);
      }
    }
  }

  /**
   * bias(from, to)
   * ---------------
   * Returns the transition weight from → to as a float.
   * 
   * The RegimeEngine uses this to bias regime selection.
   */
  bias(from: Regime, to: Regime): number {
    return F.toFloat(this.transitions[from][to]);
  }
}
