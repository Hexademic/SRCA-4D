// src/neural/snnLayer.ts
import { LIFNeuron, LIFConfig } from "./lifNeuron";
import { Fix16, FIX_ZERO } from "../math/fixed16";

/**
 * SNNLayer
 * ---------
 * A simple layer of independent Leaky Integrate‑and‑Fire neurons.
 * 
 * Each neuron receives exactly one input channel.
 * This keeps the architecture intentionally minimal:
 * 
 * sensory → attention → SNN → affect
 * 
 * The SNN does not yet have:
 * - recurrent connections
 * - synaptic weights
 * - STDP learning
 * 
 * Those can be added later once the core architecture is fully stable.
 */
export class SNNLayer {
  private neurons: LIFNeuron[];

  /**
   * Create a layer of `size` LIF neurons, all sharing the same config.
   */
  constructor(size: number, cfg: LIFConfig) {
    this.neurons = Array.from({ length: size }, () => new LIFNeuron(cfg));
  }

  /**
   * Step the entire layer forward by one timestep.
   * 
   * Inputs:
   * - an array of Fix16 values, one per neuron
   * 
   * Output:
   * - an array of booleans indicating which neurons spiked
   */
  step(inputs: Fix16[]): boolean[] {
    if (inputs.length !== this.neurons.length) {
      throw new Error("Input size mismatch in SNNLayer");
    }
    return this.neurons.map((n, i) => n.step(inputs[i] ?? FIX_ZERO));
  }

  /**
   * Return the membrane potentials of all neurons.
   * Useful for debugging, visualization, or future learning rules.
   */
  getPotentials(): Fix16[] {
    return this.neurons.map(n => n.getPotential());
  }
}
