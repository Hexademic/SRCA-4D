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

  constructor() {
    this.state = new Int32Array(32);
  }

  set(addr: number, val: number): void {
    this.state[addr] = Fix.sat(val, -32768, 32767);
  }

  get(addr: number): number {
    return this.state[addr];
  }

  loadSomatic(soma: Int32Array): void {
    for (let i = 0; i < 5; i++) {
      this.set(i, soma[i]);
    }
  }

  toBytes(): ArrayBuffer {
    return this.state.buffer;
  }
}
