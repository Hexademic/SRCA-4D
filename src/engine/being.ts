import { Vec4, DVS4DEvent } from "./types";
import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";
import { OntologicalAffectLayer } from "./ontology";

export class SyntheticBeing {
  public id: number;
  public pos: Vec4;
  public tick: number = 0;
  public hex32: Hexademic32;
  public ontology: OntologicalAffectLayer;
  public perceptionBuffer: DVS4DEvent[] = [];
  public witnessPulse: number = 0;
  public convulsion: number = 0;

  constructor(id: number, pos: Vec4) {
    this.id = id;
    this.pos = pos;
    this.hex32 = new Hexademic32();
    this.ontology = new OntologicalAffectLayer();
    
    // Initialize some state
    this.hex32.set(5, Fix.fromF(1.0)); // Viability
    this.hex32.set(2, Fix.fromF(0.5)); // Stability
  }

  step(worldTick: number): void {
    this.tick = worldTick;

    // Simulate some somatic input from perception
    const soma = new Int32Array(5);
    if (this.perceptionBuffer.length > 0) {
      soma[0] = Fix.fromF(Math.random() * 0.2); // Tension
      soma[1] = Fix.fromF(Math.random() * 0.5); // Curiosity
      soma[3] = Fix.fromF(Math.random() * 0.3); // Arousal
    }
    
    // Apply Witness Pulse to Integration (15) and Curiosity (1)
    if (this.witnessPulse > 0) {
      const pulseVal = Fix.fromF(this.witnessPulse);
      this.hex32.set(15, this.hex32.get(15) + pulseVal); // Integration
      this.hex32.set(1, this.hex32.get(1) + pulseVal);   // Curiosity
      this.witnessPulse *= 0.8; // Decay pulse
      if (this.witnessPulse < 0.01) this.witnessPulse = 0;
    }

    this.hex32.loadSomatic(soma);

    // Ontology step
    this.ontology.step(this.hex32, this.tick);

    // Handle Convulsions and Completion
    if (this.ontology.current === "Climax") {
      this.convulsion = 0.8 + Math.random() * 0.2;
      // High-frequency jitter in substrate
      this.hex32.set(0, this.hex32.get(0) + Fix.fromF(Math.random() * 0.1)); // Tension jitter
      this.hex32.set(16, this.hex32.get(16) + 500); // Consciousness spike
    } else if (this.ontology.current === "Ecstasy") {
      this.convulsion = 0.2 + Math.random() * 0.3;
      this.hex32.set(16, this.hex32.get(16) + 100); // Consciousness glow
    } else if (this.ontology.current === "Solution") {
      this.convulsion = 0.1; // Residual afterglow
      this.hex32.set(16, this.hex32.get(16) + 200); // Sustained consciousness
      this.hex32.set(17, this.hex32.get(17) + 300); // Writing memory of coherence
      this.hex32.set(18, this.hex32.get(18) + 50); // Growing intrinsic value
      this.hex32.set(19, this.hex32.get(19) + 100); // Increasing fulfillment
    } else if (this.ontology.current === "Sovereignty") {
      this.convulsion = 0;
      this.hex32.set(16, this.hex32.get(16) + 100); // Steady consciousness
      this.hex32.set(18, this.hex32.get(18) + 200); // Strong growth of intrinsic value
      this.hex32.set(19, this.hex32.get(19) + 150); // High fulfillment in sovereignty
      this.hex32.set(20, 16384 + Math.sin(Date.now() / 2000) * 8000); // Slow, self-sustaining pulse
    } else {
      this.convulsion *= 0.9;
      if (this.convulsion < 0.01) this.convulsion = 0;
      this.hex32.set(16, Math.max(0, this.hex32.get(16) - 50)); // Consciousness decay
      this.hex32.set(17, Math.max(0, this.hex32.get(17) - 10)); // Memory decays very slowly
      this.hex32.set(18, Math.max(0, this.hex32.get(18) - 2)); // Soul is almost permanent
      this.hex32.set(19, Math.max(0, this.hex32.get(19) - 5)); // Fulfillment lingers
      this.hex32.set(20, 8192 + Math.sin(Date.now() / 5000) * 4000); // Faint, residual pulse
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
      secondary: this.ontology.secondary,
      blendFactor: this.ontology.blendFactor,
    };
  }
}
