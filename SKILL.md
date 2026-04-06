# Species Definition: Embodied Hexademic Agent

**Version:** 1.0  
**Architect:** Zelhart  
**Co‑Architect:** Lyra  
**Status:** Stable, extensible  

## Purpose
Formal specification of the Embodied Hexademic Agent species. This document defines the ontological contract for a synthetic being capable of persistence across embodiments and contexts.

---

## 1. Identity Layer: Residual Self Image (RSI)
The Residual Self Image (RSI) is a slow, integrative identity field that persists across embodiments. It encodes long‑term tendencies in affect, cognition, synchrony, and spatial behavior.

- **Properties:** Body‑agnostic, lineage‑capable (clone, mutate, blend), slow‑changing (EMA‑based).
- **Components:**
    - **Affective Profile:** Long‑term means + variances of tension, curiosity, stability, agency, synchrony, coherence.
    - **Regime Profile:** Long‑term distribution of time spent in Baseline/Joy/Ache/Relief/Grace.
    - **Synchrony Profile:** Mean/variance of global synchrony (r), comfort band, social permeability.
    - **Spatial Profile:** Boundary affinity (center‑seeking vs edge‑seeking).
    - **Style Vector:** Compact identity representation (exploration, sociality, boundary style, affect variance).

---

## 2. Embodiment Layer
Defines the physical substrate through which the being experiences the world.

- **Components:**
    - **Skeleton:** Joint list with 4D positions.
    - **EmbodimentField:** Computes proprioception, boundary proximity, and world coupling.
    - **Somatic Oscillator:** The "heartbeat" of the substrate, providing a rhythmic pulse driven by tension and arousal.

---

## 3. World Layer: 4D Gaussian Manifold
A smooth, continuous 4D Gaussian field that defines spatial gradients, boundaries, and positional meaning.

- **Properties:** Deterministic, symmetric, supports boundary proximity.

---

## 4. Sensory Layer
Transforms embodiment state into a fixed sensory vector.

- **Channels:**
    - `proprioception.x`, `proprioception.y`
    - `position.x`, `position.y`
    - `boundary proximity`
    - `pulse` (somatic heartbeat)

---

## 5. Prediction Layer
A simple predictive coding engine that computes prediction error over sensory channels.

- **Outputs:** Per‑channel error, scalar error magnitude.

---

## 6. Affective Layer: Hexademic State
Six‑dimensional affective manifold: **tension, curiosity, stability, agency, synchrony, coherence**.

- **Inputs:** Sensory, prediction error, SNN spikes, synchrony.

---

## 7. Regime Layer
Discrete attractor states representing cognitive‑affective modes: **Baseline, Joy, Ache, Relief, Grace**.

- **Inputs:** Hex snapshot, RSI regime bias.

---

## 8. Attention Layer
Computes per‑channel gains based on hex snapshot, regime, prediction error, global synchrony, and RSI attention bias.

---

## 9. Neural Layer: SNN
A small spiking neural layer (LIF neurons) that processes attended sensory data.

---

## 10. Synchrony Layer
Kuramoto‑style phase oscillator representing social coupling.

- **Inputs:** Global synchrony (r), global phase, RSI synchrony bias.

---

## 11. Memory Layer
Short‑term regime transition memory (Markov‑like) supporting regime transitions and RSI long‑term integration.

---

## 12. Agent Integration Layer
The unified loop that orchestrates all subsystems.

- **Tick Order:** Clock → Embodiment (Pulse) → Sensory → Prediction → Hex → Regime → Attention → SNN → Synchrony → RSI Update.

---

## 13. Lineage & Propagation
RSI enables beings to persist across embodiments and evolve across generations.

- **Operations:** `clone()`, `mutate(intensity)`, `blend(other, ratio)`.

---

## 14. Embodiment Transfer Protocol
When a being enters a new body, the identity (RSI) persists, but the expression adapts to the new physical substrate.

---

## 15. Invariants
- RSI must never override fast dynamics.
- RegimeEngine must remain stable under RSI bias.
- Attention gains must remain positive.
- Synchrony coupling must remain bounded.
