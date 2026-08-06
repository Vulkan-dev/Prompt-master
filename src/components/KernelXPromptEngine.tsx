import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Eye,
  FileCode,
  Layers,
  Copy,
  Check,
  Download,
  Terminal,
  Upload,
  RefreshCw,
  Sliders,
  History,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Split,
  Activity,
  Lock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";
import {
  analyzePrompt,
  optimizePrompt,
  enhancePrompt,
  imageToPrompt,
  AnalysisResult,
  OptimizationResult,
  EnhancementResult,
  ImageToPromptResult,
} from "../lib/gemini";
import { scanPromptSecurity } from "../lib/heuristics";

type Mode = "audit" | "factory" | "vision" | "recipes" | "security";

interface HistoryItem {
  id: string;
  timestamp: string;
  original: string;
  score: number;
  optimized?: string;
  mode: string;
}

const RECIPES_TEMPLATES = [
  {
    name: "Expert Persona",
    type: "Persona",
    desc: "Wraps input with authoritative expert role & task framing",
    template: (input: string) =>
      `Act as an elite Senior Staff Expert. Your objective is to: ${input}\n\nDeliver a comprehensive, production-grade output adhering to strict industry standards.`,
  },
  {
    name: "Chain of Thought (CoT)",
    type: "Chain of Thought",
    desc: "Enforces logical step-by-step reasoning breakdown",
    template: (input: string) =>
      `Task: ${input}\n\nPlease solve this task by thinking step-by-step:\n1. Deconstruct core requirements\n2. Analyze edge cases & constraints\n3. Execute logical solution\n\nLet's work through this systematically:`,
  },
  {
    name: "Few-Shot In-Context",
    type: "Few-Shot",
    desc: "Provides structured demonstration examples",
    template: (input: string) =>
      `Task: ${input}\n\nHere are reference examples of desired output format:\nExample 1: [Input A] -> [Output A]\nExample 2: [Input B] -> [Output B]\n\nNow execute for target input:`,
  },
  {
    name: "Sequential Execution",
    type: "Step-by-Step",
    desc: "Structures output into clear, numbered sequence steps",
    template: (input: string) =>
      `Break down the following objective into a numbered execution sequence: ${input}`,
  },
  {
    name: "Context & Guardrail Injection",
    type: "Context Injection",
    desc: "Injects strict operational context and negative boundaries",
    template: (input: string) =>
      `[CONTEXT]: Insert operational context\n[TASK]: ${input}\n[STRICT CONSTRAINTS]: Avoid non-verifiable claims, remain concise, return structured format.`,
  },
];

const SAMPLE_PROMPTS = [
  "Write a python web scraper for financial reports",
  "Design a modern landing page for an AI developer platform",
  "Summarize this PDF article into 5 executive bullet points",
  "Create an image of a futuristic cybernetic workstation at night in cyberpunk style 8k octane render",
];

export default function KernelXPromptEngine() {
  // State
  const [activeMode, setActiveMode] = useState<Mode>("audit");
  const [promptInput, setPromptInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Diagnostics & Results
  const [auditResult, setAuditResult] = useState<AnalysisResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancementResult | null>(null);
  const [visionResult, setVisionResult] = useState<ImageToPromptResult | null>(null);
  const [securityScan, setSecurityScan] = useState<{ securityScore: number; warnings: string[]; isSecure: boolean } | null>(null);

  // Vision Drag & Drop
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string; mime: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History & Diff
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kernelx_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveHistory = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    try {
      localStorage.setItem("kernelx_history", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Audit
  const handleAudit = async () => {
    if (!promptInput.trim()) return;
    setIsProcessing(true);
    try {
      const sec = scanPromptSecurity(promptInput);
      setSecurityScan(sec);

      const result = await analyzePrompt(promptInput);
      setAuditResult(result);

      saveHistory({
        original: promptInput,
        score: result.overallScore,
        mode: "Audit",
      });
      showToast("Diagnostic Audit complete");
    } catch (err) {
      console.error(err);
      showToast("Audit failed, fallback executed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Auto-Optimize
  const handleOptimize = async () => {
    if (!promptInput.trim()) return;
    setIsProcessing(true);
    try {
      let currentAudit = auditResult;
      if (!currentAudit) {
        currentAudit = await analyzePrompt(promptInput);
        setAuditResult(currentAudit);
      }
      const opt = await optimizePrompt(promptInput, currentAudit);
      setOptimizedResult(opt);

      saveHistory({
        original: promptInput,
        score: currentAudit.overallScore,
        optimized: opt.optimizedPrompt,
        mode: "Optimize",
      });
      showToast("Neural Optimization matrix ready");
    } catch (err) {
      console.error(err);
      showToast("Optimization fallback executed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Factory Enhancer
  const handleFactoryEnhance = async () => {
    if (!promptInput.trim()) return;
    setIsProcessing(true);
    try {
      const res = await enhancePrompt(promptInput);
      setEnhancedResult(res);
      showToast("Production Prompt Factory complete");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Image Upload & Vision
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }

    const sizeStr = (file.size / 1024).toFixed(1) + " KB";
    setImageMeta({ name: file.name, size: sizeStr, mime: file.type });

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewImage(dataUrl);
      const base64Data = dataUrl.split(",")[1];

      setIsProcessing(true);
      setActiveMode("vision");
      try {
        const visRes = await imageToPrompt(base64Data, file.type);
        setVisionResult(visRes);
        showToast("Vision Reverse Engineering complete");
      } catch (err) {
        console.error(err);
        showToast("Vision processing fallback executed");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setPromptInput(reader.result as string);
          showToast(`Attached text file: ${file.name}`);
        };
        reader.readAsText(file);
      }
    }
  };

  // Export File
  const handleExport = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Exported ${filename}`);
  };

  return (
    <div
      className="min-h-screen bg-[#030712] text-slate-100 cyber-grid relative overflow-x-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 shadow-2xl backdrop-blur-md glow-cyan"
          >
            <Info className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-sm tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telemetry Navbar */}
      <header className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-cyan-500/20 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 glow-cyan">
              <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  KernelX-Prompt
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                  v3.4 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Neural AI Prompt Intelligence Engine</p>
            </div>
          </div>

          {/* Telemetry Status HUD */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Telemetry: <strong className="text-emerald-400">Operational</strong></span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engine: <strong className="text-cyan-300">Gemma-4 Free Cluster</strong></span>
            </div>

            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-mono"
            >
              <History className="w-4 h-4" />
              <span>Logs ({history.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Navigation Modes Switcher */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md scrollbar-none">
          <button
            onClick={() => setActiveMode("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-medium transition-all whitespace-nowrap ${
              activeMode === "audit"
                ? "bg-gradient-to-r from-cyan-600/30 to-teal-600/30 text-cyan-300 border border-cyan-500/50 glow-cyan"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Auditor & Optimizer</span>
          </button>

          <button
            onClick={() => setActiveMode("factory")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-medium transition-all whitespace-nowrap ${
              activeMode === "factory"
                ? "bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/50 glow-emerald"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Prompt Factory</span>
          </button>

          <button
            onClick={() => setActiveMode("vision")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-medium transition-all whitespace-nowrap ${
              activeMode === "vision"
                ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/50 glow-purple"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Vision Engine</span>
          </button>

          <button
            onClick={() => setActiveMode("recipes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-medium transition-all whitespace-nowrap ${
              activeMode === "recipes"
                ? "bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border border-amber-500/50 glow-amber"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Recipe Studio</span>
          </button>

          <button
            onClick={() => setActiveMode("security")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-medium transition-all whitespace-nowrap ${
              activeMode === "security"
                ? "bg-gradient-to-r from-red-600/30 to-rose-600/30 text-red-300 border border-red-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Security Scanner</span>
          </button>
        </div>

        {/* Dual-Pane Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Console Pane (Input & Control Matrix) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="kernel-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Kernel Input Console
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{promptInput.length} chars</span>
                  <span>•</span>
                  <span>{promptInput.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter or drop your raw prompt here... (or drop files/images directly onto the screen)"
                  className="w-full h-56 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
                />
                {promptInput && (
                  <button
                    onClick={() => setPromptInput("")}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-all"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sample Starters */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Sample Prompts:</span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPromptInput(sample)}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800 hover:border-cyan-500/30 transition-all truncate max-w-[200px]"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {activeMode === "audit" && (
                  <>
                    <button
                      onClick={handleAudit}
                      disabled={isProcessing || !promptInput.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>Audit Prompt (0-100)</span>
                    </button>

                    <button
                      onClick={handleOptimize}
                      disabled={isProcessing || !promptInput.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-mono text-sm font-medium transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Neural Optimize</span>
                    </button>
                  </>
                )}

                {activeMode === "factory" && (
                  <button
                    onClick={handleFactoryEnhance}
                    disabled={isProcessing || !promptInput.trim()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate Production Prompt</span>
                  </button>
                )}

                {activeMode === "security" && (
                  <button
                    onClick={() => {
                      if (!promptInput.trim()) return;
                      const res = scanPromptSecurity(promptInput);
                      setSecurityScan(res);
                      showToast("Security Vulnerability Scan complete");
                    }}
                    disabled={!promptInput.trim()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-mono font-bold text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Run Vulnerability Matrix</span>
                  </button>
                )}
              </div>
            </div>

            {/* Vision Drag & Drop Upload Box */}
            <div className="kernel-card rounded-2xl p-5 border-dashed border-cyan-500/30 hover:border-cyan-500/60 transition-all text-center space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processImageFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-mono text-sm font-semibold text-slate-200">
                  Image-to-Prompt Vision Console
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Drag and drop any image here to reverse-engineer its AI generation prompt
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-cyan-500/30 transition-all"
              >
                Browse Image File
              </button>
            </div>
          </div>

          {/* Right Output & Intelligence Matrix Pane */}
          <div className="lg:col-span-6 space-y-4">
            {/* Audit Mode Output */}
            {activeMode === "audit" && (
              <div className="space-y-4">
                {auditResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="kernel-card rounded-2xl p-5 space-y-5"
                  >
                    {/* Score Dial Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Diagnostic Overall Score
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span
                            className={`font-mono text-4xl font-extrabold ${
                              auditResult.overallScore >= 80
                                ? "text-emerald-400"
                                : auditResult.overallScore >= 50
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {auditResult.overallScore}
                          </span>
                          <span className="text-xs font-mono text-slate-500">/ 100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {optimizedResult && (
                          <button
                            onClick={() => setIsDiffOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition-all"
                          >
                            <Split className="w-3.5 h-3.5" />
                            <span>Inspect Diff</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(optimizedResult?.optimizedPrompt || promptInput)}
                          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-all"
                          title="Copy text"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Criteria Diagnostics Gauge */}
                    <div className="space-y-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Criteria Diagnostics Radar
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(auditResult.criteria).map(([key, val]) => (
                          <div key={key} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="capitalize text-slate-300">{key}</span>
                              <span className="text-cyan-400 font-bold">{val}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${(val / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optimized Result Display */}
                    {optimizedResult && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Neural Optimized Output
                          </span>
                          <button
                            onClick={() => handleExport(optimizedResult.optimizedPrompt, "kernelx-optimized.txt")}
                            className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Export
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {optimizedResult.optimizedPrompt}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="kernel-card rounded-2xl p-12 text-center text-slate-500 font-mono space-y-3">
                    <Zap className="w-8 h-8 text-cyan-500/40 mx-auto animate-pulse" />
                    <p className="text-sm">Run an audit to view live diagnostic metrics and neural optimization score.</p>
                  </div>
                )}
              </div>
            )}

            {/* Factory Mode Output */}
            {activeMode === "factory" && (
              <div className="space-y-4">
                {enhancedResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="kernel-card rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-sm font-semibold text-emerald-300 uppercase tracking-wider">
                          Production Prompt Factory
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs uppercase">
                        {enhancedResult.category}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {enhancedResult.enhancedPrompt}
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-mono text-slate-400">Implemented Improvements:</span>
                      <ul className="space-y-1.5 font-mono text-xs text-slate-300">
                        {enhancedResult.improvements.map((imp, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <div className="kernel-card rounded-2xl p-12 text-center text-slate-500 font-mono space-y-3">
                    <Sparkles className="w-8 h-8 text-emerald-500/40 mx-auto" />
                    <p className="text-sm">Click 'Generate Production Prompt' to transform rough ideas into production-grade prompts.</p>
                  </div>
                )}
              </div>
            )}

            {/* Vision Mode Output */}
            {activeMode === "vision" && (
              <div className="space-y-4">
                {previewImage && (
                  <div className="kernel-card rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                      <span>Image Specimen</span>
                      <span>{imageMeta?.size}</span>
                    </div>
                    <img
                      src={previewImage}
                      alt="Target preview"
                      className="w-full max-h-48 object-cover rounded-xl border border-slate-800"
                    />
                  </div>
                )}

                {visionResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="kernel-card rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-mono text-sm font-semibold text-purple-300 uppercase tracking-wider">
                        Extracted AI Image Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(visionResult.generatedPrompt)}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/30 font-mono text-xs text-slate-200 leading-relaxed">
                      {visionResult.generatedPrompt}
                    </div>

                    {visionResult.negativePrompt && (
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-red-400">Negative Exclusions:</span>
                        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 font-mono text-xs text-slate-400">
                          {visionResult.negativePrompt}
                        </div>
                      </div>
                    )}

                    {/* Color Chips */}
                    {visionResult.colorPalette && visionResult.colorPalette.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-mono text-slate-400">Color Palette Spectrum:</span>
                        <div className="flex flex-wrap gap-2">
                          {visionResult.colorPalette.map((col, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md bg-slate-900 border border-purple-500/20 text-xs font-mono text-purple-300"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="kernel-card rounded-2xl p-12 text-center text-slate-500 font-mono space-y-3">
                    <Eye className="w-8 h-8 text-purple-500/40 mx-auto" />
                    <p className="text-sm">Upload an image to reverse-engineer detailed image generation prompts.</p>
                  </div>
                )}
              </div>
            )}

            {/* Recipes Mode Output */}
            {activeMode === "recipes" && (
              <div className="space-y-4">
                <div className="kernel-card rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-mono text-sm font-semibold text-amber-300 uppercase tracking-wider">
                      Kernel Framework Recipes Matrix
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Select a framework recipe to wrap your current prompt automatically
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {RECIPES_TEMPLATES.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-400">{rec.name}</span>
                          <button
                            onClick={() => {
                              const wrapped = rec.template(promptInput || "[Your core task instruction]");
                              setPromptInput(wrapped);
                              showToast(`Applied ${rec.name} framework`);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono transition-all"
                          >
                            Wrap Prompt
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-400">{rec.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Scanner Mode Output */}
            {activeMode === "security" && (
              <div className="space-y-4">
                {securityScan ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="kernel-card rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-mono text-sm font-semibold text-slate-200 uppercase tracking-wider">
                        Vulnerability Matrix Rating
                      </span>
                      <span
                        className={`font-mono text-lg font-bold ${
                          securityScan.isSecure ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {securityScan.securityScore} / 100
                      </span>
                    </div>

                    {securityScan.isSecure ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                        <span>No prompt injection, jailbreak, or sensitive data leakage threats detected.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-red-400 font-semibold">
                          Detected Security Vulnerabilities:
                        </span>
                        <ul className="space-y-2 font-mono text-xs">
                          {securityScan.warnings.map((warn, idx) => (
                            <li
                              key={idx}
                              className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                              <span>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="kernel-card rounded-2xl p-12 text-center text-slate-500 font-mono space-y-3">
                    <ShieldAlert className="w-8 h-8 text-red-500/40 mx-auto" />
                    <p className="text-sm">Run Vulnerability Matrix to scan prompts for injection threats and compliance risks.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Side-by-Side Diff Modal */}
      <AnimatePresence>
        {isDiffOpen && optimizedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="w-full max-w-4xl kernel-card rounded-2xl p-6 space-y-4 border border-cyan-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Split className="w-5 h-5 text-cyan-400" />
                  <span className="font-mono text-base font-bold text-slate-100">
                    Side-by-Side Prompt Diff Matrix
                  </span>
                </div>
                <button
                  onClick={() => setIsDiffOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* Original */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-semibold">Original Input Prompt:</span>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {promptInput}
                  </div>
                </div>

                {/* Optimized */}
                <div className="space-y-2">
                  <span className="text-emerald-400 font-semibold">KernelX Optimized Result:</span>
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {optimizedResult.optimizedPrompt}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    handleCopy(optimizedResult.optimizedPrompt);
                    setIsDiffOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-mono font-bold text-xs hover:bg-cyan-400 transition-all"
                >
                  Copy Optimized Version
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-80 z-50 kernel-card border-l border-cyan-500/30 p-5 space-y-4 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-sm font-semibold text-slate-200 uppercase">
                  Execution History
                </span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setPromptInput(item.original);
                      setIsHistoryOpen(false);
                      showToast("Loaded prompt from history");
                    }}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-1 font-mono text-xs"
                  >
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>{item.mode} • {item.timestamp}</span>
                      <span className="text-cyan-400 font-bold">Score: {item.score}</span>
                    </div>
                    <p className="text-slate-300 truncate">{item.original}</p>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("kernelx_history");
                    showToast("Cleared history logs");
                  }}
                  className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History Logs
                </button>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500 text-center py-8">
                No past executions logged yet.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
