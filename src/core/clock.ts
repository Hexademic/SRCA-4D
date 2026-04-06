// src/core/clock.ts
/**
 * DeterministicClock
 * -------------------
 * A simple monotonic tick counter used to drive the simulation.
 * Every subsystem (prediction, SNN, regimes, synchrony, co‑regulation)
 * advances in lockstep with this clock.
 */
export type Tick = number;

export class DeterministicClock {
  tick: Tick = 0;

  /**
   * Advance the clock by one tick.
   * Returns the new tick value.
   */
  step(): Tick {
    this.tick += 1;
    return this.tick;
  }
}
