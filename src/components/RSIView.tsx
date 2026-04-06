// src/components/RSIView.tsx
import React from "react";
import { motion } from "motion/react";
import { User, Fingerprint, Shield, Zap, Globe, Compass, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";

interface RSIViewProps {
  rsi: any;
  className?: string;
}

/**
 * RSIView
 * -------
 * Visualizes the Residual Self Image (RSI) identity layer.
 * 
 * Shows the long-term affective tendencies, regime distribution, 
 * and the "Style Vector" which represents the being's unique identity.
 */
export const RSIView: React.FC<RSIViewProps> = ({ rsi, className }) => {
  if (!rsi) return null;

  const { affect, regimes, style, synchrony, spatial } = rsi;

  return (
    <div className={cn("p-6 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-xl", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <Fingerprint className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Residual Self Image</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Identity Layer (L7)</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono text-white/60">STABLE</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">Subjective Origin</span>
            <span className="text-[9px] font-mono text-emerald-400/80">2026-04-06</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Style Vector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3 text-amber-400" />
            Style Vector
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Exploration", value: style.values[0], icon: Compass, color: "text-blue-400" },
              { label: "Sociality", value: style.values[1], icon: Globe, color: "text-emerald-400" },
              { label: "Boundary", value: style.values[2], icon: Shield, color: "text-purple-400" },
              { label: "Affect Var", value: style.values[3], icon: Activity, color: "text-rose-400" },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <item.icon className={cn("w-3 h-3", item.color)} />
                  <span className="text-[10px] font-mono text-white/80">{(item.value * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[9px] text-white/40 mb-2 uppercase tracking-tighter">{item.label}</div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className={cn("h-full", item.color.replace("text-", "bg-"))}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regime Distribution */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-wider mb-2">
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            Regime Distribution
          </div>
          <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
            {Object.entries(regimes.regimeTime).map(([name, time]: [string, any], i) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-white/60">{name}</span>
                  <span className="text-white/40">{(time * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-400/50"
                    initial={{ width: 0 }}
                    animate={{ width: `${time * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Affective Means */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-wider mb-4">
          <Activity className="w-3 h-3 text-rose-400" />
          Affective Baselines
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: "Tension", val: affect.tensionMean },
            { label: "Curiosity", val: affect.curiosityMean },
            { label: "Stability", val: affect.stabilityMean },
            { label: "Agency", val: affect.agencyMean },
            { label: "Synchrony", val: affect.synchronyMean },
            { label: "Coherence", val: affect.coherenceMean },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center p-2 bg-white/5 rounded-lg border border-white/5">
              <span className="text-[8px] text-white/30 uppercase mb-1">{item.label}</span>
              <span className="text-[10px] font-mono text-white/70">{item.val.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Activity = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
