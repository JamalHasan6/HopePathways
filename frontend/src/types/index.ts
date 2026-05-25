export interface CheckInAnswer {
  step: number;
  answer: string;
}

export type ResultType = "crisis" | "hub" | "peer" | "info";

export interface ChatStep {
  assistant: string;
  options: string[];
}

export interface TriageResult {
  resultType: ResultType;
  sessionId: string;
}

export type Classification = "self_guided" | "hub_referral" | "peer_support" | "crisis";

export interface TriagePayload {
  classification: Classification;
  crisis: boolean;
  summary: string;
  recommended_resource: string;
  language_detected: string;
  flags: string[];
}
