"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Award, Lightbulb, RotateCcw, Search } from "lucide-react";
import CircularProgress from "./CircularProgress";
import { DebateScore } from "@/types";
import { useRouter } from "next/navigation";

interface ScoreModalProps {
  open: boolean;
  score: DebateScore;
  userSide: string;
  aiSide: string;
  onClose: () => void;
  onDebateAgain: () => void;
}

export default function ScoreModal({
  open,
  score,
  userSide,
  aiSide,
  onClose,
  onDebateAgain,
}: ScoreModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#111111] border border-[#222222] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#222222]">
              <div className="flex items-center gap-3">
                <Award className="text-[#7c3aed]" size={24} />
                <h2 className="text-xl font-bold text-white">Debate Score</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#222222]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Score rings */}
              <div className="flex items-center justify-center gap-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <CircularProgress value={score.user_score} color="#7c3aed" />
                  <span className="text-sm font-semibold text-gray-300">
                    You ({userSide.toUpperCase()})
                  </span>
                </motion.div>

                <div className="text-3xl font-bold text-[#333333]">vs</div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <CircularProgress value={score.ai_score} color="#059669" />
                  <span className="text-sm font-semibold text-gray-300">
                    AI ({aiSide.toUpperCase()})
                  </span>
                </motion.div>
              </div>

              {/* Verdict */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#0d0d0d] border border-[#222222] rounded-xl p-5"
              >
                <p className="text-gray-300 text-sm leading-relaxed">{score.verdict}</p>
              </motion.div>

              {/* Best argument */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-amber-400" />
                  <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    Best Argument
                  </span>
                </div>
                <p className="text-amber-100 text-sm leading-relaxed">{score.best_argument}</p>
              </motion.div>

              {/* Strengths & Weaknesses */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-green-400" />
                    <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">
                      Your Strengths
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {score.user_strengths.map((s, i) => (
                      <li key={i} className="text-green-200 text-xs flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={14} className="text-red-400" />
                    <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                      Your Weaknesses
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {score.user_weaknesses.map((w, i) => (
                      <li key={i} className="text-red-200 text-xs flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Improvement tips */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-[#0d0d0d] border border-[#222222] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-[#7c3aed]" />
                  <span className="text-[#7c3aed] text-xs font-semibold uppercase tracking-wider">
                    How to Improve
                  </span>
                </div>
                <ol className="space-y-2">
                  {score.improvement_tips.map((tip, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-3">
                      <span className="text-[#7c3aed] font-bold shrink-0">{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onDebateAgain}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold py-3 px-5 rounded-xl transition-colors"
                >
                  <RotateCcw size={16} />
                  Debate Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] text-gray-300 font-semibold py-3 px-5 rounded-xl border border-[#333333] transition-colors"
                >
                  <Search size={16} />
                  Analyze New Text
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
