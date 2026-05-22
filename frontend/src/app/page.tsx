"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { useToast } from "@/components/ToastContext";
import { AnalysisResult } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EXAMPLE_PROMPTS = [
  "AI will replace all human jobs within the next 10 years, making large swaths of the population permanently unemployable and destabilizing society.",
  "Social media companies should be legally required to verify user ages and ban children under 16 from their platforms to protect mental health.",
  "Universal Basic Income is the only viable solution to growing wealth inequality and technological unemployment in the 21st century.",
  "Climate change action should be prioritized over economic growth, even if it means lower living standards for current generations.",
];

export default function LandingPage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const router = useRouter();
  const { setAnalysisResult, setOriginalText, setDebateTopic } = useAnalysis();
  const { addToast } = useToast();

  const handleAnalyze = async () => {
    if (!text.trim()) {
      addToast("Please enter some text to analyze.", "error");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      setOriginalText(text.trim());
      router.push("/analyze");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to analyze. Is the backend running?", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDebate = () => {
    if (!text.trim()) {
      addToast("Enter a topic or argument to debate.", "error");
      return;
    }
    setOriginalText(text.trim());
    setDebateTopic(text.trim().slice(0, 120));
    router.push("/debate");
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-shape-1 absolute top-[8%] left-[4%] w-36 h-36 border border-purple-900/25 rounded-full opacity-30" />
        <div className="bg-shape-2 absolute top-[20%] right-[8%] w-52 h-52 border border-purple-800/15 rotate-45 opacity-20" />
        <div className="bg-shape-3 absolute bottom-[18%] left-[12%] w-28 h-28 border border-purple-900/20 opacity-25" />
        <div
          className="bg-shape-1 absolute top-[55%] right-[18%] w-24 h-24 border border-purple-900/20 rounded-full opacity-15"
          style={{ animationDelay: "7s" }}
        />
        <div
          className="bg-shape-2 absolute bottom-[8%] right-[4%] w-44 h-44 border border-purple-800/10 rotate-12 opacity-15"
          style={{ animationDelay: "3.5s" }}
        />
        <div
          className="bg-shape-3 absolute top-[40%] left-[2%] w-20 h-20 border border-purple-900/15 opacity-20"
          style={{ animationDelay: "11s" }}
        />
        {/* Gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-12"
        >
          <div className="w-9 h-9 bg-[#7c3aed] rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">DebateCoach</span>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Dissect any argument.
            <br />
            <span className="text-[#7c3aed]">Win any debate.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Paste any text — an article, speech, or claim. Our AI breaks it apart, exposes
            fallacies, fact-checks claims, then lets you debate the AI on the topic.
          </p>
        </motion.div>

        {/* Main input card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-2xl"
        >
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an argument, article excerpt, political speech, or any claim you want to analyze..."
              className="w-full h-44 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-5 py-4 text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all"
            />
            <div className="absolute bottom-3 right-4 text-xs text-gray-600 tabular-nums">
              {text.length.toLocaleString()} chars
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Analyze argument
                </>
              )}
            </button>
            <button
              onClick={handleDebate}
              disabled={analyzing || !text.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 font-semibold py-3.5 px-6 rounded-xl border border-[#333333] transition-all duration-200 active:scale-[0.98]"
            >
              <MessageSquare size={16} />
              Start debate
            </button>
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <p className="text-xs text-gray-600 uppercase tracking-widest text-center mb-4">
            Try an example
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setText(prompt)}
                className="group text-left bg-[#0d0d0d] hover:bg-[#151515] border border-[#1e1e1e] hover:border-[#333333] rounded-xl px-4 py-3 transition-all duration-200"
              >
                <div className="flex items-start gap-2">
                  <ChevronRight
                    size={14}
                    className="text-[#7c3aed] mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform"
                  />
                  <span className="text-gray-500 group-hover:text-gray-300 text-xs leading-relaxed transition-colors line-clamp-2">
                    {prompt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
