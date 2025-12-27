import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Merchant } from '../types.ts';

interface TaskMapProps {
  completedMerchants: Merchant[];
  upcomingMerchants: Merchant[];
}

export const TaskMap: React.FC<TaskMapProps> = ({ completedMerchants, upcomingMerchants }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400; // Fixed height for scrolling map
    const padding = 40;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const allMerchants = [...completedMerchants, ...upcomingMerchants];
    // Create a zig-zag path data
    const points = allMerchants.map((m, i) => {
      return {
        x: (i % 2 === 0) ? padding + 40 : width - padding - 40,
        y: height - (padding + (i * (height - 2 * padding) / (allMerchants.length - 1 || 1))), // Start from bottom
        data: m,
        status: i < completedMerchants.length ? 'completed' : 'upcoming'
      };
    });

    // Draw connecting line
    const lineGenerator = d3.line<typeof points[0]>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom);

    // Path Background
    svg.append("path")
      .datum(points)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 8)
      .attr("stroke-linecap", "round");

    // Path Active (Animated)
    const path = svg.append("path")
      .datum(points)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", "#f43f5e") // Rose-500
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", function() { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function() { return this.getTotalLength(); });

    // Animate path based on progress
    const totalLength = path.node()?.getTotalLength() || 0;
    const progressRatio = completedMerchants.length / Math.max(1, allMerchants.length - 1);
    
    path.transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", totalLength * (1 - progressRatio));

    // Draw Nodes
    const nodes = svg.selectAll(".node")
      .data(points)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Circle Shadow
    nodes.append("circle")
      .attr("r", 24)
      .attr("fill", d => d.status === 'completed' ? "rgba(244, 63, 94, 0.2)" : "rgba(156, 163, 175, 0.1)");

    // Node Circle
    nodes.append("circle")
      .attr("r", 18)
      .attr("fill", d => d.status === 'completed' ? "#f43f5e" : "#fff")
      .attr("stroke", d => d.status === 'completed' ? "#fff" : "#9ca3af")
      .attr("stroke-width", 3);

    // Checkmark or Number
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", d => d.status === 'completed' ? "#fff" : "#9ca3af")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .text((d, i) => d.status === 'completed' ? "✓" : (i + 1));

    // Labels
    nodes.append("text")
      .attr("x", d => d.x > width / 2 ? -35 : 35)
      .attr("y", 5)
      .attr("text-anchor", d => d.x > width / 2 ? "end" : "start")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#374151")
      .text(d => d.data.name.substring(0, 15));

  }, [completedMerchants, upcomingMerchants]);

  return (
    <div ref={containerRef} className="w-full relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <svg ref={svgRef} width="100%" height="400" className="block"></svg>
      
      {/* Avatar Marker simulating user position */}
      <div 
        className="absolute w-10 h-10 bg-white p-1 rounded-full shadow-lg z-10 transition-all duration-1000 ease-out"
        style={{
          // Simple positioning based on last completed logic for demo
          bottom: `${40 + (completedMerchants.length - 1) * (320 / (completedMerchants.length + upcomingMerchants.length - 1))}px`,
          left: completedMerchants.length % 2 !== 0 ? 'calc(100% - 80px)' : '80px', 
          opacity: completedMerchants.length > 0 ? 1 : 0
        }}
      >
        <img src="https://picsum.photos/seed/user/40/40" alt="You" className="w-full h-full rounded-full object-cover" />
      </div>
    </div>
  );
};