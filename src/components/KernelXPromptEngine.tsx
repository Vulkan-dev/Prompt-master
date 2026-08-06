import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzePrompt, optimizePrompt, imageToPrompt, enhancePrompt, AnalysisResult, OptimizationResult, ImageToPromptResult, EnhancementResult } from '../lib/gemini';
import { scanPromptSecurity } from '../lib/heuristics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, ShieldCheck, CheckCircle2, Copy, RefreshCw, Zap, Eye, Split, Download, History, AlertTriangle, Trash2, X, RotateCcw } from 'lucide-react';

import FlowField from './ui/FlowField';
import AI_Input_Search from './ui/AI_Input_Search';
import AITextLoading from './ui/AITextLoading';
import FileUpload from './ui/FileUpload';
import SmoothTab, { TabItem } from './ui/SmoothTab';
import { LiquidGlassCard, LiquidButton } from './ui/LiquidGlassCard';

interface HistoryItem {
  id: string;
  timestamp: string;
  original: string;
  score: number;
  optimized?: string;
  mode: string;
}

const TABS: TabItem[] = [
  { id: 'audit', title: 'Audit & Score', icon: <Zap className="h-4 w-4 shrink-0" /> },
  { id: 'factory', title: 'Enhancer', icon: <Sparkles className="h-4 w-4 shrink-0" /> },
  { id: 'vision', title: 'Image to Prompt', icon: <Eye className="h-4 w-4 shrink-0" /> },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "60%" : "-60%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "60%" : "-60%",
    opacity: 0,
    filter: "blur(8px)",
    scale: 0.97,
  }),
};

const tabTransition = {
  duration: 0.4,
  ease: [0.32, 0.72, 0, 1],
};

export default function KernelXPromptEngine() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');
  const [direction, setDirection] = useState(0);

  // Diagnostic states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [visionResult, setVisionResult] = useState<ImageToPromptResult | null>(null);
  const [securityScan, setSecurityScan] = useState<{ securityScore: number; warnings: string[]; isSecure: boolean } | null>(null);

  // Vision / File states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Modals & History
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kernelx_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTabChange = (newTabId: string) => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    const newIndex = TABS.findIndex((t) => t.id === newTabId);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTabId);
  };

  const saveHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    try {
      localStorage.setItem('kernelx_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Execution Handlers
  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const sec = scanPromptSecurity(prompt);
      setSecurityScan(sec);

      const result = await analyzePrompt(prompt);
      setAnalysisResult(result);

      saveHistory({
        original: prompt,
        score: result.overallScore,
        mode: 'Audit'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      let currentAnalysis = analysisResult;
      if (!currentAnalysis) {
        currentAnalysis = await analyzePrompt(prompt);
        setAnalysisResult(currentAnalysis);
      }
      const opt = await optimizePrompt(prompt, currentAnalysis);
      setOptimizedResult(opt);

      saveHistory({
        original: prompt,
        score: currentAnalysis.overallScore,
        optimized: opt.optimizedPrompt,
        mode: 'Optimize'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const res = await enhancePrompt(prompt);
      setEnhancementResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        setImageMeta({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
        const base64Data = dataUrl.split(',')[1];

        setIsProcessing(true);
        handleTabChange('vision');
        try {
          const visRes = await imageToPrompt(base64Data, file.type);
          setVisionResult(visRes);
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <FlowField theme="aurora" density="medium">
      <div className="min-h-screen relative z-10 px-[clamp(0.75rem,2vw,2.5rem)] py-[clamp(1rem,3vh,3.5rem)] max-w-full flex flex-col items-center justify-center">
        
        {/* Main Viewport Fluid Liquid Glass Shell Container */}
        <div className="w-[min(96vw,1750px)] h-auto min-h-[clamp(520px,84vh,1200px)] flex flex-col justify-between liquid-glass rounded-3xl p-[clamp(1rem,3vw,3.5rem)] border border-white/20 shadow-2xl space-y-[clamp(1.5rem,3vh,3rem)] relative overflow-hidden">
          
          <div className="space-y-[clamp(1.5rem,3vh,3rem)] w-full">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-[clamp(1rem,2vh,1.75rem)] border-b border-white/15">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(1.5rem,3.2vw,3.5rem)] font-extrabold tracking-tight font-mono text-white drop-shadow-md">
                    KernelX Prompt
                  </h1>
                  <Badge variant="outline" className="text-[clamp(0.7rem,0.9vw,0.95rem)] font-mono border-indigo-400 text-indigo-300 bg-indigo-500/20 px-3 py-1 font-bold">
                    v3.4 PRO
                  </Badge>
                </div>
                <p className="text-[clamp(0.8rem,1.1vw,1.25rem)] text-slate-300 font-medium mt-1">
                  Advanced AI Prompt Intelligence & Optimization System
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="font-mono text-[clamp(0.75rem,1vw,1.05rem)] font-semibold gap-2 border-white/20 bg-white/10 hover:bg-white/20 text-white min-h-[clamp(40px,4.8vh,52px)] px-[clamp(1rem,1.8vw,1.8rem)]"
                >
                  <History className="h-4 w-4 text-indigo-300" />
                  Logs ({history.length})
                </Button>
              </div>
            </header>

            {/* Smooth Tab Bar with Sliding Indicator Pill */}
            <SmoothTab
              items={TABS}
              activeTabId={activeTab}
              onChange={handleTabChange}
            />

            {/* Input Search Console (For Audit & Enhancer) */}
            {activeTab !== 'vision' && (
              <div className="space-y-4">
                <AI_Input_Search
                  value={prompt}
                  onChange={setPrompt}
                  showEnhanceToggle={activeTab === 'factory'}
                  onSubmit={() => {
                    if (activeTab === 'audit') handleAnalyze();
                    else if (activeTab === 'factory') handleEnhance();
                  }}
                  placeholder="Enter your prompt instruction here..."
                />

                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 text-[clamp(0.75rem,1vw,1.05rem)] font-mono text-slate-300 font-medium">
                    <span>{prompt.length} characters</span>
                    <span>•</span>
                    <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'audit' && (
                      <>
                        <button
                          onClick={handleAnalyze}
                          disabled={isProcessing || !prompt.trim()}
                          className="inline-flex items-center gap-2 px-[clamp(1.2rem,2.2vw,2.2rem)] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[clamp(0.75rem,1.05vw,1.05rem)] font-bold transition-all shadow-lg min-h-[clamp(42px,5vh,56px)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                          Audit Score
                        </button>

                        <button
                          onClick={handleOptimize}
                          disabled={isProcessing || !prompt.trim()}
                          className="inline-flex items-center gap-2 px-[clamp(1.2rem,2.2vw,2.2rem)] py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[clamp(0.75rem,1.05vw,1.05rem)] font-bold transition-all min-h-[clamp(42px,5vh,56px)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="h-4 w-4 text-indigo-300" />
                          Auto-Optimize
                        </button>
                      </>
                    )}

                    {activeTab === 'factory' && (
                      <button
                        onClick={handleEnhance}
                        disabled={isProcessing || !prompt.trim()}
                        className="inline-flex items-center gap-2 px-[clamp(1.2rem,2.2vw,2.2rem)] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[clamp(0.75rem,1.05vw,1.05rem)] font-bold transition-all shadow-lg min-h-[clamp(42px,5vh,56px)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Enhanced Prompt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading Animation Overlay */}
            {isProcessing && (
              <AITextLoading
                texts={[
                  "KernelX Analyzing Instruction...",
                  "Evaluating Criteria Metrics...",
                  "Checking Security Vulnerabilities...",
                  "Optimizing Neural Execution...",
                  "Formatting Final Prompt..."
                ]}
              />
            )}

            {/* Animated Tab Content Transitions */}
            <div className="relative overflow-hidden w-full">
              <AnimatePresence custom={direction} mode="wait">
                {activeTab === 'audit' && (
                  <motion.div
                    key="audit"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={tabTransition}
                    className="space-y-6 pt-2 w-full"
                  >
                    {analysisResult && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Score Card */}
                        <LiquidGlassCard className="lg:col-span-4 flex flex-col items-center justify-center p-[clamp(1.5rem,3vw,3.5rem)] text-center space-y-4">
                          <span className="text-[clamp(0.7rem,0.9vw,0.95rem)] font-mono uppercase tracking-widest text-slate-300 font-bold">Overall Quality Score</span>
                          <div className="relative flex items-center justify-center w-[clamp(7rem,14vw,14rem)] h-[clamp(7rem,14vw,14rem)] rounded-full border-4 border-indigo-400 bg-indigo-500/20 shadow-xl shrink-0">
                            <span className={`font-mono text-[clamp(2.2rem,4.5vw,4.5rem)] font-extrabold ${analysisResult.overallScore >= 80 ? 'text-emerald-400' : analysisResult.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {analysisResult.overallScore}
                            </span>
                          </div>
                          <span className="text-[clamp(0.7rem,0.9vw,0.95rem)] font-mono text-slate-300 font-medium">Evaluated on 5 dimensions</span>
                        </LiquidGlassCard>

                        {/* Diagnostic Breakdown Card */}
                        <LiquidGlassCard className="lg:col-span-8 p-[clamp(1.2rem,2.5vw,2.8rem)] space-y-4">
                          <h3 className="font-mono text-[clamp(0.85rem,1.1vw,1.15rem)] font-bold tracking-wider text-white uppercase border-b border-white/15 pb-3">
                            Diagnostic Criteria Radar
                          </h3>

                          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
                            {Object.entries(analysisResult.criteria).map(([key, val]) => (
                              <div key={key} className="p-4 rounded-xl bg-zinc-900/90 border border-white/15 space-y-2">
                                <div className="flex justify-between font-mono text-[clamp(0.75rem,0.95vw,1vw)]">
                                  <span className="capitalize font-bold text-slate-200">{key}</span>
                                  <span className="text-indigo-300 font-extrabold">{Number(val)}/10</span>
                                </div>
                                <Progress value={(Number(val) / 10) * 100} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </LiquidGlassCard>

                        {/* Security Alert if threats detected */}
                        {securityScan && !securityScan.isSecure && (
                          <div className="lg:col-span-12">
                            <Alert variant="destructive" className="bg-red-950/80 border-red-500/50 text-white">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              <AlertTitle className="font-mono text-sm font-bold">Security Threat Detected</AlertTitle>
                              <AlertDescription className="font-mono text-xs text-slate-200">
                                {securityScan.warnings.join(' • ')}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}

                        {/* Optimized Output Card */}
                        {optimizedResult && (
                          <LiquidGlassCard className="lg:col-span-12 p-[clamp(1.2rem,2.5vw,2.8rem)] space-y-4">
                            <div className="flex items-center justify-between border-b border-white/15 pb-4">
                              <div className="flex items-center gap-2 text-indigo-300">
                                <Sparkles className="h-5 w-5" />
                                <h3 className="font-mono text-[clamp(0.95rem,1.2vw,1.3rem)] font-bold text-white">KernelX Optimized Output</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsDiffModalOpen(true)} className="font-mono text-[clamp(0.75rem,0.95vw,1vw)] border-white/20 text-white hover:bg-white/10 min-h-[clamp(36px,4.5vh,46px)]">
                                  <Split className="h-4 w-4 mr-1 text-indigo-300" /> Compare Diff
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleCopy(optimizedResult.optimizedPrompt)} className="font-mono text-[clamp(0.75rem,0.95vw,1vw)] border-white/20 text-white hover:bg-white/10 min-h-[clamp(36px,4.5vh,46px)]">
                                  <Copy className="h-4 w-4 mr-1 text-indigo-300" /> Copy
                                </Button>
                              </div>
                            </div>

                            <div className="p-5 rounded-xl bg-zinc-950/90 border border-white/15 font-mono text-[clamp(0.85rem,1.1vw,1.15rem)] text-slate-100 leading-relaxed whitespace-pre-wrap">
                              {optimizedResult.optimizedPrompt}
                            </div>
                          </LiquidGlassCard>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'factory' && (
                  <motion.div
                    key="factory"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={tabTransition}
                    className="space-y-6 pt-2 w-full"
                  >
                    {enhancementResult && (
                      <LiquidGlassCard className="p-[clamp(1.2rem,2.5vw,2.8rem)] space-y-4">
                        <div className="flex items-center justify-between border-b border-white/15 pb-4">
                          <span className="font-mono text-[clamp(0.9rem,1.15vw,1.25rem)] font-bold text-white">Production-Grade Enhanced Prompt</span>
                          <Badge variant="outline" className="font-mono text-[clamp(0.7rem,0.9vw,0.95rem)] border-indigo-400 text-indigo-300 uppercase px-3 py-1 font-bold">
                            {enhancementResult.category}
                          </Badge>
                        </div>

                        <div className="p-5 rounded-xl bg-zinc-950/90 border border-white/15 font-mono text-[clamp(0.85rem,1.1vw,1.15rem)] text-slate-100 leading-relaxed whitespace-pre-wrap">
                          {enhancementResult.enhancedPrompt}
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="text-[clamp(0.75rem,0.95vw,1vw)] font-mono text-slate-300 font-bold uppercase tracking-wider">Applied Enhancements:</span>
                          <ul className="space-y-2 font-mono text-[clamp(0.75rem,0.95vw,1vw)] text-slate-200">
                            {enhancementResult.improvements.map((imp, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </LiquidGlassCard>
                    )}
                  </motion.div>
                )}

                {activeTab === 'vision' && (
                  <motion.div
                    key="vision"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={tabTransition}
                    className="space-y-6 pt-2 w-full"
                  >
                    {!imagePreview ? (
                      <FileUpload onUploadSuccess={handleFileUpload} />
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-white/20 glass-card p-3 sm:p-5 bg-zinc-950/80 shadow-2xl">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        
                        <div className="relative w-full max-h-[460px] min-h-[260px] flex items-center justify-center overflow-hidden rounded-xl bg-black/80">
                          <img
                            src={imagePreview}
                            alt="Uploaded Preview"
                            className="max-h-[440px] w-auto max-w-full object-contain rounded-xl"
                          />
                          
                          {/* Floating Actions overlay (matching user reference screenshot) */}
                          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 backdrop-blur-[2px] opacity-95 transition-opacity">
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/20 text-white font-mono text-xs sm:text-sm font-bold shadow-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4 text-indigo-300" />
                              <span>Change Image</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setImageMeta(null);
                                setVisionResult(null);
                              }}
                              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-red-950/90 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-xs sm:text-sm font-bold shadow-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        {imageMeta && (
                          <div className="flex items-center justify-between mt-3 px-2 font-mono text-xs text-slate-300">
                            <span className="truncate font-semibold text-white max-w-[70%]">{imageMeta.name}</span>
                            <span className="text-indigo-300">{imageMeta.size}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {visionResult && (
                      <LiquidGlassCard className="p-[clamp(1.2rem,2.5vw,2.8rem)] space-y-4">
                        <div className="flex items-center justify-between border-b border-white/15 pb-3">
                          <h3 className="font-mono text-[clamp(0.9rem,1.15vw,1.25rem)] font-bold text-white">Extracted Image Generation Prompt</h3>
                          <Button variant="outline" size="sm" onClick={() => handleCopy(visionResult.generatedPrompt)} className="font-mono text-[clamp(0.75rem,0.95vw,1vw)] border-white/20 text-white hover:bg-white/10 min-h-[clamp(36px,4.5vh,46px)]">
                            <Copy className="h-4 w-4 mr-1 text-indigo-300" /> Copy
                          </Button>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-950/90 border border-white/15 font-mono text-[clamp(0.85rem,1.1vw,1.15rem)] text-slate-100 leading-relaxed">
                          {visionResult.generatedPrompt}
                        </div>
                      </LiquidGlassCard>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Side-by-Side Diff Modal */}
          <Dialog open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
            <DialogContent className="max-w-4xl glass-card border border-white/20 p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-mono text-base font-bold flex items-center gap-2 text-white">
                  <Split className="h-5 w-5 text-indigo-300" /> Prompt Diff Inspection
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-slate-300">
                  Side-by-side comparison of original input vs KernelX optimized version.
                </DialogDescription>
              </DialogHeader>

              {optimizedResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-200">Original Input:</span>
                    <div className="p-4 rounded-xl bg-zinc-950/90 border border-white/15 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap text-slate-100">
                      {prompt}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="font-bold text-indigo-300">KernelX Optimized:</span>
                    <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap text-slate-100">
                      {optimizedResult.optimizedPrompt}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Execution History Logs Modal */}
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogContent className="max-w-2xl glass-card border border-white/20 p-6 space-y-4">
              <DialogHeader className="flex flex-row items-center justify-between border-b border-white/15 pb-3">
                <DialogTitle className="font-mono text-base font-bold flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-indigo-300" /> Execution Logs Matrix
                </DialogTitle>
                {history.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('kernelx_history');
                    }}
                    className="font-mono text-xs border-red-500/40 text-red-300 hover:bg-red-500/20 mr-6 font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Logs
                  </Button>
                )}
              </DialogHeader>

              {history.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setPrompt(item.original);
                        setIsHistoryOpen(false);
                      }}
                      className="p-4 rounded-xl bg-zinc-950/90 border border-white/15 hover:border-indigo-400/60 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-300 font-bold">{item.mode} • {item.timestamp}</span>
                        <Badge variant="outline" className="border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold">
                          Score: {item.score}/100
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-slate-200 truncate font-medium group-hover:text-white">
                        {item.original}
                      </p>
                      {item.optimized && (
                        <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/30 text-[11px] font-mono text-indigo-200 truncate font-semibold">
                          ✨ {item.optimized}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center font-mono text-xs text-slate-300 space-y-2">
                  <History className="h-8 w-8 mx-auto text-indigo-300 opacity-60" />
                  <p className="font-bold text-white">No past prompt executions logged yet.</p>
                  <p className="text-[11px] text-slate-400">Past audits and optimizations will be recorded here.</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Footer */}
          <footer className="pt-6 border-t border-white/15 text-center font-mono text-[clamp(0.75rem,0.95vw,1vw)] text-slate-300 font-medium">
            <p>KernelX Prompt © 2026 • AI Intelligence System</p>
          </footer>
        </div>
      </div>
    </FlowField>
  );
}
