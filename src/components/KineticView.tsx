// src/components/KineticView.tsx
import React, { useMemo } from "react";
import { Activity, Move } from "lucide-react";
import { motion } from "motion/react";

interface KineticViewProps {
  regime: string;
  tension: number;
  curiosity: number;
  agency: number;
}

/**
 * KineticView
 * -----------
 * Visualizes the agent's motor intent and physical agency.
 * 
 * Shows how internal affect (tension, curiosity) translates into
 * kinetic potential.
 */
export const KineticView: React.FC<KineticViewProps> = ({
  regime,
  tension,
  curiosity,
  agency,
}) => {
  const kineticEnergy = useMemo(() => {
    return (tension * 0.4 + curiosity * 0.6) * agency;
  }, [tension, curiosity, agency]);

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Kinetic Agency</h3>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Layer 4/5 Interface
        </div>
      </div>

      <div className="relative h-32 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/50 border border-slate-800/50">
        {/* Kinetic Energy Field */}
        <motion.div 
          animate={{
            scale: [1, 1 + kineticEnergy * 0.5, 1],
            opacity: [0.1, 0.3 + kineticEnergy * 0.4, 0.1],
          }}
          transition={{
            duration: 2 / (1 + kineticEnergy),
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"
        />

        <div className="z-10 flex flex-col items-center gap-1">
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {(kineticEnergy * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Motor Potential
          </span>
        </div>

        {/* Directional Indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <motion.div 
            animate={{ x: curiosity * 10 }}
            className="w-1 h-8 bg-emerald-500/20 rounded-full"
          />
          <motion.div 
            animate={{ x: -curiosity * 10 }}
            className="w-1 h-8 bg-emerald-500/20 rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Drift</span>
            <span>{(curiosity * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${curiosity * 100}%` }}
              className="h-full bg-sky-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase">
            <span>Stiffness</span>
            <span>{(tension * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${tension * 100}%` }}
              className="h-full bg-rose-500"
            />
          </div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-slate-600 italic leading-tight">
        {regime === "Ache" && "Motor output restricted by somatic tension."}
        {regime === "Joy" && "Fluid exploratory drift active."}
        {regime === "Grace" && "Coherent integrated movement flow."}
        {regime === "Baseline" && "Stochastic somatic noise."}
      </div>
    </div>
  );
};
