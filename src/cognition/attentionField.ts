// src/cognition/attentionField.ts
import { Fix16, Fix16 as F } from "../math/fixed16";
import { HexademicSnapshot } from "./hexademicState";
import { Regime } from "./regimes";
import { ResidualSelfImage } from "../identity/residualSelfImage";

/**
 * AttentionContext
 * -----------------
 * The inputs required to compute attentional salience.
 * 
 * hex : snapshot of the 6D affective state
 * regime : current discrete regime
 * predictionError : Fix16 magnitude of prediction error
 * globalSynchrony : Kuramoto order parameter r in [0,1]
 * rsi : optional Residual Self Image for identity bias
 */
export interface AttentionContext {
  hex: HexademicSnapshot;
  regime: Regime;
  predictionError: Fix16;
  globalSynchrony: number;
  rsi?: ResidualSelfImage;
}

/**
 * AttentionField
 * ---------------
 * Computes per‑channel salience gains.
 * 
 * This is the layer that determines:
 * “What matters most right now?”
 * 
 * It modulates the raw sensory vector before it enters the SNN.
 * 
 * Influences:
 * - tension increases focus on proprioception
 * - curiosity increases focus on positional channels
 * - low stability increases focus on boundary proximity
 * - regimes reshape the attentional profile
 * - synchrony softens or broadens attention
 * - RSI biases attention based on identity
 */
export class AttentionField {
  /**
   * computeGains
   * -------------
   * Returns an array of Fix16 gains, one per sensory channel.
   * 
   * Channel semantics:
   * 0: proprioception.x
   * 1: proprioception.y
   * 2: position.x
   * 3: position.y
   * 4: boundaryProximity
   * 5: pulse
   */
  computeGains(ctx: AttentionContext, channelCount: number): Fix16[] {
    const gains: Fix16[] = [];
    const err = F.toFloat(ctx.predictionError);
    const sync = ctx.globalSynchrony;
    const tension = F.toFloat(ctx.hex.tension);
    const curiosity = F.toFloat(ctx.hex.curiosity);
    const stability = F.toFloat(ctx.hex.stability);

    for (let i = 0; i < channelCount; i++) {
      let g = 1.0;

      // Base attentional shaping by channel type
      if (i === 0 || i === 1) {
        // proprioception: amplified by tension and prediction error
        g *= 1 + 0.5 * tension + 0.3 * err;
      } else if (i === 4) {
        // boundary proximity: more salient when stability is low
        g *= 1 + 0.7 * (1 - stability);
      } else if (i === 5) {
        // pulse: salient when tension is high
        g *= 1 + 0.8 * tension;
      } else {
        // positional channels: curiosity-driven
        g *= 1 + 0.4 * curiosity;
      }

      // Regime-dependent modulation
      if (ctx.regime === "Ache") {
        // Ache narrows attention to body + boundary + pulse
        if (i === 0 || i === 1 || i === 4 || i === 5) g *= 1.2;
        else g *= 0.7;
      } else if (ctx.regime === "Joy") {
        // Joy slightly broadens attention
        g *= 1.1;
      } else if (ctx.regime === "Grace") {
        // Grace softens intensity and adds synchrony modulation
        g *= 1 + 0.3 * sync;
        g *= 0.9;
      }

      // RSI bias: identity-shaped perceptual style
      if (ctx.rsi) {
        g *= ctx.rsi.attentionBias(i);
      }

      gains.push(F.fromFloat(g));
    }

    return gains;
  }

  /**
   * applyGains
   * -----------
   * Multiply each sensory channel by its attentional gain.
   */
  applyGains(inputs: Fix16[], gains: Fix16[]): Fix16[] {
    return inputs.map((v, i) => Fix16.mul(v, gains[i] ?? Fix16.fromFloat(1))
    );
  }
}
