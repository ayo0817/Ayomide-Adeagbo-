import React, { useState, useMemo } from "react";
import { TranscriptSegment } from "../types";
import { Search, User2, Play, Heart, AlertOctagon, HelpCircle, ChevronRight } from "lucide-react";

interface DiarizedTranscriptProps {
  transcript: TranscriptSegment[];
  activeTimestamp: string;
  onSelectSegment: (timestamp: string) => void;
}

export default function DiarizedTranscript({
  transcript,
  activeTimestamp,
  onSelectSegment,
}: DiarizedTranscriptProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter((seg) => seg.text.toLowerCase().includes(q));
  }, [transcript, searchQuery]);

  // Map segment sentiment to clean icons with soft borders matching bento styling
  const getSentimentPill = (score: number) => {
    if (score >= 0.5) return { text: "Positive", style: "border-emerald-500/20 text-emerald-700 bg-emerald-500/5", icon: "😊" };
    if (score <= -0.4) return { text: "Frustration", style: "border-rose-500/20 text-rose-700 bg-rose-500/5", icon: "😡" };
    if (score < 0) return { text: "Hesitation", style: "border-amber-500/20 text-amber-700 bg-amber-500/5", icon: "😟" };
    return { text: "Neutral", style: "border-slate-200 text-slate-500 bg-slate-100/60", icon: "😐" };
  };

  return (
    <div id="diarized-transcript-scroller" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-[520px]">
      {/* Header and Filter search panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            Conversation Diarized Transcript
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Separates dialogue by Speaker A (Salesperson) and Speaker B (Prospect) with instant sentiment indicators.
          </p>
        </div>
        <div className="relative max-w-sm w-full md:w-64 font-sans">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search matching quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-medium text-slate-800"
          />
        </div>
      </div>

      {/* Main Scroller body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {filteredTranscript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400">
            <HelpCircle className="w-8 h-8 text-slate-300 stroke-1.5" />
            <p className="text-xs font-semibold mt-2">No matching dialogue words found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try testing different keywords like &ldquo;price&rdquo; or &ldquo;HubSpot&rdquo;</p>
          </div>
        ) : (
          filteredTranscript.map((segment, index) => {
            const isRep = segment.speaker.includes("Salesperson") || segment.speaker.includes("Speaker A");
            const isActive = segment.timestamp === activeTimestamp;
            const sentimentInfo = getSentimentPill(segment.sentiment);

            return (
              <div
                key={index}
                className={`group flex flex-col transition-all duration-200 border-2 rounded-2xl p-4 cursor-pointer relative ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/[0.03] shadow-sm"
                    : "border-slate-50 hover:border-slate-200 bg-slate-50/30 hover:bg-white"
                }`}
                onClick={() => onSelectSegment(segment.timestamp)}
              >
                {/* Meta details */}
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Speaker Avatars */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        isRep
                          ? "bg-emerald-550/10 text-emerald-700 border border-emerald-500/20 bg-emerald-50"
                          : "bg-sky-50 text-sky-700 border border-sky-450/20 bg-sky-50/50"
                      }`}
                    >
                      {isRep ? "Rep" : "Pro"}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isRep ? "text-emerald-800" : "text-sky-800"
                      }`}
                    >
                      {segment.speaker}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-150/40 border border-slate-200/50 rounded-md px-1.5 py-0.5">
                      {segment.timestamp}
                    </span>
                  </div>

                  {/* Micro Sentiment Pill */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 flex items-center gap-1 min-w-[70px] justify-center ${sentimentInfo.style}`}>
                      <span>{sentimentInfo.icon}</span>
                      <span>{sentimentInfo.text}</span>
                    </span>
                    
                    {/* Timestamp selection actions */}
                    <button
                      className={`p-1 rounded-lg transition-transform ${
                        isActive ? "bg-emerald-500 text-white" : "bg-white text-slate-500 opacity-0 group-hover:opacity-100 border border-slate-200"
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current stroke-0" />
                    </button>
                  </div>
                </div>

                {/* Spoken transcript body */}
                <p className="text-xs font-sans font-medium text-slate-700 leading-relaxed word-break pl-9">
                  {segment.text}
                </p>
                
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer statistics */}
      <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between text-[11px] font-mono text-slate-400">
        <span>Displaying {filteredTranscript.length} of {transcript.length} speech turns</span>
        <span className="font-semibold text-indigo-600 flex items-center gap-1 font-sans">
          Synced Timeline Active <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
