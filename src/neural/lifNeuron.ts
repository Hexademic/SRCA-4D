// src/neural/lifNeuron.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * LIFConfig
 * ----------
 * Configuration parameters for a Leaky Integrate‑and‑Fire neuron.
 * 
 * tauMem : membrane time constant
 * vThresh : firing threshold
 * vReset : reset potential after spike
 * vLeak : leak factor applied each timestep
 */
export interface LIFConfig {
  tauMem: Fix16;
  vThresh: Fix16;
  vReset: Fix16;
  vLeak: Fix16;
}

/**
 * LIFNeuron
 * ----------
 * A single leaky integrate‑and‑fire neuron.
 * 
 * This is the simplest biologically‑inspired spiking model:
 * 
 * v(t+1) = v(t) * vLeak + input / tauMem
 * 
 * If v(t+1) >= vThresh:
 * - neuron emits a spike (true)
 * - membrane potential resets to vReset
 * 
 * Otherwise:
 * - no spike (false)
 * 
 * This neuron is used inside SNNLayer to form the agent’s
 * minimal spiking neural network.
 */
export class LIFNeuron {
  private v: Fix16 = FIX_ZERO;
  private cfg: LIFConfig;

  constructor(cfg: LIFConfig) {
    this.cfg = cfg;
  }

  /**
   * Step the neuron forward by one timestep.
   * Returns true if the neuron spikes.
   */
  step(input: Fix16): boolean {
    // Leak term: v * vLeak
    const leakTerm = F.mul(this.v, this.cfg.vLeak);

    // Input term: input / tauMem
    const inputTerm = F.div(input, this.cfg.tauMem);

    // Update membrane potential
    this.v = F.add(leakTerm, inputTerm);

    // Check threshold
    if (this.v >= this.cfg.vThresh) {
      this.v = this.cfg.vReset;
      return true;
    }

    return false;
  }

  /**
   * Get the current membrane potential.
   */
  getPotential(): Fix16 {
    return this.v;
  }
}
