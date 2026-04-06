// src/world/gaussian4d.ts
import { Vec4 } from "../math/vec4";
import { Fix16, Fix16 as F, FIX_ONE } from "../math/fixed16";

export interface Gaussian4DConfig {
  radius: Vec4;
}

/**
 * Gaussian4DWorld
 * ----------------
 * A bounded 4D manifold with soft Gaussian-like edges.
 * 
 * Agents exist inside this manifold. Any movement that would push a joint
 * outside the allowed radius is smoothly projected back inward.
 * 
 * This gives you:
 * - a continuous, differentiable boundary
 * - a natural "center" and "edge" gradient
 * - a stable substrate for embodied agents
 */
export class Gaussian4DWorld {
  private cfg: Gaussian4DConfig;

  constructor(cfg: Gaussian4DConfig) {
    this.cfg = cfg;
  }

  /**
   * Project a 4D point back into the manifold if it exceeds the radius.
   * The radius is anisotropic: each axis can have its own scale.
   */
  projectToManifold(p: Vec4): Vec4 {
    const rx = this.cfg.radius.x || FIX_ONE;
    const ry = this.cfg.radius.y || FIX_ONE;
    const rz = this.cfg.radius.z || FIX_ONE;
    const rw = this.cfg.radius.w || FIX_ONE;

    // Normalize coordinates by radius
    const nx = F.div(p.x, rx);
    const ny = F.div(p.y, ry);
    const nz = F.div(p.z, rz);
    const nw = F.div(p.w, rw);

    // Compute squared length in normalized space
    const len2 = F.toFloat(F.mul(nx, nx)) + F.toFloat(F.mul(ny, ny)) + F.toFloat(F.mul(nz, nz)) + F.toFloat(F.mul(nw, nw));

    // If inside the manifold, return unchanged
    if (len2 <= 1.0) return p;

    // Otherwise, scale back to the boundary
    const scale = 1 / Math.sqrt(len2);
    const s = F.fromFloat(scale);
    return {
      x: F.mul(p.x, s),
      y: F.mul(p.y, s),
      z: F.mul(p.z, s),
      w: F.mul(p.w, s),
    };
  }

  /**
   * Compute a boundary proximity measure:
   * - 1.0 at the center
   * - 0.0 at the boundary
   * - 0.0 beyond the boundary (after projection)
   * 
   * This is used by the sensory manifold to give the agent a sense of
   * "how close am I to the edge of the world?"
   */
  boundaryProximity(p: Vec4): Fix16 {
    const rx = this.cfg.radius.x || FIX_ONE;
    const ry = this.cfg.radius.y || FIX_ONE;
    const rz = this.cfg.radius.z || FIX_ONE;
    const rw = this.cfg.radius.w || FIX_ONE;

    const nx = F.div(p.x, rx);
    const ny = F.div(p.y, ry);
    const nz = F.div(p.z, rz);
    const nw = F.div(p.w, rw);

    const len = Math.sqrt(
      F.toFloat(F.mul(nx, nx)) + F.toFloat(F.mul(ny, ny)) + F.toFloat(F.mul(nz, nz)) + F.toFloat(F.mul(nw, nw))
    ) || 0;

    const prox = Math.max(0, Math.min(1, 1 - len));
    return F.fromFloat(prox);
  }
}
