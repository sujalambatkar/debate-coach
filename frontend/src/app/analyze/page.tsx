"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Zap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { useToast } from "@/components/ToastContext";
import CircularProgress from "@/components/CircularProgress";
import { SkeletonAnalyze } from "@/components/SkeletonCard";
import { AnalysisResult, FactCheckResult } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function VerdictBadge({ verdict }: { verdict: FactCheckResult["verdict"] }) {
  const config: Record<
    FactCheckResult["verdict"],
    { label: string; icon: React.ReactNode; className: string }
  > = {
    true: {
      label: "Verified",
      icon: <CheckCircle size={12} />,
      className: "bg-green-900/50 border-green-700 text-green-300",
    },
    false: {
      label: "False",
      icon: <XCircle size={12} />,
      className: "bg-red-900/50 border-red-700 text-red-300",
    },
    disputed: {
      label: "Disputed",
      icon: <AlertTriangle size={12} />,
      className: "bg-amber-900/50 border-amber-700 text-amber-300",
    },
    unverifiable: {
      label: "Unverifiable",
      icon: <HelpCircle size={12} />,
      className: "bg-gray-800/50 border-gray-600 text-gray-400",
    },
  };
  const { label, icon, className } = config[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function FallacyBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs font-semibold">
      {name}
    </span>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const { analysisResult, originalText, setDebateTopic } = useAnalysis();
  const { addToast } = useToast();

  const [localResult, setLocalResult] = useState<AnalysisResult | null>(analysisResult);
  const [factCheckResults, setFactCheckResults] = useState<FactCheckResult[] | null>(null);
  const [factChecking, setFactChecking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputText, setInputText] = useState(originalText);

  useEffect(() => {
    if (analysisResult) {
      setLocalResult(analysisResult);
    }
  }, [analysisResult]);

  const runAnalysis = async (text: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data: AnalysisResult = await res.json();
      setLocalResult(data);
    } catch {
      addToast("Analysis failed. Please try again.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFactCheck = async () => {
    if (!localResult) return;
    setFactChecking(true);
    setFactCheckResults(null);
    try {
      const claims = [localResult.main_claim, ...localResult.premises].slice(0, 5);
      const res = await fetch(`${API_URL}/api/factcheck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText || inputText, claims }),
      });
      if (!res.ok) throw new Error("Fact-check failed");
      const data = await res.json();
      setFactCheckResults(data.results);
    } catch {
      addToast("Fact-check failed. Please try again.", "error");
    } finally {
      setFactChecking(false);
    }
  };

  const handleDebate = () => {
    if (localResult?.topic) {
      setDebateTopic(localResult.topic);
    }
    router.push("/debate");
  };

  if (!localResult && !analyzing) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full bg-[#111111] border border-[#222222] rounded-2xl p-8 text-center">
          <BookOpen className="mx-auto mb-4 text-[#7c3aed]" size={40} />
          <h2 className="text-xl font-bold text-white mb-2">No analysis loaded</h2>
          <p className="text-gray-400 text-sm mb-6">
            Paste text below or go back to the homepage.
          </p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste argument text here..."
            className="w-full h-32 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-[#7c3aed] transition-colors mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#333333] text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => runAnalysis(inputText)}
              disabled={!inputText.trim() || analyzing}
              className="flex-1 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white font-semibold transition-colors text-sm flex items-center justify-center gap-2"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {analyzing ? "Analyzing…" : "Analyze"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (analyzing) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-6 bg-[#111111] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#111111] rounded animate-pulse" />
          </div>
          <SkeletonAnalyze />
        </div>
      </main>
    );
  }

  const result = localResult!;

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur border-b border-[#111111] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#7c3aed] rounded-full" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Argument Analysis
            </span>
          </div>
          <button
            onClick={handleDebate}
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Debate this topic
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header card */}
          <motion.div
            variants={itemVariants}
            className="bg-[#111111] border border-[#222222] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8"
          >
            <div className="shrink-0">
              <CircularProgress value={result.argument_strength} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Topic
                </span>
                <span className="bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-purple-300 text-xs px-3 py-1 rounded-full font-medium">
                  {result.topic}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white leading-snug mb-3">
                {result.main_claim}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">{result.strength_reasoning}</p>
            </div>
          </motion.div>

          {/* Three column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Premises */}
            <motion.div
              variants={itemVariants}
              className="bg-[#111111] border border-[#222222] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-[#7c3aed]" />
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                  Premises
                </h3>
              </div>
              <ol className="space-y-3">
                {result.premises.map((premise, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 bg-[#7c3aed]/15 text-[#7c3aed] text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">{premise}</span>
                  </li>
                ))}
              </ol>
            </motion.div>

            {/* Conclusion */}
            <motion.div
              variants={itemVariants}
              className="bg-[#7c3aed]/10 border border-[#7c3aed]/25 rounded-2xl p-6 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#7c3aed]" />
                <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                  Conclusion
                </h3>
              </div>
              <p className="text-white text-sm leading-relaxed flex-1">{result.conclusion}</p>
            </motion.div>

            {/* Weak / Strong points */}
            <motion.div
              variants={itemVariants}
              className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-5"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-green-400" />
                  <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider">
                    Strong Points
                  </h3>
                </div>
                <ul className="space-y-2">
                  {result.strong_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-green-200 text-sm">
                      <span className="text-green-500 mt-0.5 shrink-0">+</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-[#222222] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={14} className="text-red-400" />
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Weak Points
                  </h3>
                </div>
                <ul className="space-y-2">
                  {result.weak_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-200 text-sm">
                      <span className="text-red-500 mt-0.5 shrink-0">−</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Fallacies */}
          {result.fallacies.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-[#111111] border border-[#222222] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <AlertCircle size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Logical Fallacies Detected
                </h3>
              </div>
              <div className="space-y-4">
                {result.fallacies.map((f, i) => (
                  <div key={i} className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <FallacyBadge name={f.name} />
                    </div>
                    {f.quote && (
                      <blockquote className="text-amber-200/80 text-sm italic border-l-2 border-amber-700/50 pl-4 mb-3">
                        &ldquo;{f.quote}&rdquo;
                      </blockquote>
                    )}
                    <p className="text-gray-300 text-sm leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Fact Check Section */}
          <motion.div
            variants={itemVariants}
            className="bg-[#111111] border border-[#222222] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                  Fact Check
                </h3>
              </div>
              {!factCheckResults && (
                <button
                  onClick={handleFactCheck}
                  disabled={factChecking}
                  className="flex items-center gap-2 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {factChecking ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Fact-check claims with AI
                    </>
                  )}
                </button>
              )}
            </div>

            {!factCheckResults && !factChecking && (
              <p className="text-gray-500 text-sm">
                Click the button to fact-check the main claim and premises using AI knowledge.
              </p>
            )}

            {factChecking && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {factCheckResults && (
              <div className="space-y-3">
                {factCheckResults.map((r, i) => (
                  <div key={i} className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <VerdictBadge verdict={r.verdict} />
                      <p className="text-gray-300 text-sm font-medium leading-snug">{r.claim}</p>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed ml-0 mt-2">
                      {r.explanation}
                    </p>
                    {r.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.sources.map((s, j) => (
                          <span
                            key={j}
                            className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full"
                          >
                            <ExternalLink size={10} />
                            {s.length > 50 ? s.slice(0, 50) + "…" : s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div variants={itemVariants} className="flex justify-center pb-4">
            <button
              onClick={handleDebate}
              className="flex items-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 text-lg active:scale-[0.98] shadow-lg shadow-purple-900/30"
            >
              <MessageSquare size={20} />
              Debate this topic
              <span className="text-purple-300">→</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
