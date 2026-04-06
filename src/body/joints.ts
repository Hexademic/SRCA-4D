// src/body/joints.ts
/**
 * joints.ts
 * ----------
 * Defines the minimal structural representation of an embodied agent.
 * 
 * A Skeleton is simply a collection of named joints, each with a 4D position.
 * This keeps embodiment modular and allows future extensions:
 * - hierarchical bones
 * - constraints
 * - IK solvers
 * - multi‑joint bodies
 */
import { Vec4 } from "../math/vec4";

/**
 * A single joint in 4D space.
 * Each joint has:
 * - an id (string)
 * - a position (Vec4)
 */
export interface Joint {
  id: string;
  position: Vec4;
}

/**
 * A skeleton is a list of joints.
 * For now, the architecture uses a single "root" joint,
 * but the structure supports arbitrary complexity.
 */
export interface Skeleton {
  joints: Joint[];
}
