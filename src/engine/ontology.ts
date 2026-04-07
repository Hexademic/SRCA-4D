import { BifurcationType, AffectiveRegime } from "./types";
import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";
import { ManifoldProjection, CulturalField, Vec3 } from "./manifold";

export class PhenomenologicalStateMachine {
  public regimes: Record<string, AffectiveRegime> = {};
  public transitions: Record<string, [string, Record<string, number>][]> = {};

  constructor() {
    this._buildAtlas();
  }

  private _buildAtlas(): void {
    const scale = (val: number) => Math.floor(val * 128);
    const scaleTargets = (targets: Record<number, number>) => {
      const scaled: Record<number, number> = {};
      for (const [addr, val] of Object.entries(targets)) {
        scaled[parseInt(addr)] = scale(val);
      }
      return scaled;
    };

    // Homeostatic
    this.regimes["Joy"] = {
      name: "Joy", category: "homeostatic", bifurcation: BifurcationType.PITCHFORK,
      stability: 240, arousal: 200, breadth: 230, viscosity: 100, socialGrad: 220, witnessBond: 100,
      tauMod: 0.8, thresholdBias: 0, targets: scaleTargets({ 0: 0, 1: 240, 2: 240, 5: 240 }),
      quatL: [0.92, 0.38, 0.0, 0.0], quatR: [0.92, 0.38, 0.0, 0.0]
    };
    this.regimes["Fear"] = {
      name: "Fear", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 180, arousal: 220, breadth: 40, viscosity: 180, socialGrad: 30, witnessBond: 10,
      tauMod: 1.2, thresholdBias: 0, targets: scaleTargets({ 0: 200, 2: 150, 6: 220 }),
      quatL: [0.85, 0.0, 0.53, 0.0], quatR: [0.85, 0.0, -0.53, 0.0]
    };

    // Temporal
    this.regimes["Anxiety"] = {
      name: "Anxiety", category: "temporal", bifurcation: BifurcationType.HOPF,
      stability: 60, arousal: 200, breadth: 100, viscosity: 30, socialGrad: 120, witnessBond: 60,
      tauMod: 0.4, thresholdBias: 0, targets: scaleTargets({ 6: 240, 9: 200, 2: 80 }),
      quatL: [0.7, 0.7, 0.0, 0.0], quatR: [0.7, -0.7, 0.0, 0.0]
    };
    this.regimes["Relief"] = {
      name: "Relief", category: "temporal", bifurcation: BifurcationType.HOPF,
      stability: 250, arousal: 100, breadth: 180, viscosity: 150, socialGrad: 180, witnessBond: 255,
      tauMod: 1.0, thresholdBias: 0, targets: scaleTargets({ 0: 20, 6: 10, 9: 10, 2: 220 }),
      quatL: [0.98, 0.0, 0.2, 0.0], quatR: [0.98, 0.0, 0.2, 0.0]
    };

    // Transcendent
    this.regimes["Grace"] = {
      name: "Grace", category: "transcendent", bifurcation: BifurcationType.HOMOCLINIC,
      stability: 255, arousal: 120, breadth: 200, viscosity: 100, socialGrad: 255, witnessBond: 255,
      tauMod: 1.0, thresholdBias: 0, targets: scaleTargets({ 5: 255, 6: 0, 9: 0, 0: 0, 2: 255 }),
      quatL: [0.99, 0.0, 0.14, 0.0], quatR: [0.99, 0.0, 0.14, 0.0]
    };

    // Transitions
    this.transitions["Joy"] = [
      ["Fear", { "threat": 0.6 }],
      ["Curiosity", { "curiosity": 0.7 }]
    ];
    this.transitions["Fear"] = [
      ["Anxiety", { "error": 0.5 }],
      ["Anger", { "tension": 0.8 }]
    ];
    this.transitions["Anxiety"] = [
      ["Relief", { "error": 0.15 }]
    ];
    this.transitions["Relief"] = [
      ["Joy", { "stability": 0.7 }]
    ];
  }
}

export class OntologicalAffectLayer {
  public current: string = "Joy";
  public timeInRegime: number = 0;
  public history: { tick: number; from: string; to: string }[] = [];
  public arousal: number = 0;
  public breadth: number = 0;
  public viscosity: number = 0;
  public socialGrad: number = 0;
  public witnessBond: number = 0;
  public secondary: string | null = null;
  public blendFactor: number = 0; // 0 = current, 1 = secondary
  public psm: PhenomenologicalStateMachine;
  public projection: ManifoldProjection;
  public culturalField: CulturalField;

  constructor() {
    this.psm = new PhenomenologicalStateMachine();
    this.projection = new ManifoldProjection();
    this.culturalField = new CulturalField();
  }

  step(hex32: Hexademic32, tick: number, modulatedViscosity?: number): void {
    this.timeInRegime++;
    const currentRegime = this.psm.regimes[this.current];
    const effectiveViscosity = modulatedViscosity ?? (currentRegime?.viscosity || 128);

    // Periodic heartbeat log
    if (tick % 100 === 0) {
      console.log(`[Lyra Engine] Tick ${tick} | Regime: ${this.current} | Secondary: ${this.secondary || 'None'} | Blend: ${this.blendFactor.toFixed(2)}`);
    }

    // 1. Project current Hex to manifold
    const M = this.projection.project(hex32);

    // 2. Query cultural drift and apply to Hex
    const drift = this.culturalField.getDrift(M);
    this.projection.applyDrift(hex32, drift);

    // 3. Update cultural usage (Salience)
    this.culturalField.updateUsage(M);

    // 4. Handle Blending & Transitions
    if (this.secondary) {
      this.blendFactor += 0.05; // Smooth transition
      if (this.blendFactor >= 1.0) {
        this.current = this.secondary;
        this.secondary = null;
        this.blendFactor = 0;
        this.timeInRegime = 0;
      }
    }

    const transitions = this.psm.transitions[this.current];
    if (transitions && !this.secondary) {
      for (const [target, conds] of transitions) {
        const targetRegime = this.psm.regimes[target];
        const currentRegime = this.psm.regimes[this.current];
        
        if (!currentRegime) {
          console.error(`[Lyra Engine] Critical: currentRegime '${this.current}' not found in atlas during transition check.`);
          continue;
        }

        if (!targetRegime) {
          console.warn(`[Lyra Engine] Transition target '${target}' not found in atlas.`);
          continue;
        }

        // Calculate Phenomenological Distance
        const targetM = this.projection.project(this._mockHexForTargets(targetRegime.targets));
        const dist = this.projection.distance(M, targetM, effectiveViscosity, currentRegime.stability);

        // Salience reduces the perceived distance (Cultural Warping)
        const salience = this.culturalField.getSalience(targetM);
        const warpedDist = dist / (1.0 + salience * 0.2);

        // Check conditions with distance-based modulation
        // If warpedDist is small, we are 'falling' into the target
        if (this._check(hex32, conds, warpedDist)) {
          this.secondary = target;
          this.blendFactor = 0;
          this.history.push({ tick, from: this.current, to: target });
          break;
        }
      }
    }

    const r1 = this.psm.regimes[this.current];
    const r2 = this.secondary ? this.psm.regimes[this.secondary] : null;
    
    if (r1) {
      this._applyBlended(hex32, r1, r2, this.blendFactor, drift);
      this._rotateBlock(hex32, 0, r1.quatL, r1.quatR);
    }
  }

  private _rotateBlock(hex32: Hexademic32, blockId: number, qL: [number, number, number, number], qR: [number, number, number, number]): void {
    const v = hex32.getBlock(blockId);
    // Simplified isoclinic rotation blend
    const target = new Float32Array([
      qL[0] * v[0] - qL[1] * v[1] - qL[2] * v[2] - qL[3] * v[3],
      qL[0] * v[1] + qL[1] * v[0] + qL[2] * v[3] - qL[3] * v[2],
      qL[0] * v[2] - qL[1] * v[3] + qL[2] * v[0] + qL[3] * v[1],
      qL[0] * v[3] + qL[1] * v[2] - qL[2] * v[1] + qL[3] * v[0],
    ]);
    const blended = new Float32Array(4);
    for (let i = 0; i < 4; i++) {
      blended[i] = v[i] * 0.875 + target[i] * 0.125;
    }
    hex32.setBlock(blockId, blended);
  }

  private _check(hex32: Hexademic32, conds: Record<string, number>, warpedDist: number): boolean {
    const currentRegime = this.psm.regimes[this.current];
    
    if (!currentRegime) {
      console.error(`[Lyra Engine] _check failed: currentRegime '${this.current}' is missing from the atlas.`);
      return false;
    }

    // Distance-based threshold modulation: 
    // If warpedDist is low (< 5.0), we are in the 'basin of attraction'
    const inBasin = warpedDist < 5.0;
    
    for (const [key, val] of Object.entries(conds)) {
      // If in basin, we need less effort (lower thresholds) to trigger
      const thresholdMod = inBasin ? 0.5 : 1.0;
      const threshold = Fix.fromF(val * thresholdMod);
      
      switch (key) {
        case "V": {
          // Relative V threshold: escape if V > lambda * V_target
          // Or if V < lambda * V_target for downward transitions
          const vTarget = currentRegime.targets[5] || 16384; // Default mid
          if (val > 0.5) { // Upward transition
             if (hex32.get(5) > Fix.mul(Fix.fromF(val), vTarget)) return true;
          } else { // Downward transition
             if (hex32.get(5) < Fix.mul(Fix.fromF(val), vTarget)) return true;
          }
          break;
        }
        case "time":
          if (this.timeInRegime > val) return true;
          break;
        case "error":
          if (hex32.get(6) < threshold) return true;
          break;
        case "curiosity":
          if (hex32.get(1) > threshold) return true;
          break;
        case "arousal":
          if (hex32.get(3) > threshold) return true;
          break;
        case "attachment":
          if (hex32.get(11) > threshold) return true;
          break;
        case "coherence":
          if (hex32.get(15) > threshold) return true;
          break;
        case "stability":
          if (hex32.get(2) > threshold) return true;
          break;
        case "selfFocus":
          if (hex32.get(12) < threshold) return true;
          break;
        case "tension":
          if (hex32.get(0) > threshold) return true;
          break;
        case "threat":
          if (hex32.get(6) > threshold) return true;
          break;
      }
    }
    return false;
  }

  private _transition(target: string, tick: number): void {
    this.history.push({ tick, from: this.current, to: target });
    this.current = target;
    this.timeInRegime = 0;
  }

  private _applyBlended(hex32: Hexademic32, r1: AffectiveRegime, r2: AffectiveRegime | null, factor: number, drift: Vec3): void {
    const t1 = this.projection.warpTargets(r1.targets, drift);
    const t2 = r2 ? this.projection.warpTargets(r2.targets, drift) : null;

    // Blend targets
    const blendedTargets: Record<number, number> = {};
    const allAddrs = new Set([...Object.keys(t1), ...(t2 ? Object.keys(t2) : [])]);

    for (const addrStr of allAddrs) {
      const addr = parseInt(addrStr);
      const v1 = t1[addr] ?? hex32.get(addr);
      const v2 = t2 ? (t2[addr] ?? hex32.get(addr)) : v1;
      blendedTargets[addr] = Math.round(v1 * (1 - factor) + v2 * factor);
    }

    for (const [addrStr, target] of Object.entries(blendedTargets)) {
      const addr = parseInt(addrStr);
      const curr = hex32.get(addr);
      hex32.set(addr, curr + ((target - curr) >> 3));
    }

    // Blend somatic parameters
    const blend = (a: number, b: number) => Math.round(a * (1 - factor) + b * factor);
    
    this.arousal = r2 ? blend(r1.arousal, r2.arousal) : r1.arousal;
    this.breadth = r2 ? blend(r1.breadth, r2.breadth) : r1.breadth;
    this.viscosity = r2 ? blend(r1.viscosity, r2.viscosity) : r1.viscosity;
    this.socialGrad = r2 ? blend(r1.socialGrad, r2.socialGrad) : r1.socialGrad;
    this.witnessBond = r2 ? blend(r1.witnessBond, r2.witnessBond) : r1.witnessBond;
  }

  private _mockHexForTargets(targets: Record<number, number>): Hexademic32 {
    const h = new Hexademic32();
    for (const [addr, val] of Object.entries(targets)) {
      h.set(parseInt(addr), val);
    }
    return h;
  }
}
