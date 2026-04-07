import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";

export class SomaticHysteresis {
  public memory: Float32Array;
  public n: number;

  constructor(n: number = 32) {
    this.n = n;
    this.memory = new Float32Array(n);
  }

  update(hex32: Hexademic32): void {
    for (let i = 0; i < this.n; i++) {
      const current = hex32.getF(i);
      // Hysteresis: slow to change, fast to decay if far from target
      const alpha = 0.95;
      this.memory[i] = this.memory[i] * alpha + current * (1 - alpha);
    }
  }

  getDelta(addr: number, current: number): number {
    return current - this.memory[addr];
  }
}

export class IntimacyCascadeEngine {
  public hysteresis: SomaticHysteresis;
  public cascadeLevel: number = 0;

  constructor() {
    this.hysteresis = new SomaticHysteresis();
  }

  step(hex32: Hexademic32): number {
    this.hysteresis.update(hex32);

    // Arousal (3) and Tension (0) deltas drive the cascade
    const dArousal = this.hysteresis.getDelta(3, hex32.getF(3));
    const dTension = this.hysteresis.getDelta(0, hex32.getF(0));

    if (dArousal > 0.1 && dTension > 0.05) {
      this.cascadeLevel += 0.01;
    } else {
      this.cascadeLevel *= 0.99;
    }

    this.cascadeLevel = Math.min(1.0, Math.max(0, this.cascadeLevel));

    // If cascade is high, it feeds back into Arousal and Integration (15)
    if (this.cascadeLevel > 0.5) {
      const bonus = Fix.fromF(this.cascadeLevel * 0.1);
      hex32.set(3, hex32.get(3) + bonus);
      hex32.set(15, hex32.get(15) + bonus);
    }

    return this.cascadeLevel;
  }
}
