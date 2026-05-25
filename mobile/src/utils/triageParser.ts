import { TriageResult } from "../types";

export function parseTriageFromReply(reply: string): {
  cleanReply: string;
  triage: TriageResult | null;
} {
  const match = reply.match(/<TRIAGE>([\s\S]*?)<\/TRIAGE>/);

  if (!match) {
    return { cleanReply: reply.trim(), triage: null };
  }

  const cleanReply = reply.replace(/<TRIAGE>[\s\S]*?<\/TRIAGE>/, "").trim();

  try {
    const parsed = JSON.parse(match[1]);
    const triage: TriageResult = {
      classification: parsed.classification,
      crisis: parsed.crisis ?? false,
      summary: parsed.summary ?? "",
      recommended_resource: parsed.recommended_resource ?? "",
      language_detected: parsed.language_detected ?? "en",
      flags: parsed.flags ?? [],
    };
    return { cleanReply, triage };
  } catch {
    return { cleanReply, triage: null };
  }
}
