// src/prediction/predictionEngine.ts
import { Fix16, Fix16 as F, FIX_ZERO } from "../math/fixed16";

/**
 * PredictionEngine
 * -----------------
 * A minimal temporal predictor.
 * 
 * This is a deliberately simple model:
 * next ≈ previous
 * 
 * It provides:
 * - predicted sensory vector
 * - prediction error vector
 * - weighted error magnitude
 * 
 * Higher layers (HexademicState, RegimeEngine, AttentionField)
 * use this error signal to drive affect, curiosity, stability,
 * and attentional modulation.
 * 
 * This is the "surprise" generator in the architecture.
 */
export class PredictionEngine {
  private lastInputs: Fix16[] = [];

  /**
   * Predict the next sensory vector.
   * Currently: identity predictor (copy of last inputs).
   */
  predictNext(): Fix16[] {
    return [...this.lastInputs];
  }

  /**
   * Update the predictor with the actual sensory input
   * and compute the prediction error vector.
   */
  updateAndError(actual: Fix16[]): Fix16[] {
    const predicted = this.predictNext();
    const errors: Fix16[] = [];

    for (let i = 0; i < actual.length; i++) {
      const a = actual[i] ?? FIX_ZERO;
      const p = predicted[i] ?? FIX_ZERO;
      errors.push(F.sub(a, p));
    }

    this.lastInputs = [...actual];
    return errors;
  }

  /**
   * Compute a weighted L1 magnitude of the prediction error.
   * 
   * Channel weights:
   * 0 (proprio.x): 1.0
   * 1 (proprio.y): 1.0
   * 2 (pos.x): 0.5
   * 3 (pos.y): 0.5
   * 4 (boundary): 0.3
   * 5 (pulse): 0.8
   * 
   * These weights reflect the relative importance of each channel
   * for affective dynamics.
   */
  errorMagnitude(errors: Fix16[]): Fix16 {
    const weights = [1.0, 1.0, 0.5, 0.5, 0.3, 0.8];
    let acc = FIX_ZERO;

    for (let i = 0; i < errors.length; i++) {
      const e = errors[i];
      const abs = F.toFloat(e) < 0 ? F.neg(e) : e;
      const w = F.fromFloat(weights[i] ?? 1);
      acc = F.add(acc, F.mul(abs, w));
    }

    return acc;
  }
}
