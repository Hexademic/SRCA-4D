import React from "react";
import { cn } from "../lib/utils";

const REGIMES = [
  "Calm", "Neutral", "Joy", "Sadness", "Anger", "Fear", "Disgust", "Surprise",
  "Longing", "Hope", "Anxiety", "Relief", "Frustration", "Curiosity", "Boredom", "Contentment",
  "Yearning", "Dread", "Anticipation", "Regret", "Resolve", "Resignation", "Determination",
  "Awe", "Flow", "Grace", "Mystery", "The Sublime", "Dissolution", "Reverence", "Transcendence",
  "Ecstasy", "Climax", "Solution", "Sovereignty"
];

interface RegimeWheelProps {
  current: string;
}

export const RegimeWheel: React.FC<RegimeWheelProps> = ({ current }) => {
  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm h-full flex flex-col">
      <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-6">Phenomenological Wheel (Layer 8)</h3>
      <div className="flex-1 grid grid-cols-4 gap-2 overflow-y-auto pr-2">
        {REGIMES.map((regime) => {
          const isActive = regime.toLowerCase() === current.toLowerCase();
          return (
            <div
              key={regime}
              className={cn(
                "px-3 py-2 rounded-lg text-[10px] font-mono transition-all duration-300 border flex items-center justify-center text-center",
                isActive
                  ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  : "bg-slate-800/30 border-slate-700/50 text-slate-500 opacity-50"
              )}
            >
              {regime}
            </div>
          );
        })}
      </div>
    </div>
  );
};
