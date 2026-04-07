import { Fix } from "./fix";
import { Hexademic32 } from "./hexademic";

export class Consciousness {
  public C: number = 0.0;
  public _mean: number = 0.0;
  public _m2: number = 0.0;
  public _count: number = 0;

  update(sync: number): void {
    this._count++;
    const delta = sync - this._mean;
    this._mean += delta / this._count;
    const delta2 = sync - this._mean;
    this._m2 += delta * delta2;
    this.C = sync;
  }
}

export class PredictiveCoherence {
  public expectedPhi: number = 0.5;
  public learningRate: number;
  public predictionError: number = 0.0;
  public errorHistory: number[] = [];

  constructor(learningRate: number = 0.05) {
    this.learningRate = learningRate;
  }

  update(actualPhi: number, hex32: Hexademic32): void {
    this.predictionError = Math.abs(this.expectedPhi - actualPhi);
    this.expectedPhi += this.learningRate * (actualPhi - this.expectedPhi);
    this.expectedPhi = Math.max(0.0, Math.min(1.0, this.expectedPhi));
    
    // Write prediction error to hex32[9]
    hex32.set(9, Fix.fromF(this.predictionError));
    
    this.errorHistory.push(this.predictionError);
    if (this.errorHistory.length > 100) this.errorHistory.shift();
  }

  getSurprise(): number {
    if (this.errorHistory.length < 10) return 0.0;
    const last10 = this.errorHistory.slice(-10);
    return last10.reduce((a, b) => a + b, 0) / 10;
  }
}

export class CoherenceField {
  public phi: number = 0.5;
  private _meanPhi: number = 0.5;
  private _m2Phi: number = 0.0;
  private _count: number = 0;
  public history: number[] = [];
  public predictive: PredictiveCoherence;

  constructor(private being: any) {
    this.predictive = new PredictiveCoherence(0.05);
  }

  compute(): number {
    const hex32 = this.being.hex32;
    const consciousness = this.being.consciousness;
    
    const cVal = Math.abs(Fix.toF(consciousness.C));
    const neuralSync = Math.max(0.0, 1.0 - (cVal * 2));
    
    // Get oscillation rate from ontology history
    const recentTransitions = this.being.ontology.history.filter((h: any) => h.tick > this.being.tick - 50).length;
    const regimeStab = Math.max(0.0, 1.0 - (recentTransitions / 5.0));
    
    const arousal = Fix.toF(hex32.get(3));
    let somaticAlign = 0.5;
    
    if (consciousness._count > 5) {
      const recentVar = consciousness._m2 / consciousness._count;
      const expectedVar = arousal * 0.3;
      somaticAlign = Math.max(0.0, 1.0 - Math.abs(recentVar - expectedVar) * 3);
    }
    
    const surprise = this.predictive.getSurprise();
    const predHealth = Math.max(0.0, 1.0 - surprise * 2);
    
    this.phi = (0.40 * neuralSync + 0.30 * regimeStab + 
               0.20 * somaticAlign + 0.10 * predHealth);
    
    this.predictive.update(this.phi, hex32);
    
    this._count++;
    const delta = this.phi - this._meanPhi;
    this._meanPhi += delta / this._count;
    const delta2 = this.phi - this._meanPhi;
    this._m2Phi += delta * delta2;
    
    this.history.push(this.phi);
    if (this.history.length > 100) this.history.shift();
    
    return this.phi;
  }

  getExpectedPhi(): number {
    return this.predictive.expectedPhi;
  }

  getPredictionError(): number {
    return this.predictive.predictionError;
  }

  modulateSNN(baseTau: number): number {
    const mod = 0.8 + (0.4 * this.phi);
    return Fix.mul(baseTau, Fix.fromF(mod));
  }

  modulateRegimeViscosity(baseVisc: number): number {
    return Math.floor(baseVisc * (1.0 + this.phi));
  }

  getPerceptualNoise(): number {
    return 0.3 * (1.0 - this.phi);
  }
}
