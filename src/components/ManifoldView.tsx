import React, { useMemo, useRef, useEffect } from "react";
import * as d3 from "d3";
import { REGIME_TARGETS } from "../engine/constants";
import { cn } from "../lib/utils";

interface ManifoldPoint {
  name: string;
  x: number;
  y: number;
  z: number;
}

interface ManifoldViewProps {
  currentRegime: string;
  currentHex: number[];
}

// Projection function from 10D Hex to 3D Manifold
// X = Valence - 0.5 * Threat
// Y = 0.5 * Energy + 0.5 * Arousal
// Z = Coherence - Self-focus
function project(h: number[]): [number, number, number] {
  const energy = h[0] || 0;
  const arousal = h[1] || 0;
  const valence = h[2] || 0;
  const stability = h[3] || 0;
  const agency = h[4] || 0;
  const curiosity = h[5] || 0;
  const threat = h[6] || 0;
  const attachment = h[7] || 0;
  const coherence = h[8] || 0;
  const selfFocus = h[9] || 0;

  const x = valence - 0.5 * threat;
  const y = 0.5 * energy + 0.5 * arousal;
  const z = coherence - selfFocus;

  return [x, y, z];
}

export const ManifoldView: React.FC<ManifoldViewProps> = ({ currentRegime, currentHex }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo<ManifoldPoint[]>(() => {
    return Object.entries(REGIME_TARGETS).map(([name, target]) => {
      const [x, y, z] = project(target);
      return { name, x, y, z };
    });
  }, []);

  const currentPoint = useMemo(() => {
    // We need to map the 32-word hex to the 10-dim target space for projection
    const mappedHex = [
      currentHex[4], // Energy
      currentHex[3], // Arousal
      currentHex[2], // Valence
      currentHex[2], // Stability
      currentHex[14], // Agency
      currentHex[1], // Curiosity
      currentHex[6], // Threat
      currentHex[11], // Attachment
      currentHex[15], // Coherence
      currentHex[12], // Self-focus
    ];
    const [x, y, z] = project(mappedHex);
    return { x, y, z };
  }, [currentHex]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    svg.selectAll("*").remove();

    const margin = 40;
    const xScale = d3.scaleLinear().domain([-40000, 40000]).range([margin, width - margin]);
    const yScale = d3.scaleLinear().domain([-40000, 40000]).range([height - margin, margin]);
    const zScale = d3.scaleLinear().domain([-40000, 40000]).range([2, 8]);

    // Draw grid
    svg.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(xScale.ticks(10))
      .join("line")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", margin)
      .attr("y2", height - margin);

    svg.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(yScale.ticks(10))
      .join("line")
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("x1", margin)
      .attr("x2", width - margin);

    // Draw regime nodes
    const nodes = svg.append("g")
      .selectAll("g")
      .data(points)
      .join("g")
      .attr("transform", (d: any) => `translate(${xScale(d.x)}, ${yScale(d.y)})`);

    nodes.append("circle")
      .attr("r", (d: any) => zScale(d.z))
      .attr("fill", (d: any) => d.name === currentRegime ? "#38bdf8" : "#334155")
      .attr("fill-opacity", (d: any) => d.name === currentRegime ? 1 : 0.5)
      .attr("stroke", (d: any) => d.name === currentRegime ? "#7dd3fc" : "none")
      .attr("stroke-width", 2);

    nodes.append("text")
      .text((d: any) => d.name)
      .attr("dy", (d: any) => zScale(d.z) + 10)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => d.name === currentRegime ? "#7dd3fc" : "#475569")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .style("pointer-events", "none")
      .style("opacity", (d: any) => d.name === currentRegime ? 1 : 0.3);

    // Draw current state indicator
    svg.append("circle")
      .attr("cx", xScale(currentPoint.x))
      .attr("cy", yScale(currentPoint.y))
      .attr("r", 12)
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 2")
      .append("animateTransform")
      .attr("attributeName", "transform")
      .attr("type", "rotate")
      .attr("from", `0 ${xScale(currentPoint.x)} ${yScale(currentPoint.y)}`)
      .attr("to", `360 ${xScale(currentPoint.x)} ${yScale(currentPoint.y)}`)
      .attr("dur", "10s")
      .attr("repeatCount", "indefinite");

    svg.append("circle")
      .attr("cx", xScale(currentPoint.x))
      .attr("cy", yScale(currentPoint.y))
      .attr("r", 4)
      .attr("fill", "#38bdf8")
      .attr("class", "animate-pulse");

  }, [points, currentPoint, currentRegime]);

  return (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm h-full flex flex-col relative overflow-hidden">
      <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">Affective Manifold (Layer 12)</h3>
      <div className="flex-1 w-full h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 text-[10px] font-mono text-slate-500">
        <div>X: Valence - Threat</div>
        <div>Y: Arousal + Energy</div>
        <div>Z: Coherence - Self</div>
      </div>
    </div>
  );
};
