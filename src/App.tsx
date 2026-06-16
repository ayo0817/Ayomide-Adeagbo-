import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Mic,
  MicOff,
  CloudLightning,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Volume2,
  Clock,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import SentimentGraph from "./components/SentimentGraph";
import CoachingCardComponent from "./components/CoachingCardComponent";
import DiarizedTranscript from "./components/DiarizedTranscript";
import { SalesCallAnalysis, SampleCall } from "./types";

const SAMPLES: SampleCall[] = [
  { id: "tech-demo", title: "Enterprise HubSpot CRM Demo", duration: "4m 12s", filename: "SaaS_Enterprise_Demo_Q3.mp3" },
  { id: "product-inquiry", title: "Retail Inventory API Consult", duration: "3m 24s", filename: "Inbound_Lead_Retail_API.mp3" },
  { id: "tricky-negotiation", title: "High-Value Enterprise SLA Renewal", duration: "4m 45s", filename: "Renewal_Negotiation_Custom_Retail.mp3" }
];

export default function App() {
  // Analytical state loaders
  const [activeAnalysis, setActiveAnalysis] = useState<SalesCallAnalysis | null>(null);
  const [activeMeta, setActiveMeta] = useState<{ title: string; filename: string; duration: string } | null>(null);
  
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<string>("00:00");

  // Microphone state loaders
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // File drag states
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Sync clicked sentiment node timeline timestamps
  const handleSelectTimestamp = (timestamp: string) => {
    setActiveTimestamp(timestamp);
    // Find the closest transcript segment element and scroll to it smoothly
    const container = document.getElementById("diarized-transcript-scroller");
    if (container) {
      // Find segments matching this timestamp or nearby seconds
      const textBlock = Array.from(container.querySelectorAll("span")).find(
        (span) => span.textContent === timestamp
      );
      if (textBlock) {
        textBlock.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Convert timer seconds to readable timing
  const formatSeconds = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Live simulation and preloaded sample fetch
  const handleLoadSample = async (id: string) => {
    setLoading(true);
    setError(null);
    setSelectedSampleId(id);
    setLoadingStatus(`Retrieving audit parameters for sample '${id}'...`);
    
    try {
      // 1-second visual suspense
      await new Promise((resolve) => setTimeout(resolve, 800));
      const response = await fetch(`/api/samples/${id}`);
      if (!response.ok) {
        throw new Error("Could not download template call dataset.");
      }
      const data = await response.json();
      
      setActiveAnalysis(data.analysis);
      setActiveMeta({
        title: data.title,
        filename: data.filename,
        duration: data.duration
      });
      
      // Set initial timeline view
      if (data.analysis.sentimentTimeline?.length > 0) {
        setActiveTimestamp(data.analysis.sentimentTimeline[0].timestamp);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred retrieving data.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  // Handle uploaded audio files
  const handleAudioUpload = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio format (.mp3, .wav, .m4a etc.).");
      return;
    }
    setError(null);
    setLoading(true);
    setLoadingStatus("Hashing audio track and preparing cloud upload payload...");

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onloadend = async () => {
      try {
        const base64withHeader = fileReader.result as string;
        const base64Data = base64withHeader.split(",")[1];
        
        setLoadingStatus("Triggering Gemini 3.5 Flash conversational diarization model...");
        const response = await fetch("/api/analyze-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: file.type,
            filename: file.name
          })
        });

        if (!response.ok) {
          throw new Error("Server failed to parse conversational analysis from track.");
        }

        const data = await response.json();
        
        setActiveAnalysis(data.analysis);
        setActiveMeta({
          title: `Coaching Feed: ${file.name.replace(/\.[^/.]+$/, "")}`,
          filename: file.name,
          duration: data.simulated ? "1m 30s" : "Dynamic Audit"
        });

        if (data.analysis.sentimentTimeline?.length > 0) {
          setActiveTimestamp(data.analysis.sentimentTimeline[0].timestamp);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error processing Gemini analysis. Verify your workspace keys or upload limits.");
      } finally {
        setLoading(false);
        setLoadingStatus("");
      }
    };
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioUpload(e.dataTransfer.files[0]);
    }
  };

  // Microphone capture implementation
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        
        // Convert to base64 immediately for analysis
        analyzeBlobDirect(audioBlob);
        
        // Stop all track devices
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      setRecordingSeconds(0);
      mediaRecorder.start();

      // Start custom 1s timer loop
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError("Could not access your microphone. Please enable frame audio permissions inside metadata or browser options.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const analyzeBlobDirect = (blob: Blob) => {
    setLoading(true);
    setLoadingStatus("Decoding live recorded audio frame pipeline...");
    
    const fileReader = new FileReader();
    fileReader.readAsDataURL(blob);
    fileReader.onloadend = async () => {
      try {
        const base64Data = (fileReader.result as string).split(",")[1];
        
        setLoadingStatus("Running diarized speech-to-text with Gemini -3.5-flash...");
        
        const response = await fetch("/api/analyze-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: "audio/webm",
            filename: "Mic_Session_Voice.webm",
            recordingDuration: recordingSeconds
          })
        });

        if (!response.ok) {
          throw new Error("Syllables processing error.");
        }

        const data = await response.json();
        
        setActiveAnalysis(data.analysis);
        setActiveMeta({
          title: `Consultation Stream: Voice Record #${Math.floor(Math.random() * 900 + 100)}`,
          filename: "Mic_Session_Voice.webm",
          duration: `${Math.floor(recordingSeconds / 60)}m ${recordingSeconds % 60}s`
        });

        if (data.analysis.sentimentTimeline?.length > 0) {
          setActiveTimestamp(data.analysis.sentimentTimeline[0].timestamp);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error uploading live voice segments. Check internet status or API secrets.");
      } finally {
        setLoading(false);
        setLoadingStatus("");
      }
    };
  };

  const resetDashboard = () => {
    setActiveAnalysis(null);
    setActiveMeta(null);
    setSelectedSampleId("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased p-4 sm:p-6 md:p-8">
      {/* Upper Navigation Rail */}
      <header className="sticky top-0 bg-white border border-slate-200 py-4 px-6 md:px-12 z-40 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-600/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Chorus.AI Style Coaching
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-sans">
              AI Conversational Diagnostic Dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Active backend node status indicator */}
          <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wide font-sans">
              Intelligence Node Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-0 space-y-6">
        
        {/* Onboarding Wizard view if no analysis active */}
        {!activeAnalysis && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4"
          >
            {/* Left side: Hero call for action */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <span className="text-[11px] uppercase bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold px-3 py-1.5 rounded-full inline-block">
                  Instant Sales Audit Engine
                </span>
                
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight">
                  Calibrate your pitches. <br className="hidden md:inline" /> Secure high-value deals with confidence.
                </h2>
                
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Improve sales conversion metrics automatically. Upload actual sales call audio or record a mock pitch live. Gemini partitions speakers, maps dynamic consumer sentiment dip trends, and drafts structured 3x3 coaching audits instantly.
                </p>

                {/* Bullet guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-indigo-600 font-bold font-mono">1</div>
                    <span className="text-slate-700">Diarized Transcript</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-indigo-600 font-bold font-mono">2</div>
                    <span className="text-slate-700">Sentiment Dip Graph</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-indigo-600 font-bold font-mono">3</div>
                    <span className="text-slate-700">Coaching Performance</span>
                  </div>
                </div>
              </div>

              {/* Upload or microphone trigger section */}
              <div className="border-t border-slate-100 pt-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* File Upload drag card */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-indigo-600 bg-indigo-50/20"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                  }`}
                  onClick={() => document.getElementById("audio-file-selector")?.click()}
                >
                  <input
                    id="audio-file-selector"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-800">Upload Sales Audio</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">Drag &amp; drop or click to browse</span>
                </div>

                {/* Mic Record card */}
                <div className="bg-slate-50/50 border-2 border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center relative">
                  {isRecording ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-xs font-bold text-red-600">Recording Live...</span>
                      </div>
                      <span className="text-2xl font-mono font-extrabold text-slate-900 block tracking-tight">
                        {formatSeconds(recordingSeconds)}
                      </span>
                      <button
                        onClick={stopRecording}
                        className="py-1.5 px-4 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition"
                      >
                        Stop &amp; Analyze Pitch
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Mic className="w-8 h-8 text-emerald-500 mb-2 cursor-pointer hover:scale-105 transition-transform" onClick={startRecording} />
                      <span className="text-xs font-bold text-slate-800">Live Practice Recorder</span>
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">Speak into mic to test voice</span>
                      <button
                        onClick={startRecording}
                        className="mt-3 py-1 px-4 border border-slate-300 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white transition"
                      >
                        Start Live Stream
                      </button>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Optional Error display diagnostics */}
              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status Error</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: quick simulation catalog */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sandbox Playground</h3>
                <h4 className="text-lg font-bold text-slate-950 mb-1 leading-tight">Preloaded Enterprise Sales Calls</h4>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  No active sales call recording on hand? Run immediate high-fidelity diagnostics using our preloaded sample dataset matrix.
                </p>

                 <div className="space-y-4">
                  {SAMPLES.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleLoadSample(sample.id)}
                      className="w-full text-left p-4 rounded-3xl border border-slate-200 hover:border-indigo-650 hover:border-indigo-600 bg-slate-50/60 hover:bg-indigo-500/[0.03] transition-all flex justify-between items-center group cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          {sample.title}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sample.duration}
                          </span>
                          <span>&bull;</span>
                          <span>{sample.filename}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Note on simulation integrity */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed font-sans">
                <Info className="w-4 h-4 text-indigo-550 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> These models execute structural schema compliance rules to layout perfect sentiment node trends. Perfect for executive walkthrough evaluations.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Global Loading Spinner View */}
        {loading && (
          <div className="min-h-[400px] bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              {/* Outer halo */}
              <div className="absolute w-full h-full rounded-full border-4 border-slate-100"></div>
              {/* Spinning sweep */}
              <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
              <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
            
            <h3 className="text-md font-bold text-slate-950 mb-1">
              Analyzing call segments...
            </h3>
            <p className="text-xs text-slate-500 font-mono max-w-md bg-slate-50 border border-slate-150 rounded-xl px-4 py-2 mt-2">
              {loadingStatus || "Decoding voice waveform buffers..."}
            </p>
            
            {/* Visual supportive quotes */}
            <p className="text-[10px] text-slate-400 italic max-w-sm mt-8">
              &ldquo;Diarizing speaker roles, scoring utterance sentiment levels, and computing talk-to-listen ratios with Google Gemini&rdquo;
            </p>
          </div>
        )}

        {/* Loaded Main Dashboard State */}
        {activeAnalysis && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pt-2"
          >
            {/* Context breadcrumb & Switch back controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center border border-indigo-100/50">
                  <FileCheck className="w-5 h-5 stroke-2" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider font-mono">Conversational Diagnostics Active</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-1.5 py-0.5 rounded">
                      {activeMeta?.duration}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-950 mt-0.5">
                    {activeMeta?.title}
                  </h2>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={resetDashboard}
                  className="py-1.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Analyze Another Call
                </button>
              </div>
            </div>

            {/* Dashboard Row 1: The Interactive Sentiment Dip Graph */}
            <SentimentGraph
              timeline={activeAnalysis.sentimentTimeline}
              activeTimestamp={activeTimestamp}
              onSelectTimestamp={handleSelectTimestamp}
            />

            {/* Dashboard Row 2: Grid linking Diarized Transcript and score Coaching Card */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Diarized Transcript (7 Columns Wide on Large Desktop) */}
              <div className="xl:col-span-7">
                <DiarizedTranscript
                  transcript={activeAnalysis.transcript}
                  activeTimestamp={activeTimestamp}
                  onSelectSegment={handleSelectTimestamp}
                />
              </div>

              {/* Coaching Feedback summary metrics overview (5 columns wide) with Premium dark bento card styling */}
              <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-[520px] overflow-y-auto scrollbar-thin flex flex-col justify-between text-white">
                <div>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      Executive Coaching Briefing
                    </h3>
                    <span className="text-[10px] bg-white/10 border border-white/5 font-mono text-slate-200 font-bold px-2 py-0.5 rounded-full">
                      Overall Score: {activeAnalysis.coaching.overallScore}/100
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Overall Summary sentence block */}
                    <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed italic">
                      &ldquo;{activeAnalysis.coaching.summary}&rdquo;
                    </div>

                    {/* Simple summary numbers */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/15">
                        <span className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wide block">Key Strengths</span>
                        <span className="text-lg font-bold block mt-1 text-slate-100 font-mono">3 Highlights</span>
                      </div>
                      <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/15">
                        <span className="text-[10.5px] font-bold text-rose-400 uppercase tracking-wide block">Remediations</span>
                        <span className="text-lg font-bold block mt-1 text-slate-100 font-mono">3 Opportunities</span>
                      </div>
                    </div>

                    {/* Metric benchmarks overview */}
                    <div className="space-y-3.5 pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Agreement Closing Attempt</span>
                        <span className="font-mono font-bold text-slate-200">{activeAnalysis.coaching.keyMetrics.closingAttempt}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeAnalysis.coaching.keyMetrics.closingAttempt}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Objection Buffer Handling</span>
                        <span className="font-mono font-bold text-slate-200">{activeAnalysis.coaching.keyMetrics.objectionHandling}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activeAnalysis.coaching.keyMetrics.objectionHandling}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-sans font-medium">
                  <span>Scroll down to expand full actionable checklists</span>
                  <a href="#ai-coaching-card-container" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 transition-colors">
                    View deep metrics cards <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>

            {/* Dashboard Row 3: Actionable Coaching card expansion panel */}
            <div className="pt-2">
              <h3 className="text-base font-extrabold text-slate-950 mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Actionable Sales Coaching Card (3x3 Checklist Evaluation)
              </h3>
              <CoachingCardComponent coachingData={activeAnalysis.coaching} />
            </div>

          </motion.div>
        )}
      </main>

      {/* Subtle Footer branding */}
      <footer className="border border-slate-250/60 rounded-2xl py-6 text-center text-[10px] text-slate-400 font-mono font-medium mt-12 bg-white shadow-sm">
        &bull; Sales Coaching Intelligence dashboard &bull; Google AI Studio Build platform &bull; Powered by Gemini 3.5 Flash
      </footer>
    </div>
  );
}
