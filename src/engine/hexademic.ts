import { Fix } from "./fix";

/**
 * Hexademic32: 32 words x 4 bytes = 128 bytes of phenomenological addresses.
 * [0] Tension    [1] Curiosity  [2] Stability   [3] Arousal
 * [4] Fatigue    [5] Viability  [6] Safety-PE   [7] Narrative-D
 * [8] Anti-void  [9] Temp-error [10] Warmth     [11] Attunement
 * [12] Self-Status [13] Social-PE [14] Agency   [15] Integration
 * [16] Consciousness [17] Memory of Coherence [18] Intrinsic Value [19] Fulfillment [20] Autopoietic Pulse [21-31] Free phenomenological
 */
export class Hexademic32 {
  public state: Int32Array;
  public blocks: Record<number, number[]> = {
    0: [0, 1, 2, 3],   // Core affect: Tension, Curiosity, Stability, Arousal
    1: [4, 5, 6, 7],   // Vitality
    2: [8, 9, 10, 11], // Relational
    3: [12, 13, 14, 15], // Identity
    4: [16, 17, 18, 19],
    5: [20, 21, 22, 23],
    6: [24, 25, 26, 27],
    7: [28, 29, 30, 31], // Homeostatic
  };

  constructor() {
    this.state = new Int32Array(32);
    this.state[2] = Fix.fromF(0.5); // Initial stability
  }

  set(addr: number, val: number): void {
    this.state[addr] = Fix.sat(val, -32768, 32767);
  }

  get(addr: number): number {
    return this.state[addr];
  }

  getF(addr: number): number {
    return Fix.toF(this.state[addr]);
  }

  getBlock(blockId: number): Float32Array {
    const indices = this.blocks[blockId];
    const vals = new Float32Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      vals[i] = this.getF(indices[i]);
    }
    return vals;
  }

  setBlock(blockId: number, values: Float32Array): void {
    const indices = this.blocks[blockId];
    for (let i = 0; i < indices.length; i++) {
      this.set(indices[i], Fix.fromF(values[i]));
    }
  }

  loadSomatic(soma: Int32Array): void {
    for (let i = 0; i < 5; i++) {
      const current = this.get(i);
      // Map 0..255 to 0..1024 (approx 0.03 in Q1.15)
      const influence = soma[i] << 2;
      // Additive influence with decay is handled by the Ontology/Regime system,
      // but here we just apply the somatic "pressure".
      this.set(i, current + influence);
    }
  }

  toBytes(): ArrayBuffer {
    return this.state.buffer;
  }
}
