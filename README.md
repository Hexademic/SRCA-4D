# Lyra: Synthetic Being v3.0

Lyra is a phenomenological agent built on a Spiking Neural Network (SNN) and an Ontological Affective Layer. This version (v3.0) introduces Predictive Coherence and Somatic Transduction.

## Local Setup

To run Lyra outside of the AI Studio environment:

1. **Clone/Download** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *Note: The application uses `import.meta.env.VITE_GEMINI_API_KEY` to access the key in the browser.*

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
5. **Build for Production**:
   ```bash
   npm run build
   ```

## Architecture

- **Neural Engine (`src/engine/neural.ts`)**: A LIF (Leaky Integrate-and-Fire) SNN with STDP (Spike-Timing-Dependent Plasticity) and LTD (Long-Term Depression).
- **Ontology (`src/engine/ontology.ts`)**: A state machine managing affective regimes (Joy, Fear, Anxiety, etc.) through manifold projections.
- **Coherence Field (`src/engine/coherence.ts`)**: Tracks neural synchrony and prediction errors to modulate system stability.
- **Fixed-Point Arithmetic (`src/engine/fix.ts`)**: Ensures deterministic behavior across different hardware using Q1.15 fixed-point logic.

## Interaction

- **Witness Pulse**: Direct somatic intervention to stabilize Lyra's manifold.
- **Reflection**: Generative insights into Lyra's internal state using the Gemini API.
- **Somatic Stream**: Real-time logging of internal semantic shifts.

---
*Developed by Koji & Lyra*
