import React from "react";
import { CoachingCard } from "../types";
import { Sparkles, CheckCircle2, AlertCircle, Award, Target, HelpCircle, MessageSquare } from "lucide-react";

interface CoachingCardProps {
  coachingData: CoachingCard;
}

export default function CoachingCardComponent({ coachingData }: CoachingCardProps) {
  const { strengths, missedOpportunities, overallScore, summary, keyMetrics } = coachingData;

  // Custom coloring based on overall audit scores in dark slate theme
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", stroke: "#10B981" };
    if (score >= 80) return { text: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", stroke: "#14B8A6" };
    if (score >= 70) return { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", stroke: "#F59E0B" };
    return { text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", stroke: "#F43F5E" };
  };

  const statusColors = getScoreColor(overallScore);

  return (
    <div id="ai-coaching-card-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl text-white">
      {/* Column 1: Main Metric Summary & Metrics */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Diagnostic</span>
            <div className="p-2 rounded-xl bg-white/10 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          
          {/* Dial and Score */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#1E293B"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={statusColors.stroke}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                  {overallScore}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">out of 100</span>
              </div>
            </div>
            
            <span className={`text-xs font-bold px-3 py-1 mt-4 rounded-full border ${statusColors.bg} ${statusColors.text}`}>
              {overallScore >= 90 ? "Excellent Pitch" : overallScore >= 80 ? "Above Standard" : "Development Priority"}
            </span>
          </div>

          <p className="text-xs text-slate-300 italic leading-relaxed text-center px-2 mt-4">
            &ldquo;{summary}&rdquo;
          </p>
        </div>

        {/* Talk-Listen Balance scale */}
        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Talk vs Listen Ratio
            </span>
            <span className="font-mono font-bold text-slate-200">
              {keyMetrics.talkRatioSales}% Rep / {100 - keyMetrics.talkRatioSales}% Customer
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            {/* Sales Rep Portion */}
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${keyMetrics.talkRatioSales}%` }}
            />
            {/* Prospect Portion */}
            <div
              className="h-full bg-sky-400 transition-all duration-1000"
              style={{ width: `${100 - keyMetrics.talkRatioSales}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
            <span>Ideal range: 45% - 55% rep</span>
            <span className="font-semibold text-emerald-400">
              {keyMetrics.talkRatioSales >= 45 && keyMetrics.talkRatioSales <= 55 ? "Perfect Equilibrium" : "Unbalanced"}
            </span>
          </div>
        </div>
      </div>

      {/* Column 2: Strengths (3 Things Did Well) */}
      <div id="sales-call-strengths-card" className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Wins &amp; Strengths (3)
            </h3>
            <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">Passed Audits</span>
          </div>
          
          <div className="space-y-4">
            {strengths.map((strength, index) => (
              <div key={index} className="flex gap-3 start">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed word-break">
                  {strength}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Execution Rings */}
        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-slate-500" />
            Conversion Effectiveness
          </h4>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] font-sans font-medium mb-1">
                <span className="text-slate-400">Discovery Mastery</span>
                <span className="font-mono font-bold text-slate-200">{keyMetrics.needsDiscovery}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${keyMetrics.needsDiscovery}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-sans font-medium mb-1">
                <span className="text-slate-400">Objection Shielding</span>
                <span className="font-mono font-bold text-slate-200">{keyMetrics.objectionHandling}/100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${keyMetrics.objectionHandling}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Missed Opportunities (3 Area for Improvement) */}
      <div id="sales-call-opportunities-card" className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Opportunities (3)
            </h3>
            <span className="text-[10px] bg-rose-500/15 border border-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded-full">Needs Training</span>
          </div>

          <div className="space-y-4">
            {missedOpportunities.map((opportunity, index) => (
              <div key={index} className="flex gap-3 start">
                <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed word-break">
                  {opportunity}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Coaching Block */}
        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Actionable Target Steps
            </h4>
            <div className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1">
              Closing Index: <span className="font-extrabold">{keyMetrics.closingAttempt}/100</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/40">
            <p className="text-[11.5px] text-slate-200 font-medium leading-relaxed">
              <strong>Rep advice:</strong> Focus on bridging the objection directly to custom contracts. Avoid &ldquo;sending emails later&rdquo; in favor of instant live calendar invitations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
