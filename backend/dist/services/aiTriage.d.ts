export type Classification = "self_guided" | "hub_referral" | "peer_support" | "crisis";
export interface TriagePayload {
    classification: Classification;
    crisis: boolean;
    summary: string;
    recommended_resource: string;
    language_detected: string;
    flags: string[];
    ai_powered: boolean;
}
export interface CheckInEntry {
    question: string;
    answer: string;
}
export interface FollowUpInput {
    currentQuestion: string;
    userAnswer: string;
    nextQuestion: string;
}
export interface NextQuestionInput {
    entries: CheckInEntry[];
    askedQuestions: string[];
}
export interface NextQuestionResult {
    question: string;
    shouldComplete: boolean;
}
export declare function hasCrisisSignal(text: string): boolean;
export declare function classifyWithAI(entries: CheckInEntry[]): Promise<TriagePayload>;
export declare function generateFollowUpWithAI(input: FollowUpInput): Promise<string>;
export declare function generateNextQuestionWithAI(input: NextQuestionInput): Promise<NextQuestionResult>;
export interface ChatTurnInput {
    conversationHistory: Array<{
        role: "assistant" | "user";
        content: string;
    }>;
    entries: CheckInEntry[];
    minQuestions?: number;
    maxQuestions?: number;
}
export interface ChatTurnResult {
    reply: string;
    shouldComplete: boolean;
}
export declare function generateChatReply(input: ChatTurnInput): Promise<ChatTurnResult>;
