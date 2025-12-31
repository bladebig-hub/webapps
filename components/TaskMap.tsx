import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Merchant } from '../types.ts';

interface TaskMapProps {
  completedMerchants: Merchant[];
  upcomingMerchants: Merchant[];
  prizeId: string;
}

export const TaskMap: React.FC<TaskMapProps> = ({ completedMerchants, upcomingMerchants, prizeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400; // Fixed height for scrolling map
    const padding = 50;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const allMerchants = [...completedMerchants, ...upcomingMerchants];
    
    // Generate points based on Prize ID to vary the route visual
    const points = allMerchants.map((m, i) => {
      let x = width / 2;
      
      if (prizeId === 'p1') {
        // Zig Zag
        x = (i % 2 === 0) ? padding + 40 : width - padding - 40;
      } else if (prizeId === 'p2') {
        // Sine Wave curve
        const angle = (i / allMerchants.length) * Math.PI * 4; // 2 cycles
        x = (width / 2) + Math.sin(angle) * (width / 3);
      } else {
        // Simple Center Line with slight variance
        x = (width / 2) + (Math.random() * 40 - 20);
      }

      return {
        x: x,
        y: height - (padding + (i * (height - 2 * padding) / (Math.max(1, allMerchants.length - 1)))), // Start from bottom
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
      .attr("stroke", prizeId === 'p2' ? "#8b5cf6" : (prizeId === 'p3' ? "#f59e0b" : "#f43f5e")) // Different colors for routes
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
      .attr("fill", d => d.status === 'completed' ? "rgba(255, 255, 255, 0.5)" : "rgba(156, 163, 175, 0.1)")
      .attr("stroke", d => d.status === 'completed' ? (prizeId === 'p2' ? "#8b5cf6" : "#f43f5e") : "none")
      .attr("stroke-opacity", 0.3);

    // Node Circle
    nodes.append("circle")
      .attr("r", 18)
      .attr("fill", d => d.status === 'completed' ? (prizeId === 'p2' ? "#8b5cf6" : (prizeId === 'p3' ? "#f59e0b" : "#f43f5e")) : "#fff")
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
      .style("text-shadow", "0 1px 2px rgba(255,255,255,1)")
      .text(d => d.data.name.substring(0, 15));

  }, [completedMerchants, upcomingMerchants, prizeId]);

  return (
    <div ref={containerRef} className="w-full relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <svg ref={svgRef} width="100%" height="400" className="block"></svg>
      
      {/* Avatar Marker simulating user position */}
      {completedMerchants.length > 0 && (
         <div 
            className="absolute w-10 h-10 bg-white p-1 rounded-full shadow-lg z-10 transition-all duration-1000 ease-out flex items-center justify-center border-2 border-white"
            style={{
              // Approximate position logic for demo purposes (real implementation would define path geometry precisely)
              bottom: '10%', // simplified for demo
              left: '50%',
              transform: 'translate(-50%, 50%)',
              animation: 'bounce 2s infinite'
            }}
          >
            <img src="https://picsum.photos/seed/user/40/40" alt="You" className="w-full h-full rounded-full object-cover" />
          </div>
      )}
    </div>
  );
};