"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Send,
  Award,
  Loader2,
  Zap,
  MessageSquare,
  Lightbulb,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { useToast } from "@/components/ToastContext";
import ScoreModal from "@/components/ScoreModal";
import { DebateScore, DebateSession, Message } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEBATE_TIPS = [
  "Use specific examples and statistics to back your claims.",
  "Anticipate the counter-argument before it's made.",
  "Concede small points gracefully to win the larger argument.",
  "Ask clarifying questions to expose weak premises.",
  "Keep your core argument consistent — don't shift positions.",
];

type DebateState = "setup" | "debating";

export default function DebatePage() {
  const router = useRouter();
  const { debateTopic, originalText } = useAnalysis();
  const { addToast } = useToast();

  // Setup form
  const [topic, setTopic] = useState(debateTopic || "");
  const [userSide, setUserSide] = useState<"for" | "against">("for");
  const [context, setContext] = useState("");
  const [starting, setStarting] = useState(false);

  // Debate state
  const [debateState, setDebateState] = useState<DebateState>("setup");
  const [session, setSession] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [responding, setResponding] = useState(false);

  // Argument tracker
  const [userClaims, setUserClaims] = useState<string[]>([]);
  const [aiClaims, setAiClaims] = useState<string[]>([]);

  // Tips rotation
  const [tipIndex, setTipIndex] = useState(0);

  // Score
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<DebateScore | null>(null);
  const [showScore, setShowScore] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DEBATE_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startDebate = async () => {
    if (!topic.trim()) {
      addToast("Please enter a debate topic.", "error");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`${API_URL}/api/debate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          user_side: userSide,
          argument_context: context || originalText.slice(0, 800),
        }),
      });
      if (!res.ok) throw new Error("Failed to start debate");
      const data: DebateSession = await res.json();
      setSession(data);
      setMessages([{ role: "ai", content: data.opening_statement }]);
      setDebateState("debating");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to start debate.", "error");
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || responding || !session) return;
    const msg = userInput.trim();
    setUserInput("");

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setResponding(true);

    // Optimistic AI placeholder
    setMessages((prev) => [...prev, { role: "ai", content: "", isStreaming: true }]);

    try {
      const res = await fetch(`${API_URL}/api/debate/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.session_id, user_message: msg }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.token) {
              aiContent += payload.token;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "ai") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: aiContent,
                    isStreaming: true,
                  };
                }
                return updated;
              });
            }
            if (payload.done) {
              // Finalize message and update claims
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "ai") {
                  updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
              });
              if (payload.user_claim) setUserClaims((p) => [...p, payload.user_claim]);
              if (payload.ai_claim) setAiClaims((p) => [...p, payload.ai_claim]);
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1)); // remove streaming placeholder
      addToast(e instanceof Error ? e.message : "Failed to get AI response.", "error");
    } finally {
      setResponding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getScore = async () => {
    if (!session) return;
    setScoring(true);
    try {
      const res = await fetch(`${API_URL}/api/debate/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.session_id }),
      });
      if (!res.ok) throw new Error("Failed to get score");
      const data: DebateScore = await res.json();
      setScore(data);
      setShowScore(true);
    } catch {
      addToast("Failed to generate score. Try again.", "error");
    } finally {
      setScoring(false);
    }
  };

  const resetDebate = () => {
    setDebateState("setup");
    setSession(null);
    setMessages([]);
    setUserClaims([]);
    setAiClaims([]);
    setScore(null);
    setShowScore(false);
    setUserInput("");
  };

  // ── SETUP SCREEN ──
  if (debateState === "setup") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#7c3aed]/15 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-[#7c3aed]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Debate Arena</h1>
                <p className="text-gray-500 text-xs">Configure your debate with AI</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Debate Topic
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. AI will replace most jobs within a decade"
                  className="w-full h-24 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Your Position
                </label>
                <div className="flex gap-3">
                  {(["for", "against"] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => setUserSide(side)}
                      className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-all ${
                        userSide === side
                          ? "bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa]"
                          : "bg-[#0d0d0d] border-[#2a2a2a] text-gray-500 hover:border-[#333333]"
                      }`}
                    >
                      {side === "for" ? "👍 For" : "👎 Against"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Context{" "}
                  <span className="text-gray-600 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add background context or the original text you analyzed..."
                  className="w-full h-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>

              <button
                onClick={startDebate}
                disabled={starting || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {starting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Starting debate…
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Start Debate
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── DEBATE SCREEN ──
  const aiSide = session?.ai_side ?? "against";

  return (
    <main className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 bg-[#0d0d0d] border-b border-[#1a1a1a] px-4 py-3 flex items-center gap-3">
        <button
          onClick={resetDebate}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-xs px-3 py-1 rounded-full truncate max-w-[280px]">
              {topic}
            </span>
            <span className="bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-purple-300 text-xs px-2.5 py-1 rounded-full font-semibold">
              You: {userSide.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={getScore}
          disabled={scoring || messages.length < 3}
          className="shrink-0 flex items-center gap-1.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/50 text-amber-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {scoring ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
          Get Score
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel (60%) */}
        <div className="flex flex-col flex-[3] min-w-0 border-r border-[#111111]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Zap size={12} className="text-[#7c3aed]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#7c3aed] text-white rounded-tr-sm"
                        : "bg-[#111111] border border-[#1e1e1e] text-gray-200 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <div
                        className={`prose-debate text-sm ${
                          msg.isStreaming && !msg.content ? "cursor-blink" : ""
                        } ${msg.isStreaming && msg.content ? "cursor-blink" : ""}`}
                      >
                        {msg.content ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          <span className="text-gray-500 text-sm">Thinking…</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-[#111111] bg-[#0a0a0a]">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Make your argument… (Enter to send, Shift+Enter for new line)"
                disabled={responding}
                rows={2}
                className="flex-1 bg-[#111111] border border-[#222222] focus:border-[#7c3aed] rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 text-sm resize-none focus:outline-none transition-colors disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={responding || !userInput.trim()}
                className="shrink-0 w-10 h-10 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
              >
                {responding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — argument tracker (40%) */}
        <div className="flex-[2] min-w-0 hidden md:flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Your arguments */}
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Your Arguments
                </h3>
              </div>
              {userClaims.length === 0 ? (
                <p className="text-gray-600 text-xs italic">Make your first argument…</p>
              ) : (
                <ul className="space-y-2">
                  {userClaims.map((claim, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-purple-200 text-xs"
                    >
                      <span className="text-[#7c3aed] mt-0.5 shrink-0">→</span>
                      {claim}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* AI's counter-arguments */}
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  AI&apos;s Counter-Arguments
                </h3>
              </div>
              {aiClaims.length === 0 ? (
                <p className="text-gray-600 text-xs italic">Waiting for AI to respond…</p>
              ) : (
                <ul className="space-y-2">
                  {aiClaims.map((claim, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-emerald-200 text-xs"
                    >
                      <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                      {claim}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Rotating debate tips */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-amber-400" />
                <h3 className="text-xs font-bold text-amber-500/70 uppercase tracking-wider">
                  Debate Tips
                </h3>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="text-amber-200/60 text-xs leading-relaxed"
                >
                  {DEBATE_TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
              <div className="flex gap-1 mt-3">
                {DEBATE_TIPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                      i === tipIndex ? "bg-amber-500/60" : "bg-[#222222]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={resetDebate}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-xs py-2 transition-colors"
            >
              <RotateCcw size={12} />
              Start new debate
            </button>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {score && (
        <ScoreModal
          open={showScore}
          score={score}
          userSide={userSide}
          aiSide={aiSide}
          onClose={() => setShowScore(false)}
          onDebateAgain={resetDebate}
        />
      )}
    </main>
  );
}
