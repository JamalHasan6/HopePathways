export type Classification = "self_guided" | "hub_referral" | "peer_support" | "crisis";

export type ResultType = "hub" | "crisis" | "peer" | "info";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface TriageResult {
  classification: Classification;
  crisis: boolean;
  summary: string;
  recommended_resource: string;
  language_detected: string;
  flags: string[];
  ai_powered?: boolean;
}

export interface CheckInAnswer {
  step: number;
  answer: string;
}

export interface CheckInEntry {
  question: string;
  answer: string;
}
