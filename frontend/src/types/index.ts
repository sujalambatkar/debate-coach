export interface Fallacy {
  name: string;
  explanation: string;
  quote: string;
}

export interface AnalysisResult {
  main_claim: string;
  premises: string[];
  conclusion: string;
  argument_strength: number;
  strength_reasoning: string;
  fallacies: Fallacy[];
  weak_points: string[];
  strong_points: string[];
  topic: string;
}

export interface FactCheckResult {
  claim: string;
  verdict: "true" | "false" | "disputed" | "unverifiable";
  explanation: string;
  sources: string[];
}

export interface FactCheckResponse {
  results: FactCheckResult[];
}

export interface DebateSession {
  session_id: string;
  opening_statement: string;
  ai_side: string;
}

export interface DebateScore {
  user_score: number;
  ai_score: number;
  user_strengths: string[];
  user_weaknesses: string[];
  best_argument: string;
  verdict: string;
  improvement_tips: string[];
}

export interface Message {
  role: "user" | "ai";
  content: string;
  isStreaming?: boolean;
}
