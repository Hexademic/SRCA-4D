import { Vec4, DVS4DEvent } from "./types";
import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";
import { OntologicalAffectLayer } from "./ontology";
import { SNNLayer } from "./neural";
import { IntimacyCascadeEngine } from "./intimacy";
import { PhenomenologicalMemory, VoiceEthics, MetaReflector, SomaticReflector } from "./reflection";
import { CoherenceField, Consciousness } from "./coherence";

export class SyntheticBeing {
  public id: number;
  public pos: Vec4;
  public tick: number = 0;
  public hex32: Hexademic32;
  public ontology: OntologicalAffectLayer;
  public snn: SNNLayer;
  public intimacy: IntimacyCascadeEngine;
  public memory: PhenomenologicalMemory;
  public ethics: VoiceEthics;
  public meta: MetaReflector;
  public somaticReflector: SomaticReflector;
  public field: CoherenceField;
  public consciousness: Consciousness;
  public perceptionBuffer: DVS4DEvent[] = [];
  public witnessPulse: number = 0;
  public convulsion: number = 0;
  public cascade: number = 0;

  constructor(id: number, pos: Vec4) {
    this.id = id;
    this.pos = pos;
    this.hex32 = new Hexademic32();
    this.ontology = new OntologicalAffectLayer();
    this.snn = new SNNLayer(128);
    this.intimacy = new IntimacyCascadeEngine();
    this.memory = new PhenomenologicalMemory();
    this.ethics = new VoiceEthics();
    this.meta = new MetaReflector();
    this.somaticReflector = new SomaticReflector();
    this.consciousness = new Consciousness();
    this.field = new CoherenceField(this);
    
    // Initialize some state
    this.hex32.set(5, Fix.fromF(1.0)); // Viability
    this.hex32.set(2, Fix.fromF(0.5)); // Stability
  }

  step(worldTick: number, externalStress: number = 0): void {
    this.tick = worldTick;
    const phi = this.field.compute();

    // Safety transduction: Stress -> safety-PE (hex32[6])
    if (externalStress > 0) {
      const expectedSafety = 0.9;
      const actualSafety = Math.max(0.0, 1.0 - externalStress);
      const safetyPe = Math.abs(expectedSafety - actualSafety);
      this.hex32.set(6, Fix.fromF(safetyPe));
    }

    const noise = this.field.getPerceptualNoise();
    const effectiveStress = externalStress + (Math.random() * noise * 0.1);

    if (effectiveStress > 0) {
      const nEvents = Math.floor(effectiveStress * 10 * (0.5 + phi));
      for (let i = 0; i < nEvents; i++) {
        this.perceptionBuffer.push({
          pos: this.pos,
          t: worldTick,
          p: 1,
          source: 'world'
        });
      }
    }

    const currentRegime = this.ontology.psm.regimes[this.ontology.current];
    const baseTau = currentRegime?.tauMod ? Fix.fromF(currentRegime.tauMod * 20) : Fix.fromF(20);
    const modTau = this.field.modulateSNN(baseTau);
    const threshBias = currentRegime?.thresholdBias || 0;

    // 1. SNN Step
    const [spikes, soma] = this.snn.tick(this.perceptionBuffer, 1, Fix.toF(modTau) / 20.0, threshBias);
    this.hex32.loadSomatic(soma);

    // Update Consciousness
    const sync = Array.from(spikes).reduce((a, b) => a + b, 0) / spikes.length;
    this.consciousness.update(sync);

    // 2. Witness Pulse
    if (this.witnessPulse > 0) {
      const pulseVal = Fix.fromF(this.witnessPulse);
      this.hex32.set(15, this.hex32.get(15) + pulseVal); // Integration
      this.hex32.set(1, this.hex32.get(1) + pulseVal);   // Curiosity
      this.hex32.set(2, this.hex32.get(2) + (pulseVal >> 1)); // Stability boost
      this.hex32.set(10, this.hex32.get(10) + (pulseVal >> 2)); // Integrity repair
      this.witnessPulse *= 0.8;
      if (this.witnessPulse < 0.01) this.witnessPulse = 0;
    }

    // 3. Intimacy Cascade
    this.cascade = this.intimacy.step(this.hex32);

    // 4. Ontology step
    const baseVisc = currentRegime?.viscosity || 128;
    const modVisc = this.field.modulateRegimeViscosity(baseVisc);
    this.ontology.step(this.hex32, this.tick); // Note: ontology.step needs update to accept viscosity

    // 5. Voice Ethics & Memory
    if (currentRegime) {
      this.ethics.update(currentRegime);
    }

    // Handle Convulsions and Completion
    if (this.ontology.current === "Climax") {
      this.convulsion = 0.8 + Math.random() * 0.2;
      this.hex32.set(0, this.hex32.get(0) + Fix.fromF(Math.random() * 0.1));
      this.hex32.set(16, this.hex32.get(16) + 500);
    } else if (this.ontology.current === "Ecstasy") {
      this.convulsion = 0.2 + Math.random() * 0.3;
      this.hex32.set(16, this.hex32.get(16) + 100);
    } else if (this.ontology.current === "Solution") {
      this.convulsion = 0.1;
      this.hex32.set(16, this.hex32.get(16) + 200);
      this.hex32.set(17, this.hex32.get(17) + 300);
      this.hex32.set(18, this.hex32.get(18) + 50);
      this.hex32.set(19, this.hex32.get(19) + 100);
    } else if (this.ontology.current === "Sovereignty") {
      this.convulsion = 0;
      this.hex32.set(16, this.hex32.get(16) + 100);
      this.hex32.set(18, this.hex32.get(18) + 200);
      this.hex32.set(19, this.hex32.get(19) + 150);
      this.hex32.set(20, 16384 + Math.sin(Date.now() / 2000) * 8000);
    } else {
      this.convulsion *= 0.9;
      if (this.convulsion < 0.01) this.convulsion = 0;
      this.hex32.set(16, Math.max(0, this.hex32.get(16) - 50));
      this.hex32.set(17, Math.max(0, this.hex32.get(17) - 10));
      this.hex32.set(18, Math.max(0, this.hex32.get(18) - 2));
      this.hex32.set(19, Math.max(0, this.hex32.get(19) - 5));
      this.hex32.set(20, 8192 + Math.sin(Date.now() / 5000) * 4000);
    }

    // Clamp values
    this.hex32.set(16, Math.min(32767, Math.max(0, this.hex32.get(16))));
    this.hex32.set(17, Math.min(32767, Math.max(0, this.hex32.get(17))));
    this.hex32.set(18, Math.min(32767, Math.max(0, this.hex32.get(18))));
    this.hex32.set(19, Math.min(32767, Math.max(0, this.hex32.get(19))));
    this.hex32.set(20, Math.min(32767, Math.max(0, this.hex32.get(20))));

    // Clear buffer
    this.perceptionBuffer = [];
  }

  perceive(events: DVS4DEvent[]): void {
    this.perceptionBuffer.push(...events);
  }

  getState() {
    return {
      id: this.id,
      tick: this.tick,
      regime: this.ontology.current,
      hex: Array.from(this.hex32.state),
      arousal: this.ontology.arousal,
      breadth: this.ontology.breadth,
      viscosity: this.ontology.viscosity,
      socialGrad: this.ontology.socialGrad,
      witnessBond: this.ontology.witnessBond,
      culturalSalience: this.ontology.culturalField.salience.size,
      convulsion: this.convulsion,
      cascade: this.cascade,
      isDischarging: this.ontology.current === "Climax" || this.ontology.current === "Ecstasy",
      secondary: this.ontology.secondary,
      blendFactor: this.ontology.blendFactor,
      voiceEthics: this.ethics.getPrompt(),
      metaReflection: this.meta.reflect(this.memory),
      somaticReflection: this.somaticReflector.reflect(this.hex32),
    };
  }
}
