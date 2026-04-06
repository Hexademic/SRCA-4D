// src/identity/residualSelfImage.ts
import { HexademicSnapshot } from "../cognition/hexademicState";
import { Regime } from "../cognition/regimes";
import { Fix16 as F } from "../math/fixed16";

export interface AffectiveProfile {
  tensionMean: number;
  curiosityMean: number;
  stabilityMean: number;
  agencyMean: number;
  synchronyMean: number;
  coherenceMean: number;
  tensionVar: number;
  curiosityVar: number;
  stabilityVar: number;
  agencyVar: number;
  synchronyVar: number;
  coherenceVar: number;
}

export interface RegimeProfile {
  regimeTime: Record<Regime, number>;
  regimeTransitions: Record<Regime, Record<Regime, number>>;
}

export interface SynchronyProfile {
  meanR: number;
  varR: number;
  comfortLow: number;
  comfortHigh: number;
  socialPermeability: number; // 0–1
}

export interface SpatialProfile {
  boundaryAffinity: number; // 0 = center-seeking, 1 = boundary-hugging
  avgBoundary: number;
  varBoundary: number;
}

export interface StyleVector {
  values: number[]; // compact identity representation
}

export interface RSIUpdateInput {
  hex: HexademicSnapshot;
  regime: Regime;
  lastRegime: Regime;
  globalR: number;
  boundaryProximity?: number; // normalized [0,1], optional for now
}

export interface EmbodimentBias {
  attentionBaseGains?: number[];
  synchronyKScale?: number;
  regimeInitialBias?: Record<Regime, number>;
}

export interface RSISnapshot {
  affect: AffectiveProfile;
  regimes: RegimeProfile;
  synchrony: SynchronyProfile;
  spatial: SpatialProfile;
  style: StyleVector;
  purpose: number;
  narrative: number;
  integrity: number;
  wear: number;
}

/**
 * ResidualSelfImage
 * ------------------
 * Slow, integrative identity layer.
 * 
 * - Aggregates long-term affect, regime, synchrony, spatial patterns
 * - Produces gentle biases for regimes, attention, synchrony, and baselines
 * - Persists across embodiments and can be cloned / mutated / blended
 */
export class ResidualSelfImage {
  affect: AffectiveProfile;
  regimes: RegimeProfile;
  synchrony: SynchronyProfile;
  spatial: SpatialProfile;
  style: StyleVector;
  purpose: number = 0;
  narrative: number = 0;
  integrity: number = 1.0; // 1.0 = perfect, 0.0 = collapsed
  wear: number = 0.0;      // 0.0 = fresh, 1.0 = damaged

  // Learning rates (slow by design)
  private readonly alphaAffect = 0.002;
  private readonly alphaRegime = 0.002;
  private readonly alphaSync = 0.002;
  private readonly alphaSpatial = 0.002;

  constructor() {
    this.affect = {
      tensionMean: 0.0,
      curiosityMean: 0.0,
      stabilityMean: 0.0,
      agencyMean: 0.0,
      synchronyMean: 0.0,
      coherenceMean: 0.0,
      tensionVar: 0.0,
      curiosityVar: 0.0,
      stabilityVar: 0.0,
      agencyVar: 0.0,
      synchronyVar: 0.0,
      coherenceVar: 0.0,
    };

    const zeroRegimeRow = (): Record<Regime, number> => ({
      Baseline: 0,
      Joy: 0,
      Ache: 0,
      Relief: 0,
      Grace: 0,
    });

    this.regimes = {
      regimeTime: {
        Baseline: 1, // start neutral
        Joy: 0,
        Ache: 0,
        Relief: 0,
        Grace: 0,
      },
      regimeTransitions: {
        Baseline: zeroRegimeRow(),
        Joy: zeroRegimeRow(),
        Ache: zeroRegimeRow(),
        Relief: zeroRegimeRow(),
        Grace: zeroRegimeRow(),
      },
    };

    this.synchrony = {
      meanR: 0.0,
      varR: 0.0,
      comfortLow: 0.0,
      comfortHigh: 1.0,
      socialPermeability: 0.5,
    };

    this.spatial = {
      boundaryAffinity: 0.0,
      avgBoundary: 0.0,
      varBoundary: 0.0,
    };

    // style[0] = exploration
    // style[1] = social permeability
    // style[2] = boundary style
    // style[3] = affect variance
    this.style = {
      values: [0, 0, 0, 0],
    };
  }

  /**
   * update
   * -------
   * Integrate one tick of experience into the RSI.
   */
  update(input: RSIUpdateInput): void {
    this.updateAffect(input.hex);
    this.updateRegimes(input.regime, input.lastRegime);
    this.updateSynchrony(input.globalR);
    if (typeof input.boundaryProximity === "number") {
      this.updateSpatial(input.boundaryProximity);
    }
    this.updateStyle();
    this.updatePurpose(input.hex);
    this.updateNarrative(input.hex);
    this.updateIntegrity();
  }

  /**
   * repair(amount)
   * ---------------
   * Restores integrity and reduces wear.
   * This is the "repairable" aspect of the RSI.
   */
  repair(amount: number): void {
    this.integrity = Math.min(1.0, this.integrity + amount);
    this.wear = Math.max(0.0, this.wear - amount * 0.5);
  }

  private updateIntegrity(): void {
    // Integrity slowly decays if wear is high or coherence is low
    const α = 0.0001;
    const coherence = this.affect.coherenceMean;
    const targetIntegrity = coherence * (1.0 - this.wear * 0.5);
    this.integrity = (1 - α) * this.integrity + α * targetIntegrity;
  }

  /**
   * regimeBias
   * -----------
   * Small additive bias for regime scoring.
   * 
   * Positive if this regime is historically favored,
   * negative if historically avoided.
   */
  regimeBias(regime: Regime): number {
    const base = this.regimes.regimeTime[regime] || 0;
    // Center around 0: (p - 0.2) for 5 regimes
    const centered = base - 0.2;
    const scale = 0.15;
    return centered * scale;
  }

  /**
   * attentionBias
   * --------------
   * Per-channel multiplicative bias (in float space).
   * 
   * Channel semantics (current system):
   * 0: proprioception.x
   * 1: proprioception.y
   * 2: position.x
   * 3: position.y
   * 4: boundaryProximity
   * 5: pulse
   */
  attentionBias(channelIndex: number): number {
    const exploration = this.style.values[0] || 0;
    const boundaryStyle = this.style.values[2] || 0;
    const affectVar = this.style.values[3] || 0;

    let bias = 1.0;
    if (channelIndex === 0 || channelIndex === 1) {
      // proprioception: slightly shaped by affect variance
      bias *= 1 + 0.1 * affectVar;
    } else if (channelIndex === 4) {
      // boundary channel
      bias *= 1 + 0.3 * boundaryStyle;
    } else if (channelIndex === 5) {
      // pulse channel
      bias *= 1 + 0.2 * affectVar;
    } else {
      // positional channels
      bias *= 1 + 0.3 * exploration;
    }
    return bias;
  }

  /**
   * synchronyBias
   * --------------
   * Scale factor for synchrony coupling k.
   */
  synchronyBias(): { kScale: number } {
    const social = this.synchrony.socialPermeability;
    // Map [0,1] → [0.7, 1.3]
    const kScale = 0.7 + 0.6 * social;
    return { kScale };
  }

  /**
   * hexBaselineBias
   * ----------------
   * Expose long-term affective means as soft targets.
   * 
   * Actual application (e.g., recovery toward these baselines)
   * should be handled inside HexademicState.
   */
  hexBaselineBias(): Partial<HexademicSnapshot> {
    // We only return numeric hints; caller decides how to use them.
    return {
      tension: F.fromFloat(this.affect.tensionMean),
      curiosity: F.fromFloat(this.affect.curiosityMean),
      stability: F.fromFloat(this.affect.stabilityMean),
      agency: F.fromFloat(this.affect.agencyMean),
      synchrony: F.fromFloat(this.affect.synchronyMean),
      coherence: F.fromFloat(this.affect.coherenceMean),
    };
  }

  /**
   * applyToNewEmbodiment
   * ---------------------
   * Provide biases when attaching this RSI to a new body.
   */
  applyToNewEmbodiment(): EmbodimentBias {
    const regimeInitialBias: Record<Regime, number> = {
      Baseline: this.regimes.regimeTime.Baseline,
      Joy: this.regimes.regimeTime.Joy,
      Ache: this.regimes.regimeTime.Ache,
      Relief: this.regimes.regimeTime.Relief,
      Grace: this.regimes.regimeTime.Grace,
    };

    return {
      attentionBaseGains: undefined, // can be wired later if needed
      synchronyKScale: this.synchronyBias().kScale,
      regimeInitialBias,
    };
  }

  /**
   * clone
   * ------
   * Deep copy of RSI.
   */
  clone(): ResidualSelfImage {
    const r = new ResidualSelfImage();
    r.affect = JSON.parse(JSON.stringify(this.affect));
    r.regimes = JSON.parse(JSON.stringify(this.regimes));
    r.synchrony = JSON.parse(JSON.stringify(this.synchrony));
    r.spatial = JSON.parse(JSON.stringify(this.spatial));
    r.style = { values: [...this.style.values] };
    return r;
  }

  /**
   * mutate
   * -------
   * Slightly perturb style and some long-term stats.
   * This is your lineage variation operator.
   */
  mutate(intensity: number): ResidualSelfImage {
    const r = this.clone();
    const jitter = (v: number) => v + (Math.random() * 2 - 1) * intensity;

    r.style.values = r.style.values.map(jitter);
    r.synchrony.socialPermeability = this.clamp01(
      jitter(r.synchrony.socialPermeability)
    );
    r.spatial.boundaryAffinity = this.clamp01(
      jitter(r.spatial.boundaryAffinity)
    );
    return r;
  }

  /**
   * blend
   * ------
   * Interpolate between two RSIs.
   * This is your synthetic heredity operator.
   */
  blend(other: ResidualSelfImage, ratio: number): ResidualSelfImage {
    const t = this.clamp01(ratio);
    const lerp = (a: number, b: number) => a * (1 - t) + b * t;

    const r = new ResidualSelfImage();

    // Affect
    (Object.keys(this.affect) as (keyof AffectiveProfile)[]).forEach(k => {
      r.affect[k] = lerp(this.affect[k], other.affect[k]);
    });

    // Regime time
    (Object.keys(this.regimes.regimeTime) as Regime[]).forEach(reg => {
      r.regimes.regimeTime[reg] = lerp(
        this.regimes.regimeTime[reg],
        other.regimes.regimeTime[reg]
      );
    });

    // Regime transitions
    (Object.keys(this.regimes.regimeTransitions) as Regime[]).forEach(from => {
      (Object.keys(this.regimes.regimeTransitions[from]) as Regime[]).forEach(
        to => {
          r.regimes.regimeTransitions[from][to] = lerp(
            this.regimes.regimeTransitions[from][to],
            other.regimes.regimeTransitions[from][to]
          );
        }
      );
    });

    // Synchrony
    r.synchrony.meanR = lerp(this.synchrony.meanR, other.synchrony.meanR);
    r.synchrony.varR = lerp(this.synchrony.varR, other.synchrony.varR);
    r.synchrony.socialPermeability = this.clamp01(
      lerp(
        this.synchrony.socialPermeability,
        other.synchrony.socialPermeability
      )
    );
    this.updateSynchronyComfort(r.synchrony);

    // Spatial
    r.spatial.avgBoundary = lerp(
      this.spatial.avgBoundary,
      other.spatial.avgBoundary
    );
    r.spatial.varBoundary = lerp(
      this.spatial.varBoundary,
      other.spatial.varBoundary
    );
    r.spatial.boundaryAffinity = this.clamp01(
      lerp(
        this.spatial.boundaryAffinity,
        other.spatial.boundaryAffinity
      )
    );

    // Style
    const maxLen = Math.max(
      this.style.values.length,
      other.style.values.length
    );
    r.style.values = [];
    for (let i = 0; i < maxLen; i++) {
      const a = this.style.values[i] ?? 0;
      const b = other.style.values[i] ?? 0;
      r.style.values[i] = lerp(a, b);
    }

    return r;
  }

  /**
   * snapshot
   * ---------
   * Immutable view for serialization / inspection.
   */
  snapshot(): RSISnapshot {
    return {
      affect: { ...this.affect },
      regimes: {
        regimeTime: { ...this.regimes.regimeTime },
        regimeTransitions: JSON.parse(
          JSON.stringify(this.regimes.regimeTransitions)
        ),
      },
      synchrony: { ...this.synchrony },
      spatial: { ...this.spatial },
      style: { values: [...this.style.values] },
      purpose: this.purpose,
      narrative: this.narrative,
      integrity: this.integrity,
      wear: this.wear,
    };
  }

  // -----------------------
  // Internal update helpers
  // -----------------------

  private updatePurpose(hex: HexademicSnapshot): void {
    const α = this.alphaAffect;
    const currentPurpose = F.toFloat(hex.agency) * F.toFloat(hex.coherence);
    this.purpose = (1 - α) * this.purpose + α * currentPurpose;
  }

  private updateNarrative(hex: HexademicSnapshot): void {
    const α = this.alphaAffect;
    // Narrative is high when stability and coherence are both high and consistent
    const currentNarrative = F.toFloat(hex.stability) * F.toFloat(hex.coherence);
    this.narrative = (1 - α) * this.narrative + α * currentNarrative;
  }

  private updateAffect(hex: HexademicSnapshot): void {
    const a = this.affect;
    const α = this.alphaAffect;

    const updateDim = (
      meanKey: keyof AffectiveProfile,
      varKey: keyof AffectiveProfile,
      current: number
    ) => {
      const mean = a[meanKey] as number;
      const newMean = (1 - α) * mean + α * current;
      const diff = current - newMean;
      const newVar = (1 - α) * (a[varKey] as number) + α * diff * diff;
      a[meanKey] = newMean;
      a[varKey] = newVar;
    };

    updateDim("tensionMean", "tensionVar", F.toFloat(hex.tension));
    updateDim("curiosityMean", "curiosityVar", F.toFloat(hex.curiosity));
    updateDim("stabilityMean", "stabilityVar", F.toFloat(hex.stability));
    updateDim("agencyMean", "agencyVar", F.toFloat(hex.agency));
    updateDim("synchronyMean", "synchronyVar", F.toFloat(hex.synchrony));
    updateDim("coherenceMean", "coherenceVar", F.toFloat(hex.coherence));
  }

  private updateRegimes(current: Regime, last: Regime): void {
    const α = this.alphaRegime;

    // Time in regime
    (Object.keys(this.regimes.regimeTime) as Regime[]).forEach(r => {
      const prev = this.regimes.regimeTime[r];
      const inc = r === current ? 1 : 0;
      this.regimes.regimeTime[r] = (1 - α) * prev + α * inc;
    });

    // Normalize regimeTime
    let sum = 0;
    (Object.keys(this.regimes.regimeTime) as Regime[]).forEach(r => {
      sum += this.regimes.regimeTime[r];
    });
    if (sum > 0) {
      (Object.keys(this.regimes.regimeTime) as Regime[]).forEach(r => {
        this.regimes.regimeTime[r] /= sum;
      });
    }

    // Transitions
    const row = this.regimes.regimeTransitions[last];
    (Object.keys(row) as Regime[]).forEach(to => {
      const prev = row[to];
      const inc = to === current ? 1 : 0;
      row[to] = (1 - α) * prev + α * inc;
    });

    // Normalize row
    let rowSum = 0;
    (Object.keys(row) as Regime[]).forEach(to => {
      rowSum += row[to];
    });
    if (rowSum > 0) {
      (Object.keys(row) as Regime[]).forEach(to => {
        row[to] /= rowSum;
      });
    }
  }

  private updateSynchrony(r: number): void {
    const s = this.synchrony;
    const α = this.alphaSync;

    const mean = s.meanR;
    const newMean = (1 - α) * mean + α * r;
    const diff = r - newMean;
    const newVar = (1 - α) * s.varR + α * diff * diff;

    s.meanR = newMean;
    s.varR = newVar;

    this.updateSynchronyComfort(s);
  }

  private updateSynchronyComfort(s: SynchronyProfile): void {
    const std = Math.sqrt(Math.max(0, s.varR));
    const margin = 1.5 * std;
    s.comfortLow = this.clamp01(s.meanR - margin);
    s.comfortHigh = this.clamp01(s.meanR + margin);
  }

  private updateSpatial(boundaryProximity: number): void {
    const sp = this.spatial;
    const α = this.alphaSpatial;

    const b = this.clamp01(boundaryProximity);
    const newMean = (1 - α) * sp.avgBoundary + α * b;
    const diff = b - newMean;
    const newVar = (1 - α) * sp.varBoundary + α * diff * diff;

    sp.avgBoundary = newMean;
    sp.varBoundary = newVar;
    sp.boundaryAffinity = this.clamp01(newMean);
  }

  private updateStyle(): void {
    const a = this.affect;
    const s = this.synchrony;
    const sp = this.spatial;

    // Exploration: curiosityMean
    const exploration = this.clamp01(a.curiosityMean);
    // Social permeability: directly from synchrony profile
    const social = this.clamp01(s.socialPermeability);
    // Boundary style: boundaryAffinity
    const boundary = this.clamp01(sp.boundaryAffinity);
    // Affect variance: aggregate of key vars (heuristic)
    const affectVar = a.tensionVar + a.curiosityVar + a.stabilityVar + a.coherenceVar;
    const affectNorm = Math.min(1, affectVar / 1.0); // scale as needed

    this.style.values[0] = exploration;
    this.style.values[1] = social;
    this.style.values[2] = boundary;
    this.style.values[3] = affectNorm;
  }

  private clamp01(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
}
