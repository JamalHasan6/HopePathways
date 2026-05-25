const CRISIS_PHRASES = [
  "suicide",
  "kill myself",
  "end my life",
  "self harm",
  "i want to die",
  "i can't go on",
  "don't want to be here",
  "i want to end it",
  "no reason to live",
];

export function detectLocalCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}
