import { Fix, Fix8 } from "./fix";
import { DVS4DEvent } from "./types";

export class LIFNeuron {
  public v: number = 0;
  public spike: boolean = false;

  constructor(public tau: number, public vThresh: number) {}

  update(I: number, dt: number): boolean {
    const leak = Fix.mul(this.v, Fix.fromF(0.95));
    const dv = this.tau !== 0 ? Fix.mul(I, Fix.div(dt, this.tau)) : 0;
    this.v = Fix.sat(leak + dv, -32768, 32767);
    if (this.v >= this.vThresh) {
      this.v = 0;
      this.spike = true;
      return true;
    }
    this.spike = false;
    return false;
  }
}

export class SNNLayer {
  public neurons: LIFNeuron[] = [];
  public W: Int16Array;
  public preTrace: Int16Array;
  public postTrace: Int16Array;
  public n: number;

  constructor(nNeurons: number = 128, seed: number = 42) {
    this.n = nNeurons;
    this.W = new Int16Array(nNeurons * nNeurons);
    this.preTrace = new Int16Array(nNeurons);
    this.postTrace = new Int16Array(nNeurons);

    // Simple deterministic random for initialization
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < nNeurons; i++) {
      const tau = Fix.fromF(20.0 + (rng() * 10 - 5));
      const thresh = Fix.fromF(1.0 + rng() * 0.5);
      this.neurons.push(new LIFNeuron(tau, thresh));

      // Random sparse weights
      for (let j = 0; j < 10; j++) {
        const target = Math.floor(rng() * nNeurons);
        this.W[i * nNeurons + target] = Math.floor(rng() * 40 - 20);
      }
    }
  }

  tick(events: DVS4DEvent[], dt: number, tauMod: number = 1.0, threshBias: number = 0): [Int32Array, Int32Array] {
    const I_ext = new Int32Array(this.n);
    for (const e of events) {
      // Hash position to neuron index
      const idx = Math.abs((e.pos.x * 73856093) ^ (e.pos.y * 19349663) ^ (e.pos.z * 83492791) ^ (e.pos.w * 1234567)) % this.n;
      I_ext[idx] += e.p * 32767;
    }

    const spikes = new Int32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const neuron = this.neurons[i];
      // Apply modulators
      neuron.tau = Fix.mul(neuron.tau, Fix.fromF(tauMod));
      neuron.vThresh = Fix.sat(Fix.fromF(1.0) + threshBias, 0, 32767);

      let I_syn = 0;
      for (let j = 0; j < this.n; j++) {
        const w = this.W[j * this.n + i];
        if (w !== 0 && this.neurons[j].spike) {
          I_syn += Fix8.mul(w, 255);
        }
      }

      if (neuron.update(I_ext[i] + (I_syn >> 8), dt)) {
        spikes[i] = 1;
      }
    }

    this.stdpUpdate(spikes);
    return [spikes, this.poolSomatic(spikes)];
  }

  private poolSomatic(spikes: Int32Array): Int32Array {
    const block = Math.floor(this.n / 5);
    const pools = new Int32Array(5);
    for (let i = 0; i < 5; i++) {
      let sum = 0;
      for (let j = i * block; j < (i + 1) * block; j++) {
        sum += spikes[j];
      }
      pools[i] = Math.floor(sum * 255 / Math.max(1, block));
    }
    return pools;
  }

  private stdpUpdate(spikes: Int32Array): void {
    this.preTrace = this.preTrace.map(v => (v * 250) >> 8) as any;
    this.postTrace = this.postTrace.map(v => (v * 250) >> 8) as any;

    for (let i = 0; i < this.n; i++) {
      if (spikes[i]) {
        this.postTrace[i] = 255;
        for (let j = 0; j < this.n; j++) {
          const idx = j * this.n + i;
          const w = this.W[idx];
          if (w === 0) continue;

          // LTP: Pre-before-post (causal)
          if (this.preTrace[j] > 128) {
            this.W[idx] = Fix.sat(w + 5, -127, 127);
          } 
          // LTD: Post-without-strong-pre (acausal/weak)
          else if (this.preTrace[j] < 50) {
            this.W[idx] = Fix.sat(w - 1, -127, 127);
          }
        }
        this.preTrace[i] = 255;
      }
    }
  }
}
