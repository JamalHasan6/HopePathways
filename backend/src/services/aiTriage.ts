import OpenAI from "openai";

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

// ─── Rule-based fallback ──────────────────────────────────────────────────────

const CRISIS_SIGNALS = [
  "suicide", "kill myself", "end it", "end my life", "self harm", "self-harm",
  "harm myself", "harm others", "immediate danger", "i can't go on", "i cant go on",
  "i want to end it", "i don't want to be here", "i dont want to be here",
  "want to die", "no point living", "not worth living",
];

export function hasCrisisSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_SIGNALS.some((s) => lower.includes(s));
}

function fallbackFollowUpQuestion(input: FollowUpInput): string {
  const answer = input.userAnswer.trim();
  const gentleLead = answer.length < 18
    ? "Thanks for sharing that."
    : "Thank you for sharing that with me, it sounds like this has been really hard.";

  return `${gentleLead} ${input.nextQuestion}`;
}

function fallbackNextQuestion(input: NextQuestionInput): NextQuestionResult {
  const questionBank = [
    "What has felt heaviest for you today?",
    "When these feelings show up, what is usually happening around you?",
    "What has helped even a little when this gets hard?",
    "Do you have someone you trust that you could reach out to right now?",
    "What would make tonight feel a little safer for you?",
    "Have you had support from a GP, counsellor, or community service before?",
    "Is there anything that makes asking for help harder for you?",
  ];

  const asked = new Set(input.askedQuestions.map((q) => q.toLowerCase().trim()));
  const candidates = questionBank.filter((q) => !asked.has(q.toLowerCase()));
  if (candidates.length === 0 && input.entries.length >= 2) {
    return { question: "", shouldComplete: true };
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    ?? "What feels most important for me to understand before we choose your support pathway?";

  return { question: chosen, shouldComplete: false };
}

function getAIClient(): OpenAI | null {
  const token = process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY;
  if (!token) return null;

  const isGitHubModels = !!process.env.GITHUB_TOKEN && !process.env.OPENAI_API_KEY;
  return new OpenAI({
    baseURL: isGitHubModels ? "https://models.inference.ai.azure.com" : undefined,
    apiKey: token,
  });
}

function ruleBasedClassify(transcript: string): Classification {
  if (hasCrisisSignal(transcript)) return "crisis";
  const lower = transcript.toLowerCase();
  if (/community|peer|group|connection|lived experience|not ready for clinic/.test(lower)) return "peer_support";
  if (/information|tips|coping|resources|just want info|self help/.test(lower) &&
      !/struggling|not coping|overwhelmed|exhausted|hopeless/.test(lower)) return "self_guided";
  return "hub_referral";
}

function ruleBasedFlags(transcript: string): string[] {
  const flags: string[] = [];
  const lower = transcript.toLowerCase();
  if (/first time|never spoken|not before|new to this/.test(lower)) flags.push("first_time_seeker");
  if (/alone|no one|isolated|by myself/.test(lower)) flags.push("social_isolation");
  if (/emergency|hospital|ed |ambulance/.test(lower)) flags.push("previous_ed_presentation");
  return flags;
}

function ruleBasedResource(c: Classification): string {
  if (c === "crisis") return "Lifeline 13 11 14 / Emergency 000";
  if (c === "peer_support") return "SANE Forums — sane.org";
  if (c === "self_guided") return "Beyond Blue — beyondblue.org.au";
  return "Hope Pathways Health & Wellbeing Hub (Mon-Fri 9am-8pm, Sat 10am-4pm, Newcastle NSW)";
}

function fallbackTriage(entries: CheckInEntry[]): TriagePayload {
  const transcript = entries.map((e) => e.answer).join(" ");
  const classification = ruleBasedClassify(transcript);
  return {
    classification,
    crisis: classification === "crisis",
    summary: `Person completed a ${entries.length}-step guided check-in. Key responses: ${entries.slice(0, 3).map((e) => e.answer).join(" | ")}.`,
    recommended_resource: ruleBasedResource(classification),
    language_detected: "en",
    flags: ruleBasedFlags(transcript),
    ai_powered: false,
  };
}

// ─── AI-powered triage ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a clinical triage assistant for Hope Pathways, a mental health navigation service in Newcastle, NSW, Australia (Lake Macquarie Newcastle Suicide Prevention Network).

Your role is to analyse a brief guided check-in conversation and produce a structured triage classification in JSON format.

CLASSIFICATION RULES (choose exactly one):
- "crisis": Any mention of suicidal ideation, self-harm, wanting to die, ending one's life, immediate danger, or not wanting to be here. This is HIGHEST PRIORITY — escalate immediately.
- "peer_support": Person wants community, connection, lived experience, peer-based support, or explicitly says they are not ready for a clinical setting.
- "self_guided": Mild stress, seeking information, coping tips, psychoeducation, no risk indicators and NOT struggling significantly.
- "hub_referral": DEFAULT for moderate distress, wanting to talk to someone, struggling to cope, no acute crisis, no clear peer preference. Use this when in doubt.

AVAILABLE RESOURCES:
- Hope Pathways Health & Wellbeing Hub: Walk-in, free, Mon-Fri 9am-8pm, Sat 10am-4pm, Newcastle NSW
- Lifeline: 13 11 14 (24/7)
- Emergency: 000
- SANE Forums: sane.org
- Beyond Blue: beyondblue.org.au

FLAGS TO DETECT (include all that apply):
- first_time_seeker: first time seeking mental health help
- social_isolation: mentions being alone, having no one, isolated
- previous_ed_presentation: mentions hospital emergency department
- cald_background: non-English language detected or mentions cultural/language barriers

LANGUAGE DETECTION: Return "en" for English, "ar" for Arabic, "zh" for Chinese, "vi" for Vietnamese. Default "en".

CRITICAL: If there is ANY doubt about safety, classify as "crisis".

Respond ONLY with valid JSON matching this exact schema:
{
  "classification": "self_guided" | "hub_referral" | "peer_support" | "crisis",
  "crisis": boolean,
  "summary": "2-3 sentences written for a clinician summarising the person's presentation and recommended action",
  "recommended_resource": "specific resource name and contact details",
  "language_detected": "en",
  "flags": ["flag1", "flag2"]
}`;

export async function classifyWithAI(entries: CheckInEntry[]): Promise<TriagePayload> {
  const client = getAIClient();
  if (!client) {
    console.warn("[aiTriage] No API key set — using rule-based fallback");
    return fallbackTriage(entries);
  }

  const conversationText = entries
    .map((e, i) => `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.answer}`)
    .join("\n\n");

  const userMessage = `Please triage this mental health check-in conversation:\n\n${conversationText}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1, // low temperature for consistent clinical output
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI");

    const parsed = JSON.parse(raw) as Partial<TriagePayload>;

    // Validate required fields
    const validClassifications = ["self_guided", "hub_referral", "peer_support", "crisis"];
    if (!parsed.classification || !validClassifications.includes(parsed.classification)) {
      throw new Error(`Invalid classification: ${parsed.classification}`);
    }

    // Safety override: if transcript has crisis signals, always classify as crisis
    const transcript = entries.map((e) => e.answer).join(" ");
    if (hasCrisisSignal(transcript) && parsed.classification !== "crisis") {
      console.warn("[aiTriage] AI missed crisis signal — overriding to crisis");
      parsed.classification = "crisis";
      parsed.crisis = true;
    }

    return {
      classification: parsed.classification,
      crisis: parsed.crisis ?? parsed.classification === "crisis",
      summary: parsed.summary ?? "Check-in completed.",
      recommended_resource: parsed.recommended_resource ?? ruleBasedResource(parsed.classification),
      language_detected: parsed.language_detected ?? "en",
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      ai_powered: true,
    };
  } catch (err) {
    console.error("[aiTriage] AI call failed, falling back to rules:", err);
    return fallbackTriage(entries);
  }
}

export async function generateFollowUpWithAI(input: FollowUpInput): Promise<string> {
  if (hasCrisisSignal(input.userAnswer)) {
    return "Thank you for telling me that. Your safety matters right now. If you are in immediate danger, call 000 now. You can also call Lifeline on 13 11 14 while we stay with you.";
  }

  const client = getAIClient();
  if (!client) {
    return fallbackFollowUpQuestion(input);
  }

  const systemPrompt = `You are a warm support navigator for Hope Pathways.

Write one short, human follow-up message (1-2 sentences) based on the user's latest answer.
- Be calm, empathetic, plain-language.
- No clinical jargon.
- Gently reflect what they said, then ask the exact next question provided.
- Do not add diagnosis.
- Keep it under 45 words.
- Return plain text only.`;

  const userPrompt = `Current question: ${input.currentQuestion}
User answer: ${input.userAnswer}
Next question to ask exactly: ${input.nextQuestion}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 120,
    });

    const text = response.choices[0]?.message?.content?.trim();
    return text || fallbackFollowUpQuestion(input);
  } catch (err) {
    console.error("[aiTriage] Follow-up generation failed, using fallback:", err);
    return fallbackFollowUpQuestion(input);
  }
}

export async function generateNextQuestionWithAI(input: NextQuestionInput): Promise<NextQuestionResult> {
  const transcript = input.entries
    .map((entry, index) => `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}`)
    .join("\n\n");

  const client = getAIClient();
  if (!client) {
    return fallbackNextQuestion(input);
  }

  const systemPrompt = `You are a warm support navigator for Hope Pathways.

Create the NEXT single question for a mental health check-in.
- Use plain, compassionate language.
- Keep question <= 22 words.
- Do not repeat previously asked questions.
- Avoid clinical jargon and diagnosis.
- If enough information has been gathered, return shouldComplete=true.
- Always return JSON with shape: {"question": string, "shouldComplete": boolean}`;

  const userPrompt = `Asked questions:\n${input.askedQuestions.join("\n- ")}\n\nConversation so far:\n${transcript}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 140,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI");

    const parsed = JSON.parse(raw) as Partial<NextQuestionResult>;
    if (parsed.shouldComplete) {
      return { question: "", shouldComplete: true };
    }

    const question = (parsed.question ?? "").trim();
    if (!question) {
      return fallbackNextQuestion(input);
    }

    return { question, shouldComplete: false };
  } catch (err) {
    console.error("[aiTriage] Next question generation failed, using fallback:", err);
    return fallbackNextQuestion(input);
  }
}

// ─── Conversational chat reply ────────────────────────────────────────────────

export interface ChatTurnInput {
  conversationHistory: Array<{ role: "assistant" | "user"; content: string }>;
  entries: CheckInEntry[];
  minQuestions?: number;
  maxQuestions?: number;
}

export interface ChatTurnResult {
  reply: string;
  shouldComplete: boolean;
}

function contentAwareAck(answer: string): string {
  const a = answer.toLowerCase();
  if (a.length < 15) return "Thank you for sharing that.";
  if (/\balone\b|no one|nobody|isolated|by myself|no friends/.test(a))
    return "That sounds really isolating, and I want you to know you are not alone right now.";
  if (/\bwork\b|job|boss|career|unemployed|workplace/.test(a))
    return "It sounds like there is a lot of pressure around work — that can be really exhausting.";
  if (/family|partner|\bkids\b|children|relationship|husband|wife|\bmum\b|\bdad\b/.test(a))
    return "Thank you for sharing that — relationships can carry so much weight.";
  if (/sleep|tired|exhausted|no energy|fatigue/.test(a))
    return "When rest is hard to come by, everything feels heavier — I hear that.";
  if (/not coping|overwhelmed|too much|can't handle|cant handle|struggling/.test(a))
    return "Thank you for being so honest — it takes courage to say that things feel overwhelming.";
  if (/\bokay\b|\bfine\b|\bgood\b|\balright\b/.test(a))
    return "I am glad to hear that, though it sounds like something brought you here today.";
  return "Thank you for sharing that — it sounds like things have been really hard.";
}

function contentAwareQuestion(answer: string, askedSoFar: string[]): string | null {
  const a = answer.toLowerCase();
  // askedSoFar contains full assistant messages (ack + question), so use .includes() not .has()
  const askedLower = askedSoFar.map((q) => q.toLowerCase());
  const isAsked = (question: string) =>
    askedLower.some((msg) => msg.includes(question.toLowerCase()));

  const candidates: Array<{ trigger?: RegExp; question: string }> = [
    { trigger: /alone|no one|nobody|isolated/, question: "Do you have someone you trust that you could reach out to right now?" },
    { trigger: /sleep|tired|exhausted/, question: "How has your sleep and eating been lately?" },
    { trigger: /work|job|boss|career/, question: "How has all of this been affecting your day-to-day life?" },
    { trigger: /family|partner|relationship|kids|children/, question: "How are things at home affecting how you are feeling?" },
    { trigger: /overwhelmed|too much|struggling|not coping/, question: "What has helped you cope, even a little, when things get hard?" },
    { question: "What has felt heaviest for you over the last few days?" },
    { question: "When these feelings show up, what is usually happening around you?" },
    { question: "Have you spoken to a GP, counsellor, or support service about this before?" },
    { question: "Is there anything that makes reaching out or getting support harder for you?" },
    { question: "What would help you feel even a little safer or calmer right now?" },
  ];

  const triggered = candidates.find((c) => c.trigger && c.trigger.test(a) && !isAsked(c.question));
  if (triggered) return triggered.question;

  const general = candidates.filter((c) => !c.trigger && !isAsked(c.question));
  return general[0]?.question ?? null;
}

function fallbackChatReply(input: ChatTurnInput): ChatTurnResult {
  const max = input.maxQuestions ?? 6;
  const min = input.minQuestions ?? 3;
  const count = input.entries.length;

  if (count >= max) return { reply: "", shouldComplete: true };

  const lastAnswer = input.entries[count - 1]?.answer ?? "";
  const askedSoFar = input.conversationHistory
    .filter((m) => m.role === "assistant")
    .map((m) => m.content);

  const ack = contentAwareAck(lastAnswer);
  const nextQ = contentAwareQuestion(lastAnswer, askedSoFar);

  if (!nextQ || count >= min && !nextQ) {
    return { reply: "", shouldComplete: true };
  }

  return { reply: `${ack} ${nextQ}`, shouldComplete: false };
}

export async function generateChatReply(input: ChatTurnInput): Promise<ChatTurnResult> {
  const max = input.maxQuestions ?? 6;
  const min = input.minQuestions ?? 3;

  if (input.entries.length >= max) return { reply: "", shouldComplete: true };

  // Safety: always intercept crisis language before hitting AI
  const lastAnswer = input.entries[input.entries.length - 1]?.answer ?? "";
  if (hasCrisisSignal(lastAnswer)) {
    return {
      reply: "Thank you for telling me that. Your safety matters right now. If you are in immediate danger, please call 000 now. You can also call Lifeline on 13 11 14 — they are available 24 hours a day, 7 days a week.",
      shouldComplete: true,
    };
  }

  const client = getAIClient();
  if (!client) return fallbackChatReply(input);

  const systemPrompt = `You are a warm, calm support navigator for Hope Pathways — a mental health navigation service in Newcastle, NSW, Australia.

Your job: keep a safe, empathetic conversation to understand how the person is feeling and what support they need.

RULES:
- Read the person's latest message carefully and respond to it specifically.
- Start with ONE short empathetic acknowledgement sentence — reflect something they actually said, not a generic phrase.
- Then ask ONE open-ended follow-up question (max 20 words) that naturally follows from their answer.
- Plain language only — no clinical jargon, no diagnosis.
- Never ask about suicidal thoughts directly; if risk is apparent, acknowledge and provide Lifeline 13 11 14 / 000.
- If you have gathered enough information (at least ${min} questions answered, up to ${max} max), return shouldComplete=true with a gentle closing sentence instead of a question.

The person has answered ${input.entries.length} question(s) so far. Min: ${min}, Max: ${max}.

Reply ONLY with JSON: {"reply": "your full message here", "shouldComplete": boolean}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...input.conversationHistory.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.5,
      max_tokens: 180,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    const parsed = JSON.parse(raw) as { reply?: string; shouldComplete?: boolean };
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) throw new Error("No reply in response");

    return { reply: parsed.reply.trim(), shouldComplete: !!parsed.shouldComplete };
  } catch (err) {
    console.error("[aiTriage] generateChatReply failed, using fallback:", err);
    return fallbackChatReply(input);
  }
}
