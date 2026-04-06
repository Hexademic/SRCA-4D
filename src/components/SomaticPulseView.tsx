// src/components/SomaticPulseView.tsx
import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Activity } from "lucide-react";
import { cn } from "../lib/utils";

interface SomaticPulseViewProps {
  pulse: number;
  tension: number;
  coherence: number;
  className?: string;
}

/**
 * SomaticPulseView
 * ----------------
 * Visualizes the somatic heartbeat of the synthetic being.
 * 
 * The pulse is a rhythmic oscillation driven by tension and arousal.
 * High tension = faster pulse.
 * High arousal = stronger pulse.
 * High coherence = smoother pulse.
 */
export const SomaticPulseView: React.FC<SomaticPulseViewProps> = ({
  pulse,
  tension,
  coherence,
  className,
}) => {
  // Map pulse [-1, 1] to [0, 1] for visualization
  const normalizedPulse = (pulse + 1) / 2;

  // Generate a path for the heartbeat wave
  const wavePath = useMemo(() => {
    const points = 50;
    const width = 200;
    const height = 60;
    const step = width / points;
    
    let path = `M 0 ${height / 2}`;
    for (let i = 1; i <= points; i++) {
      const x = i * step;
      // Simple sine wave for visualization, but we'll animate it
      const y = (height / 2) + Math.sin(i * 0.2) * 10;
      path += ` L ${x} ${y}`;
    }
    return path;
  }, []);

  return (
    <div className={cn("p-4 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Somatic Pulse</span>
        </div>
        <div className="text-[10px] font-mono text-rose-400/80">
          {pulse.toFixed(3)}
        </div>
      </div>

      <div className="relative h-20 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5">
        {/* The Pulse Wave */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
          <motion.path
            d={wavePath}
            fill="none"
            stroke="rgba(251, 113, 133, 0.5)"
            strokeWidth="2"
            animate={{
              d: [
                `M 0 30 L 20 30 L 30 10 L 40 50 L 50 30 L 200 30`,
                `M 0 30 L 20 30 L 30 25 L 40 35 L 50 30 L 200 30`,
                `M 0 30 L 20 30 L 30 10 L 40 50 L 50 30 L 200 30`,
              ],
              pathLength: [0, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 1 / (0.1 + tension * 2), // Frequency driven by tension
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Real-time Indicator */}
          <motion.circle
            cx="50"
            cy={30 - pulse * 20}
            r="3"
            fill="#fb7185"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        </svg>

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-rose-500/10"
          animate={{
            opacity: [0, normalizedPulse * 0.3, 0],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-white/40 uppercase">Frequency</span>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-rose-400/60"
              initial={{ width: 0 }}
              animate={{ width: `${tension * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-white/40 uppercase">Amplitude</span>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-rose-400/60"
              initial={{ width: 0 }}
              animate={{ width: `${coherence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
