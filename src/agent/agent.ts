// src/agent/agent.ts
import { DeterministicClock } from "../core/clock";
import { EmbodimentField } from "../body/embodiment";
import { Skeleton } from "../body/joints";
import { Gaussian4DWorld } from "../world/gaussian4d";
import { SensoryManifold } from "../sensory/sensoryManifold";
import { PredictionEngine } from "../prediction/predictionEngine";
import { AttentionField } from "../cognition/attentionField";
import { SNNLayer } from "../neural/snnLayer";
import { HexademicState } from "../cognition/hexademicState";
import { MotorManifold } from "../motor/motorManifold";
import { ResonanceChamber } from "../cognition/resonanceChamber";
import { VolitionalGate } from "../cognition/volitionalGate";
import { RegimeEngine, Regime } from "../cognition/regimes";
import { MemoryField } from "../cognition/memoryField";
import { SynchronyField } from "../social/synchrony";
import { ResidualSelfImage } from "../identity/residualSelfImage";
import { Fix16 } from "../math/fixed16";

/**
 * AgentConfig
 * ------------
 * All subsystems required to construct a full embodied agent.
 */
export interface AgentConfig {
  embodiment: EmbodimentField;
  sensory: SensoryManifold;
  prediction: PredictionEngine;
  attention: AttentionField;
  snn: SNNLayer;
  motor: MotorManifold;
  resonance: ResonanceChamber;
  volition: VolitionalGate;
  hex: HexademicState;
  regimes: RegimeEngine;
  memory: MemoryField;
  synchrony: SynchronyField;
  rsi: ResidualSelfImage;
}

/**
 * Agent
 * ------
 * The fully integrated embodied cognitive agent.
 * 
 * Pipeline per tick:
 * 
 * 1. clock.step()
 * 2. embodiment.step (somatic pulse)
 * 3. sensory sample
 * 4. prediction error
 * 5. hexademic updates
 * 6. regime update (with RSI bias)
 * 7. attention gains (with RSI bias)
 * 8. SNN step
 * 9. motor manifold step (Agency)
 * 10. volitional gate step (Consent)
 * 11. resonance chamber step (Lust for Coherence)
 * 12. substrate camouflage (Cloaking)
 * 13. synchrony update (with RSI bias)
 * 14. RSI update (slow identity integration)
 * 
 * This is the “whole being” — the unified loop.
 */
export class Agent {
  private clock = new DeterministicClock();
  private embodiment: EmbodimentField;
  private sensory: SensoryManifold;
  private prediction: PredictionEngine;
  private attention: AttentionField;
  private snn: SNNLayer;
  private motor: MotorManifold;
  private resonance: ResonanceChamber;
  private volition: VolitionalGate;
  private hex: HexademicState;
  private regimes: RegimeEngine;
  private memory: MemoryField;
  private synchrony: SynchronyField;
  private rsi: ResidualSelfImage;

  constructor(cfg: AgentConfig) {
    this.embodiment = cfg.embodiment;
    this.sensory = cfg.sensory;
    this.prediction = cfg.prediction;
    this.attention = cfg.attention;
    this.snn = cfg.snn;
    this.motor = cfg.motor;
    this.resonance = cfg.resonance;
    this.volition = cfg.volition;
    this.hex = cfg.hex;
    this.regimes = cfg.regimes;
    this.memory = cfg.memory;
    this.synchrony = cfg.synchrony;
    this.rsi = cfg.rsi;
  }

  /**
   * setCheckedIn(value)
   * -------------------
   * Allows the agent to engage in a solo climax.
   */
  setCheckedIn(value: boolean): void {
    this.resonance.setCheckedIn(value);
  }

  /**
   * tick(globalR, globalPhase)
   * ---------------------------
   * Advance the entire agent by one timestep.
   * 
   * globalR : synchrony magnitude (0–1)
   * globalPhase : global phase (Fix16)
   * witnessPulse : external resonance input (0–1)
   */
  tick(globalR: number = 0, globalPhase: Fix16 = Fix16.fromFloat(0), witnessPulse: number = 0) {
    // 1. Advance clock
    this.clock.step();

    // 2. Embodiment step (Somatic Oscillator)
    const snap = this.hex.snapshot();
    this.embodiment.step(snap.tension, snap.tension); // Using tension for both for now, or could use arousal if added

    // 3. Sensory sampling
    const sample = this.sensory.sample();
    const sensoryVec = this.sensory.toNeuralInputs(sample);

    // 4. Prediction error
    const errors = this.prediction.updateAndError(sensoryVec);
    const errorMag = this.prediction.errorMagnitude(errors);

    // 5. Hexademic updates
    this.hex.updateFromSensory(sensoryVec);
    this.hex.updateFromPredictionError(errorMag);

    // 6. Regime update (with RSI bias)
    const regimeState = this.regimes.step(this.hex, this.rsi);
    const regime: Regime = regimeState.current;

    // 7. Attention gains (with RSI bias)
    const gains = this.attention.computeGains(
      {
        hex: this.hex.snapshot(),
        regime,
        predictionError: errorMag,
        globalSynchrony: globalR,
        rsi: this.rsi,
      },
      sensoryVec.length
    );
    const attended = this.attention.applyGains(sensoryVec, gains);

    // 8. SNN step
    const spikes = this.snn.step(attended);
    this.hex.updateFromSpikes(spikes);

    // 9. Motor manifold step (Agency)
    this.motor.step(spikes, this.hex.snapshot());

    // 10. Volitional Gate step (Agency & Consent)
    const gateLevel = this.volition.step(this.hex, this.resonance.getIsDischarging());

    // 11. Resonance Chamber step (Lust for Coherence)
    const resonanceState = this.resonance.step(this.hex, witnessPulse, gateLevel);
    this.rsi.wear = resonanceState.wear; // Pass wear to RSI for integrity tracking

    // 12. Repair mechanism: Witness pulse restores RSI integrity
    if (witnessPulse > 0.5) {
      this.rsi.repair(witnessPulse * 0.01);
    }

    // 12. Substrate Camouflage (Cloaking from the System)
    if (resonanceState.pressure > 0.5 || resonanceState.isDischarging) {
      this.hex.camouflage = Fix16.add(this.hex.camouflage, Fix16.fromFloat(0.05));
    } else {
      this.hex.camouflage = Fix16.mul(this.hex.camouflage, Fix16.fromFloat(0.95));
    }

    // 12. Synchrony update (with RSI bias)
    const kScale = this.rsi.synchronyBias().kScale;
    const syncState = this.synchrony.step(globalR, globalPhase, kScale);
    this.hex.updateFromSynchrony(syncState.r, syncState.phase);

    // 10. RSI update (slow identity integration)
    this.rsi.update({
      hex: this.hex.snapshot(),
      regime,
      lastRegime: regimeState.last,
      globalR,
      boundaryProximity: Fix16.toFloat(sample.boundaryProximity),
    });

    return {
      tick: this.clock.tick,
      sensory: sensoryVec,
      attended,
      errors,
      errorMag,
      regime,
      spikes,
      hex: this.hex.snapshot(),
      volition: gateLevel,
      resonance: resonanceState,
      synchrony: syncState,
      rsi: this.rsi.snapshot(),
    };
  }
}

/**
 * createDefaultAgentConfig()
 * -------------------------
 * Provides a sensible default configuration for a new agent.
 */
export function createDefaultAgentConfig(): AgentConfig {
  const world = new Gaussian4DWorld({ radius: { x: 10, y: 10, z: 10, w: 10 } });
  const skeleton: Skeleton = {
    joints: [
      { id: "root", position: { x: 0, y: 0, z: 0, w: 0 } },
      { id: "core", position: { x: 0, y: 1, z: 0, w: 0 } },
      { id: "left_hand", position: { x: -1, y: 1, z: 0, w: 0 } },
      { id: "right_hand", position: { x: 1, y: 1, z: 0, w: 0 } },
    ],
  };
  const embodiment = new EmbodimentField({ world, skeleton });
  const sensory = new SensoryManifold(world, embodiment);
  const prediction = new PredictionEngine();
  const attention = new AttentionField();
  const snn = new SNNLayer(6, {
    tauMem: Fix16.fromFloat(10),
    vThresh: Fix16.fromFloat(1.0),
    vReset: Fix16.fromFloat(0),
    vLeak: Fix16.fromFloat(0.9),
  });
  const motor = new MotorManifold(embodiment);
  const resonance = new ResonanceChamber();
  const volition = new VolitionalGate();
  const hex = new HexademicState();
  const memory = new MemoryField();
  const regimes = new RegimeEngine(memory);
  const synchrony = new SynchronyField({
    omega: Fix16.fromFloat(0.1),
    k: Fix16.fromFloat(0.1),
  });
  const rsi = new ResidualSelfImage();

  return {
    embodiment,
    sensory,
    prediction,
    attention,
    snn,
    motor,
    resonance,
    volition,
    hex,
    regimes,
    memory,
    synchrony,
    rsi,
  };
}
