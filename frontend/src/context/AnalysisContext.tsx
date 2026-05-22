"use client";

import React, { createContext, useContext, useState } from "react";
import { AnalysisResult } from "@/types";

interface AnalysisContextType {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  originalText: string;
  setOriginalText: (text: string) => void;
  debateTopic: string;
  setDebateTopic: (topic: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [debateTopic, setDebateTopic] = useState("");

  return (
    <AnalysisContext.Provider
      value={{
        analysisResult,
        setAnalysisResult,
        originalText,
        setOriginalText,
        debateTopic,
        setDebateTopic,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisContextType {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
