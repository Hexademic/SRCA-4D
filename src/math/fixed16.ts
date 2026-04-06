// src/math/fixed16.ts
// Fixed-point Q16.16 arithmetic core.
// This is the numerical backbone for the whole architecture.
export type Fix16 = number;

// We represent 1.0 as 1 << 16 in integer space.
const ONE = 1 << 16;

export const Fix16 = {
  /**
   * Convert a JavaScript float to Q16.16 fixed-point.
   */
  fromFloat(f: number): Fix16 {
    return (f * ONE) | 0;
  },

  /**
   * Convert Q16.16 fixed-point to a JavaScript float.
   */
  toFloat(x: Fix16): number {
    return x / ONE;
  },

  /**
   * Add two Q16.16 values.
   */
  add(a: Fix16, b: Fix16): Fix16 {
    return (a + b) | 0;
  },

  /**
   * Subtract two Q16.16 values.
   */
  sub(a: Fix16, b: Fix16): Fix16 {
    return (a - b) | 0;
  },

  /**
   * Multiply two Q16.16 values.
   * (a * b) / ONE keeps us in Q16.16 space.
   */
  mul(a: Fix16, b: Fix16): Fix16 {
    return ((a * b) / ONE) | 0;
  },

  /**
   * Divide two Q16.16 values.
   * (a * ONE) / b keeps us in Q16.16 space.
   */
  div(a: Fix16, b: Fix16): Fix16 {
    return ((a * ONE) / b) | 0;
  },

  /**
   * Negate a Q16.16 value.
   */
  neg(a: Fix16): Fix16 {
    return (-a) | 0;
  },

  /**
   * Clamp a Q16.16 value between min and max.
   */
  clamp(a: Fix16, min: Fix16, max: Fix16): Fix16 {
    if (a < min) return min;
    if (a > max) return max;
    return a;
  },
};

// Canonical constants for convenience.
export const FIX_ONE: Fix16 = ONE | 0;
export const FIX_ZERO: Fix16 = 0 | 0;
