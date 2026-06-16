import React, { useState, useMemo } from "react";
import { SentimentTimelinePoint } from "../types";
import { Sparkles, BarChart2 } from "lucide-react";

interface SentimentGraphProps {
  timeline: SentimentTimelinePoint[];
  activeTimestamp: string;
  onSelectTimestamp: (timestamp: string) => void;
}

export default function SentimentGraph({
  timeline,
  activeTimestamp,
  onSelectTimestamp,
}: SentimentGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const padding = { top: 30, right: 40, bottom: 40, left: 50 };
  const width = 800;
  const height = 240;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate coordinates for SVG paths
  const points = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    return timeline.map((point, index) => {
      const x = padding.left + (index / (timeline.length - 1)) * chartWidth;
      // Flip Y (as SVG 0,0 is top-left, engagement goes 0 to 100)
      const yRep = padding.top + chartHeight - (point.engagementSalesperson / 100) * chartHeight;
      const yPros = padding.top + chartHeight - (point.engagementProspect / 100) * chartHeight;

      return {
        x,
        yRep,
        yPros,
        point,
        index,
      };
    });
  }, [timeline, chartWidth, chartHeight]);

  const paths = useMemo(() => {
    if (points.length === 0) return { repPath: "", prosPath: "" };

    const repCoords = points.map((p) => `${p.x},${p.yRep}`).join(" L ");
    const prosCoords = points.map((p) => `${p.x},${p.yPros}`).join(" L ");

    return {
      repPath: `M ${repCoords}`,
      prosPath: `M ${prosCoords}`,
    };
  }, [points]);

  const activePoint = points.find((p) => p.point.timestamp === activeTimestamp) || null;

  return (
    <div id="sentiment-analysis-graph-widget" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Engagement &amp; Sentiment Graph
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Tracks real-time conversation traction. Click any point to snap the transcript panel to that topic.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-550 bg-emerald-500 rounded inline-block"></span>
            <span className="text-slate-500 font-medium font-sans">Salesperson (Speaker A)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-sky-500 rounded inline-block"></span>
            <span className="text-slate-500 font-medium font-sans">Prospect (Speaker B)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[760px] relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Horizontal Gridlines */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = padding.top + chartHeight - (level / 100) * chartHeight;
              return (
                <g key={level} className="opacity-40">
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400 font-medium"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines with topics */}
            {points.map((p, i) => (
              <line
                key={p.point.timestamp}
                x1={p.x}
                y1={padding.top}
                x2={p.x}
                y2={padding.top + chartHeight}
                stroke="#F1F5F9"
                strokeWidth={p.point.timestamp === activeTimestamp || hoveredIndex === i ? "2" : "1"}
                className="transition-all"
              />
            ))}

            {/* Render Paths with Beautiful Glow effects */}
            {points.length > 0 && (
              <>
                {/* Sales rep path */}
                <path
                  d={paths.repPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-95"
                />
                
                {/* Prospect path */}
                <path
                  d={paths.prosPath}
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-95"
                />
              </>
            )}

            {/* Interactive Areas & Hotspot Markers */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              const isActive = p.point.timestamp === activeTimestamp;
              
              return (
                <g key={p.point.timestamp}>
                  {/* Invisible hotspot bar for easy hover */}
                  <rect
                    x={p.x - chartWidth / (timeline.length * 2)}
                    y={padding.top}
                    width={chartWidth / (timeline.length - 1 || 1)}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectTimestamp(p.point.timestamp)}
                  />

                  {/* Highlights representation dots */}
                  {(isHovered || isActive) && (
                    <>
                      {/* Rep Marker */}
                      <circle
                        cx={p.x}
                        cy={p.yRep}
                        r="6"
                        fill="#10B981"
                        stroke="#FFF"
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                      {/* Prospect Marker */}
                      <circle
                        cx={p.x}
                        cy={p.yPros}
                        r="6"
                        fill="#0EA5E9"
                        stroke="#FFF"
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                    </>
                  )}
                  
                  {/* Default Small Center Anchor Nodes */}
                  <circle cx={p.x} cy={p.yRep} r="2.5" fill="#10B981" className="pointer-events-none" />
                  <circle cx={p.x} cy={p.yPros} r="2.5" fill="#0EA5E9" className="pointer-events-none" />

                  {/* X Axis Labels */}
                  <text
                    x={p.x}
                    y={padding.top + chartHeight + 20}
                    textAnchor="middle"
                    className={`text-[10px] font-mono transition-colors font-medium ${
                      isActive ? "fill-emerald-600 font-bold" : "fill-gray-400"
                    }`}
                  >
                    {p.point.timestamp}
                  </text>

                  {/* Quick stage labels at the top of vertical line */}
                  <text
                    x={p.x}
                    y={padding.top - 10}
                    textAnchor="middle"
                    className={`text-[9px] tracking-tight font-sans transition-all pointer-events-none ${
                      isActive ? "fill-gray-900 font-semibold" : "fill-gray-400 opacity-0 md:opacity-40"
                    }`}
                  >
                    {p.point.topic.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Absolute Tooltip rendering for rich interaction reports */}
          {(hoveredIndex !== null || activePoint) && (
            <div
              className="absolute bg-white border border-gray-100 rounded-xl shadow-xl p-3 max-w-[240px] pointer-events-none transition-all duration-100 z-30"
              style={{
                left: `${
                  (hoveredIndex !== null ? points[hoveredIndex].x : activePoint!.x) - 100
                }px`,
                top: `${padding.top + 10}px`,
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5 mb-1.5">
                <span className="text-[11px] font-mono font-bold text-gray-500">
                  Timeline: {hoveredIndex !== null ? timeline[hoveredIndex].timestamp : activePoint!.point.timestamp}
                </span>
                <span className="text-[10px] py-0.5 px-2 bg-emerald-50 text-emerald-700 font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Convo Step
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-950 mb-2 truncate">
                {hoveredIndex !== null ? timeline[hoveredIndex].topic : activePoint!.point.topic}
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Salesperson:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {hoveredIndex !== null
                      ? timeline[hoveredIndex].engagementSalesperson
                      : activePoint!.point.engagementSalesperson}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Prospect:</span>
                  <span className="font-mono font-bold text-sky-600">
                    {hoveredIndex !== null
                      ? timeline[hoveredIndex].engagementProspect
                      : activePoint!.point.engagementProspect}
                    %
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-emerald-500 text-center font-medium mt-2">
                Click index to snap conversation segment
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
