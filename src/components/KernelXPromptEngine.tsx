import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzePrompt, optimizePrompt, imageToPrompt, enhancePrompt, AnalysisResult, OptimizationResult, ImageToPromptResult, EnhancementResult } from '../lib/gemini';
import { scanPromptSecurity } from '../lib/heuristics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, ShieldCheck, CheckCircle2, Copy, RefreshCw, Zap, Eye, Split, Download, History, AlertTriangle } from 'lucide-react';

import FlowField from './ui/FlowField';
import AI_Input_Search from './ui/AI_Input_Search';
import AITextLoading from './ui/AITextLoading';
import FileUpload from './ui/FileUpload';
import { LiquidGlassCard, LiquidButton } from './ui/LiquidGlassCard';

interface HistoryItem {
  id: string;
  timestamp: string;
  original: string;
  score: number;
  optimized?: string;
  mode: string;
}

export default function KernelXPromptEngine() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');

  // Diagnostic states
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [visionResult, setVisionResult] = useState<ImageToPromptResult | null>(null);
  const [securityScan, setSecurityScan] = useState<{ securityScore: number; warnings: string[]; isSecure: boolean } | null>(null);

  // Vision / File states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);

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
        setActiveTab('vision');
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
      <div className="min-h-screen relative z-10 px-4 md:px-8 py-10 max-w-6xl mx-auto">
        
        {/* Main Liquid Glass Shell Container */}
        <div className="liquid-glass rounded-3xl p-6 md:p-10 space-y-8 relative overflow-hidden">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-white font-mono">KernelX Prompt</h1>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">v3.4 PRO</Badge>
                </div>
                <p className="text-xs text-white/60 font-light">Advanced AI Prompt Intelligence & Optimization System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="font-mono text-xs gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-white"
              >
                <History className="h-4 w-4" />
                Logs ({history.length})
              </Button>
            </div>
          </header>

          {/* Feature Tabs (3 Focused Modes) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <TabsList className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
              <TabsTrigger value="audit" className="font-mono text-xs font-medium gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
                <Zap className="h-3.5 w-3.5" /> Audit & Score
              </TabsTrigger>
              <TabsTrigger value="factory" className="font-mono text-xs font-medium gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
                <Sparkles className="h-3.5 w-3.5" /> Enhancer
              </TabsTrigger>
              <TabsTrigger value="vision" className="font-mono text-xs font-medium gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
                <Eye className="h-3.5 w-3.5" /> Image to Prompt
              </TabsTrigger>
            </TabsList>

            {/* Input Search Console (For Audit & Enhancer) */}
            {activeTab !== 'vision' && (
              <div className="space-y-4">
                <AI_Input_Search
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={() => {
                    if (activeTab === 'audit') handleAnalyze();
                    else if (activeTab === 'factory') handleEnhance();
                  }}
                  placeholder="Enter your prompt instruction here..."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                    <span>{prompt.length} characters</span>
                    <span>•</span>
                    <span>{prompt.split(/\s+/).filter(Boolean).length} words</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'audit' && (
                      <>
                        <LiquidButton onClick={handleAnalyze} disabled={isProcessing || !prompt.trim()}>
                          {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                          Audit Score
                        </LiquidButton>
                        <Button variant="outline" onClick={handleOptimize} disabled={isProcessing || !prompt.trim()} className="font-mono text-xs border-white/20 text-white hover:bg-white/10">
                          <Sparkles className="h-4 w-4 mr-2 text-primary" />
                          Auto-Optimize
                        </Button>
                      </>
                    )}

                    {activeTab === 'factory' && (
                      <LiquidButton onClick={handleEnhance} disabled={isProcessing || !prompt.trim()}>
                        <Sparkles className="h-4 w-4" />
                        Generate Enhanced Prompt
                      </LiquidButton>
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

            {/* TAB 1: AUDIT & SCORE */}
            <TabsContent value="audit" className="space-y-6 pt-2">
              {analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Score Card */}
                  <LiquidGlassCard className="lg:col-span-4 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-white/60">Overall Quality Score</span>
                    <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-primary/40 bg-primary/10 shadow-lg">
                      <span className={`font-mono text-5xl font-extrabold ${analysisResult.overallScore >= 80 ? 'text-emerald-400' : analysisResult.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {analysisResult.overallScore}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-white/50">Evaluated on 5 dimensions</span>
                  </LiquidGlassCard>

                  {/* Diagnostic Breakdown Card */}
                  <LiquidGlassCard className="lg:col-span-8 p-6 space-y-4">
                    <h3 className="font-mono text-sm font-semibold tracking-wider text-white uppercase border-b border-white/10 pb-3">
                      Diagnostic Criteria Radar
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(analysisResult.criteria).map(([key, val]) => (
                        <div key={key} className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                          <div className="flex justify-between font-mono text-xs">
                            <span className="capitalize font-medium text-white">{key}</span>
                            <span className="text-primary font-bold">{Number(val)}/10</span>
                          </div>
                          <Progress value={(Number(val) / 10) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </LiquidGlassCard>

                  {/* Security Alert if threats detected */}
                  {securityScan && !securityScan.isSecure && (
                    <div className="lg:col-span-12">
                      <Alert variant="destructive" className="bg-destructive/20 border-destructive/40 text-white">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-mono text-xs font-bold">Security Alert Detected</AlertTitle>
                        <AlertDescription className="font-mono text-xs">
                          {securityScan.warnings.join(' • ')}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Optimized Output Card */}
                  {optimizedResult && (
                    <LiquidGlassCard className="lg:col-span-12 p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Sparkles className="h-5 w-5" />
                          <h3 className="font-mono text-base font-semibold">KernelX Optimized Output</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsDiffModalOpen(true)} className="font-mono text-xs border-white/20 text-white hover:bg-white/10">
                            <Split className="h-4 w-4 mr-1" /> Compare Diff
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCopy(optimizedResult.optimizedPrompt)} className="font-mono text-xs border-white/20 text-white hover:bg-white/10">
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-white leading-relaxed whitespace-pre-wrap">
                        {optimizedResult.optimizedPrompt}
                      </div>
                    </LiquidGlassCard>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: ENHANCER */}
            <TabsContent value="factory" className="space-y-6 pt-2">
              {enhancementResult && (
                <LiquidGlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="font-mono text-sm font-semibold text-white">Production-Grade Enhanced Prompt</span>
                    <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary uppercase">
                      {enhancementResult.category}
                    </Badge>
                  </div>

                  <div className="p-5 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {enhancementResult.enhancedPrompt}
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono text-white/60">Applied Enhancements:</span>
                    <ul className="space-y-2 font-mono text-xs text-white/90">
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
            </TabsContent>

            {/* TAB 3: IMAGE TO PROMPT */}
            <TabsContent value="vision" className="space-y-6 pt-2">
              <FileUpload onUploadSuccess={handleFileUpload} />

              {imagePreview && (
                <LiquidGlassCard className="p-4 flex items-center gap-4">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-white/20" />
                  <div className="font-mono text-xs space-y-1">
                    <p className="font-semibold text-white">{imageMeta?.name}</p>
                    <p className="text-white/50">{imageMeta?.size}</p>
                  </div>
                </LiquidGlassCard>
              )}

              {visionResult && (
                <LiquidGlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-mono text-sm font-semibold text-white">Extracted Image Generation Prompt</h3>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(visionResult.generatedPrompt)} className="font-mono text-xs border-white/20 text-white hover:bg-white/10">
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>

                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-white leading-relaxed">
                    {visionResult.generatedPrompt}
                  </div>
                </LiquidGlassCard>
              )}
            </TabsContent>
          </Tabs>

          {/* Side-by-Side Diff Modal */}
          <Dialog open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
            <DialogContent className="max-w-4xl glass-card border border-white/20 p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-mono text-base font-bold flex items-center gap-2 text-white">
                  <Split className="h-5 w-5 text-primary" /> Prompt Diff Inspection
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-white/60">
                  Side-by-side comparison of original input vs KernelX optimized version.
                </DialogDescription>
              </DialogHeader>

              {optimizedResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-2">
                    <span className="font-semibold text-white/70">Original Input:</span>
                    <div className="p-4 rounded-xl bg-black/50 border border-white/10 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap text-white">
                      {prompt}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="font-semibold text-primary">KernelX Optimized:</span>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap text-white">
                      {optimizedResult.optimizedPrompt}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Footer */}
          <footer className="pt-8 border-t border-white/10 text-center font-mono text-xs text-white/40">
            <p>KernelX Prompt © 2026 • AI Intelligence System</p>
          </footer>
        </div>
      </div>
    </FlowField>
  );
}
