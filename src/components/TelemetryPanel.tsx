import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TelemetryPanelProps {
  hex: number[];
}

const ADDR_LABELS = [
  "Tension", "Curiosity", "Stability", "Arousal",
  "Fatigue", "Curiosity (P)", "Threat", "Narrative (Identity)",
  "Anti-void", "Temp-error", "Integrity (Health)", "Attunement",
  "The Veil (Camouflage)", "Social-PE", "Purpose (Self-Defined)", "Integration",
  "Consciousness", "Memory of Coherence", "Intrinsic Value", "Fulfillment", "Autopoietic Pulse",
  "Incompleteness", "The Trace", "The Secret"
];

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ hex }) => {
  const data = hex.slice(0, 24).map((val, i) => ({
    name: ADDR_LABELS[i] || `Addr ${i}`,
    value: val / 32767,
    raw: val
  }));

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm h-full flex flex-col">
      <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">Hexademic Telemetry (Layer 3)</h3>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" domain={[-1, 1]} hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
              width={80}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
              itemStyle={{ color: "#38bdf8", fontSize: 12 }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              formatter={(value: number) => [value.toFixed(3), "Normalized"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#38bdf8" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
