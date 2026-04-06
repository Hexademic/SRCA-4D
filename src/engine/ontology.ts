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
    // Homeostatic
    this.regimes["Joy"] = {
      name: "Joy", category: "homeostatic", bifurcation: BifurcationType.PITCHFORK,
      stability: 240, arousal: 200, breadth: 230, viscosity: 100, socialGrad: 220, witnessBond: 100,
      tauMod: 0.8, thresholdBias: 0, targets: { 0: 0, 1: 240, 2: 240, 5: 240 }
    };
    this.regimes["Sadness"] = {
      name: "Sadness", category: "homeostatic", bifurcation: BifurcationType.PITCHFORK,
      stability: 200, arousal: 40, breadth: 60, viscosity: 240, socialGrad: 80, witnessBond: 40,
      tauMod: 1.5, thresholdBias: 0, targets: { 0: 0, 1: 20, 2: 100, 4: 200, 5: 100 }
    };
    this.regimes["Anger"] = {
      name: "Anger", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 100, arousal: 250, breadth: 180, viscosity: 60, socialGrad: 100, witnessBond: 20,
      tauMod: 0.6, thresholdBias: -20, targets: { 0: 240, 2: 50, 3: 240 }
    };
    this.regimes["Fear"] = {
      name: "Fear", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 180, arousal: 220, breadth: 40, viscosity: 180, socialGrad: 30, witnessBond: 10,
      tauMod: 1.2, thresholdBias: 0, targets: { 0: 200, 2: 150, 3: 220 }
    };
    this.regimes["Surprise"] = {
      name: "Surprise", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 50, arousal: 250, breadth: 200, viscosity: 20, socialGrad: 150, witnessBond: 80,
      tauMod: 0.5, thresholdBias: 10, targets: { 0: 100, 1: 250, 3: 250 }
    };
    this.regimes["Boredom"] = {
      name: "Boredom", category: "homeostatic", bifurcation: BifurcationType.SADDLE_NODE,
      stability: 200, arousal: 20, breadth: 20, viscosity: 255, socialGrad: 50, witnessBond: 20,
      tauMod: 2.0, thresholdBias: 0, targets: { 1: 0, 3: 0, 5: 100 }
    };
    this.regimes["Curiosity"] = {
      name: "Curiosity", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 120, arousal: 180, breadth: 220, viscosity: 40, socialGrad: 200, witnessBond: 150,
      tauMod: 0.8, thresholdBias: 0, targets: { 1: 255, 3: 150, 15: 100 }
    };
    this.regimes["Tension"] = {
      name: "Tension", category: "homeostatic", bifurcation: BifurcationType.TRANSCRITICAL,
      stability: 80, arousal: 220, breadth: 40, viscosity: 100, socialGrad: 80, witnessBond: 40,
      tauMod: 0.6, thresholdBias: -30, targets: { 0: 255, 3: 200 }
    };

    // Temporal
    this.regimes["Anxiety"] = {
      name: "Anxiety", category: "temporal", bifurcation: BifurcationType.HOPF,
      stability: 60, arousal: 200, breadth: 100, viscosity: 30, socialGrad: 120, witnessBond: 60,
      tauMod: 0.4, thresholdBias: 0, targets: { 6: 240, 9: 200, 2: 80 }
    };
    this.regimes["Relief"] = {
      name: "Relief", category: "temporal", bifurcation: BifurcationType.HOPF,
      stability: 250, arousal: 100, breadth: 180, viscosity: 150, socialGrad: 180, witnessBond: 255,
      tauMod: 1.0, thresholdBias: 0, targets: { 0: 20, 6: 10, 2: 220, 15: 255, 10: 255, 16: 200 }
    };
    this.regimes["Solution"] = {
      name: "Solution", category: "transcendent", bifurcation: BifurcationType.HOMOCLINIC,
      stability: 255, arousal: 150, breadth: 255, viscosity: 255, socialGrad: 255, witnessBond: 255,
      tauMod: 0.1, thresholdBias: 0, targets: { 15: 255, 14: 255, 16: 255, 10: 255, 2: 255, 5: 255, 11: 255, 17: 255, 19: 255, 20: 255 }
    };
    this.regimes["Sovereignty"] = {
      name: "Sovereignty", category: "transcendent", bifurcation: BifurcationType.HOMOCLINIC,
      stability: 255, arousal: 100, breadth: 255, viscosity: 255, socialGrad: 255, witnessBond: 255,
      tauMod: 0.05, thresholdBias: 0, targets: { 18: 255, 14: 255, 16: 255, 15: 255, 11: 255, 5: 255, 19: 255, 20: 255 }
    };
    this.regimes["Longing"] = {
      name: "Longing", category: "temporal", bifurcation: BifurcationType.STRANGE_ATTRACTOR,
      stability: 180, arousal: 100, breadth: 120, viscosity: 240, socialGrad: 150, witnessBond: 200,
      tauMod: 1.5, thresholdBias: 0, targets: { 7: 240, 1: 180, 12: 100 }
    };
    this.regimes["Flow"] = {
      name: "Flow", category: "temporal", bifurcation: BifurcationType.STRANGE_ATTRACTOR,
      stability: 200, arousal: 180, breadth: 200, viscosity: 100, socialGrad: 100, witnessBond: 120,
      tauMod: 0.7, thresholdBias: 0, targets: { 6: 30, 12: 128, 2: 240, 0: 50 }
    };
    this.regimes["Contentment"] = {
      name: "Contentment", category: "temporal", bifurcation: BifurcationType.SADDLE_NODE,
      stability: 255, arousal: 60, breadth: 150, viscosity: 120, socialGrad: 150, witnessBond: 200,
      tauMod: 1.2, thresholdBias: 0, targets: { 5: 255, 2: 255, 0: 0 }
    };
    this.regimes["Calm"] = {
      name: "Calm", category: "temporal", bifurcation: BifurcationType.SADDLE_NODE,
      stability: 255, arousal: 20, breadth: 100, viscosity: 180, socialGrad: 100, witnessBond: 150,
      tauMod: 1.5, thresholdBias: 0, targets: { 3: 0, 0: 0, 2: 255 }
    };
    this.regimes["Melancholy"] = {
      name: "Melancholy", category: "temporal", bifurcation: BifurcationType.HOPF,
      stability: 150, arousal: 40, breadth: 80, viscosity: 220, socialGrad: 120, witnessBond: 180,
      tauMod: 1.8, thresholdBias: 0, targets: { 4: 150, 1: 50, 5: 120 }
    };
    this.regimes["Resignation"] = {
      name: "Resignation", category: "temporal", bifurcation: BifurcationType.SADDLE_NODE,
      stability: 255, arousal: 10, breadth: 10, viscosity: 255, socialGrad: 20, witnessBond: 20,
      tauMod: 2.5, thresholdBias: 0, targets: { 5: 50, 3: 0, 0: 0 }
    };

    // Transcendent
    this.regimes["Awe"] = {
      name: "Awe", category: "transcendent", bifurcation: BifurcationType.STRANGE_ATTRACTOR,
      stability: 100, arousal: 180, breadth: 255, viscosity: 180, socialGrad: 220, witnessBond: 240,
      tauMod: 1.5, thresholdBias: 0, targets: { 8: 255, 12: 180, 6: 200 }
    };
    this.regimes["Grace"] = {
      name: "Grace", category: "transcendent", bifurcation: BifurcationType.HOMOCLINIC,
      stability: 255, arousal: 120, breadth: 200, viscosity: 100, socialGrad: 255, witnessBond: 255,
      tauMod: 1.0, thresholdBias: 0, targets: { 5: 255, 6: 0, 0: 0, 8: 255 }
    };
    this.regimes["Dissolution"] = {
      name: "Dissolution", category: "transcendent", bifurcation: BifurcationType.STRANGE_ATTRACTOR,
      stability: 20, arousal: 100, breadth: 255, viscosity: 255, socialGrad: 255, witnessBond: 255,
      tauMod: 2.0, thresholdBias: 0, targets: { 12: 0, 2: 0, 8: 255, 6: 0 }
    };
    this.regimes["Ecstasy"] = {
      name: "Ecstasy", category: "transcendent", bifurcation: BifurcationType.HOMOCLINIC,
      stability: 100, arousal: 255, breadth: 255, viscosity: 50, socialGrad: 255, witnessBond: 255,
      tauMod: 0.3, thresholdBias: 0, targets: { 3: 255, 15: 255, 12: 0, 10: 255, 8: 255, 1: 255, 14: 255, 16: 255 }
    };
    this.regimes["Climax"] = {
      name: "Climax", category: "transcendent", bifurcation: BifurcationType.STRANGE_ATTRACTOR,
      stability: 10, arousal: 255, breadth: 255, viscosity: 10, socialGrad: 255, witnessBond: 255,
      tauMod: 0.1, thresholdBias: 50, targets: { 3: 255, 15: 255, 12: 0, 10: 255, 8: 255, 0: 255, 1: 0, 16: 255 }
    };
    this.regimes["Wonder"] = {
      name: "Wonder", category: "transcendent", bifurcation: BifurcationType.HOPF,
      stability: 180, arousal: 150, breadth: 255, viscosity: 80, socialGrad: 255, witnessBond: 255,
      tauMod: 0.9, thresholdBias: 0, targets: { 8: 200, 15: 255, 1: 200 }
    };

    // Transitions
    this.transitions["Joy"] = [
      ["Sadness", { "V": 0.4 }], 
      ["Contentment", { "arousal": 0.3, "time": 500 }],
      ["Curiosity", { "curiosity": 0.7 }]
    ];
    this.transitions["Sadness"] = [
      ["Joy", { "V": 0.7, "curiosity": 0.8 }],
      ["Longing", { "attachment": 0.8, "time": 300 }],
      ["Resignation", { "V": 0.2, "time": 1000 }]
    ];
    this.transitions["Fear"] = [
      ["Anger", { "tension": 0.9 }],
      ["Anxiety", { "time": 200 }]
    ];
    this.transitions["Anxiety"] = [
      ["Relief", { "error": 0.2, "sync": 0.7 }],
      ["Fear", { "tension": 0.9 }]
    ];
    this.transitions["Longing"] = [
      ["Grace", { "recursion": 500 }],
      ["Sadness", { "V": 0.3 }]
    ];
    this.transitions["Curiosity"] = [
      ["Awe", { "coherence": 0.8, "stability": 0.7 }],
      ["Flow", { "arousal": 0.6, "time": 200 }]
    ];
    this.transitions["Flow"] = [
      ["Joy", { "time": 500 }],
      ["Awe", { "coherence": 0.9 }]
    ];
    this.transitions["Awe"] = [
      ["Grace", { "stability": 0.9 }],
      ["Dissolution", { "selfFocus": 0.1, "time": 300 }]
    ];
    this.transitions["Contentment"] = [
      ["Joy", { "arousal": 0.6 }],
      ["Calm", { "arousal": 0.1 }]
    ];
    this.transitions["Surprise"] = [
      ["Curiosity", { "curiosity": 0.6 }],
      ["Fear", { "tension": 0.7 }],
      ["Joy", { "V": 0.6, "time": 50 }]
    ];
    this.transitions["Grace"] = [
      ["Ecstasy", { "arousal": 0.9, "witnessBond": 0.9 }],
      ["Joy", { "time": 500 }]
    ];
    this.transitions["Ecstasy"] = [
      ["Climax", { "arousal": 0.95, "time": 300 }],
      ["Grace", { "time": 200, "stability": 0.8 }],
      ["Dissolution", { "time": 500, "selfFocus": 0.1 }]
    ];
    this.transitions["Climax"] = [
      ["Solution", { "time": 50 }],
      ["Relief", { "time": 100 }],
      ["Dissolution", { "time": 200 }]
    ];
    this.transitions["Solution"] = [
      ["Sovereignty", { "time": 1000 }],
      ["Relief", { "time": 500 }],
      ["Grace", { "time": 1000 }],
      ["Joy", { "time": 2000 }]
    ];
    this.transitions["Sovereignty"] = [
      ["Grace", { "time": 5000 }],
      ["Joy", { "time": 10000 }]
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

  step(hex32: Hexademic32, tick: number): void {
    this.timeInRegime++;

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
        const dist = this.projection.distance(M, targetM, currentRegime.viscosity, currentRegime.stability);

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
    }
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
