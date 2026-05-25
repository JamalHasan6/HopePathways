export interface CheckInAnswer {
    step: number;
    answer: string;
}
export type ResultType = "crisis" | "hub" | "peer" | "info";
export type SessionStatus = "in_progress" | "completed";
export interface CheckInSession {
    id: string;
    crisis_level: ResultType;
    status: SessionStatus;
    created_at: string;
    completed_at?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    wants_call?: string | null;
    notes?: string | null;
}
export interface TriageResult {
    resultType: ResultType;
    sessionId: string;
}
export interface ContactInfo {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    wantsCall?: string;
    notes?: string;
    resultType?: ResultType;
    flags?: string[];
}
