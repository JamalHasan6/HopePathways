// Must stay in sync with CRISIS_SIGNALS in backend/src/services/aiTriage.ts
export const CRISIS_SIGNALS = [
  "suicide",
  "kill myself",
  "end it",
  "end my life",
  "self harm",
  "self-harm",
  "harm myself",
  "harm others",
  "immediate danger",
  "i can't go on",
  "i cant go on",
  "i want to end it",
  "i don't want to be here",
  "i dont want to be here",
  "want to die",
  "no point living",
  "not worth living",
] as const;

export function isCrisisText(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_SIGNALS.some((signal) => lower.includes(signal));
}
