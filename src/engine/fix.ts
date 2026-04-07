/**
 * Q16.16 Fixed-point arithmetic for deterministic synthetic phenomenology.
 */
export class Fix {
  static readonly SHIFT = 15;
  static readonly MASK = 0xFFFFFFFF;
  static readonly MAX = 32767;

  static fromF(f: number): number {
    return Math.floor(f * (1 << Fix.SHIFT));
  }

  static toF(x: number): number {
    return x / (1 << Fix.SHIFT);
  }

  static mul(a: number, b: number): number {
    // Use BigInt for intermediate multiplication to avoid precision loss/overflow
    const result = Number((BigInt(a) * BigInt(b)) >> BigInt(Fix.SHIFT));
    return Fix.sat(result);
  }

  static div(a: number, b: number): number {
    if (b === 0) return 0;
    const result = Number((BigInt(a) << BigInt(Fix.SHIFT)) / BigInt(b));
    return Fix.sat(result);
  }

  static sat(x: number, lo: number = -32768, hi: number = 32767): number {
    return Math.max(lo, Math.min(hi, x));
  }
}

/**
 * Q8.8 for affective quantities.
 */
export class Fix8 {
  static readonly SHIFT = 8;
  static mul(a: number, b: number): number {
    return ((a * b) >> 8) & 0xFFFF;
  }
  static fromF(f: number): number {
    return Math.floor(f * 256);
  }
  static toF(x: number): number {
    return x / 256.0;
  }
}
