// src/math/vec4.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "./fixed16";

export interface Vec4 {
  x: Fix16;
  y: Fix16;
  z: Fix16;
  w: Fix16;
}

export const Vec4 = {
  /**
   * Zero vector in 4D fixed-point space.
   */
  zero(): Vec4 {
    return { x: FIX_ZERO, y: FIX_ZERO, z: FIX_ZERO, w: FIX_ZERO };
  },

  /**
   * Construct a Vec4 from JavaScript floats.
   */
  fromFloats(x: number, y: number, z: number, w: number): Vec4 {
    return {
      x: F.fromFloat(x),
      y: F.fromFloat(y),
      z: F.fromFloat(z),
      w: F.fromFloat(w),
    };
  },
};
