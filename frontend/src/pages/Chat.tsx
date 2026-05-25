import { useState, useRef, useEffect } from "react";
import ChatBubble from "../components/ChatBubble";
import TypingIndicator from "../components/TypingIndicator";
import { CheckInAnswer, ResultType } from "../types";
import { apiUrl } from "../config";
import { isCrisisText } from "../constants/crisis";

type Classification = "self_guided" | "hub_referral" | "peer_support" | "crisis";

interface TriagePayload {
  classification: Classification;
  crisis: boolean;
  summary: string;
  recommended_resource: string;
  language_detected: string;
  flags: string[];
  ai_powered?: boolean;
}

interface NextQuestionPayload {
  question: string;
  shouldComplete: boolean;
}

const OPENING_MESSAGE =
  "Hi there — I'm really glad you reached out. You don't need to have the right words, whatever you're feeling is okay to share here. What's been on your mind, or what brought you here today?";
const SESSION_STORAGE_KEY = "hp_session_id";

const CRISIS_INLINE_MESSAGE =
  "I hear you, and I want you to know that what you're feeling matters. You are not alone right now.\n\nIf you are in immediate danger, please reach out now:\n**Lifeline: 13 11 14** (24/7)\n**Emergency: 000**\n**Suicide Call Back: 1300 659 467**\n\nI'm still here with you. I'd like to take a couple of details so our team can follow up and support you properly.";

interface Message {
  text: string;
  role: "assistant" | "user";
}

function typingDelay(text: string): number {
  // Simulate reading/typing time — longer messages take longer
  const base = 800;
  const perChar = 12;
  return Math.min(base + text.length * perChar, 2200);
}

function Chat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { text: OPENING_MESSAGE, role: "assistant" },
  ]);
  const [answers, setAnswers] = useState<CheckInAnswer[]>([]);
  const [draft, setDraft] = useState("");
  const [finished, setFinished] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([OPENING_MESSAGE]);
  const [phase, setPhase] = useState<"checkin" | "details">("checkin");
  const [pendingTriage, setPendingTriage] = useState<TriagePayload | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<CheckInAnswer[]>([]);
  const [detailStep, setDetailStep] = useState(0);
  const [contactInfo, setContactInfo] = useState<{ name?: string; phone?: string }>({});
  const [endingChat, setEndingChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const triageDataRef = useRef<TriagePayload | null>(null);

  // Restore existing chat session id if present so one chat maps to one backend session.
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ensureSessionId(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current;

    try {
      const response = await fetch(apiUrl("/api/session"), { method: "POST" });
      const data = (await response.json()) as { sessionId?: string };
      if (!data.sessionId) return null;
      sessionIdRef.current = data.sessionId;
      localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      return data.sessionId;
    } catch {
      return null;
    }
  }

  async function handleSubmit(rawText: string) {
    const text = rawText.trim();
    if (!text || finished) return;

    if (phase === "details") {
      setMessages((prev) => [...prev, { text, role: "user" }]);
      setDraft("");
      handleDetailSubmit(text);
      return;
    }

    const newAnswers = [...answers, { step: currentStep + 1, answer: text }];
    setAnswers(newAnswers);
    setMessages((prev) => [...prev, { text, role: "user" }]);
    setDraft("");

    // Persist answer to backend (fire-and-forget)
    const sessionId = await ensureSessionId();
    if (sessionId) {
      fetch(apiUrl(`/api/session/${sessionId}/answer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep + 1, answer: text }),
      }).catch((err) => console.error("[Chat] Failed to persist answer:", err));
    }

    // If crisis language appears, show support inline FIRST, then move to details.
    if (isCrisisText(text)) {
      setIsTyping(true);
      const triage = await fetchAITriage(newAnswers, askedQuestions);
      await new Promise((r) => setTimeout(r, typingDelay(CRISIS_INLINE_MESSAGE)));
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: CRISIS_INLINE_MESSAGE, role: "assistant" }]);
      await new Promise((r) => setTimeout(r, 2000));
      beginDetailsCollection(
        "Could we have your phone number in case we lose contact? You can type 'skip' if you'd prefer not to.",
        triage,
        newAnswers
      );
      return;
    }

    setIsTyping(true);
    const next = await fetchAINextQuestion(newAnswers, askedQuestions);
    const fallbackQuestion = buildNextPrompt(text);
    const nextQuestion = next.question.trim() || fallbackQuestion;
    const assistantText = next.shouldComplete
      ? `${nextQuestion} Whenever you feel ready, you can tap "I'm ready to finish" below.`
      : nextQuestion;

    const delay = typingDelay(assistantText);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentStep(newAnswers.length);
      setAskedQuestions((prev) => [...prev, nextQuestion]);
      setMessages((prev) => [...prev, { text: assistantText, role: "assistant" }]);
    }, delay);
  }

  async function handleEndChat() {
    if (finished || phase !== "checkin" || endingChat) return;
    if (answers.length === 0) {
      setMessages((prev) => [
        ...prev,
        { text: "Take your time — I'd love to hear at least a little about what's going on before we wrap up, so I can point you in the right direction.", role: "assistant" },
      ]);
      return;
    }

    setEndingChat(true);
    setIsTyping(true);
    const triage = await fetchAITriage(answers, askedQuestions);
    const msg = "Thank you for sharing with me today — it means a lot that you trusted me with this. Before we finish, could I take a couple of details so someone from our team can check in on you?";
    await new Promise((r) => setTimeout(r, typingDelay(msg)));
    setIsTyping(false);
    beginDetailsCollection(msg, triage, answers);
    setEndingChat(false);
  }

  function handleRestart() {
    localStorage.removeItem("hp_answers");
    localStorage.removeItem("hp_resultType");
    localStorage.removeItem("hp_triage");
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentStep(0);
    setDraft("");
    setFinished(false);
    setAnswers([]);
    setAskedQuestions([OPENING_MESSAGE]);
    setPhase("checkin");
    setPendingTriage(null);
    setPendingAnswers([]);
    setDetailStep(0);
    setContactInfo({});
    setIsTyping(false);
    setMessages([{ text: OPENING_MESSAGE, role: "assistant" }]);
    triageDataRef.current = null;

    sessionIdRef.current = null;
  }

  function beginDetailsCollection(
    message: string,
    triage: TriagePayload,
    finalAnswers: CheckInAnswer[]
  ) {
    setPendingTriage(triage);
    setPendingAnswers(finalAnswers);
    triageDataRef.current = triage;
    setPhase("details");
    setDetailStep(0);
    setContactInfo({});

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: message,
          role: "assistant",
        },
      ]);
    }, 250);
  }

  function normalizeOptionalValue(value: string): string | undefined {
    const v = value.trim();
    if (!v) return undefined;
    if (["skip", "prefer not", "n/a", "na", "none"].includes(v.toLowerCase())) return undefined;
    return v;
  }

  function handleDetailSubmit(input: string) {
    const normalized = normalizeOptionalValue(input);
    let nextInfo = { ...contactInfo };

    if (detailStep === 0) {
      // Collected phone first, then ask for preferred name.
      nextInfo = { ...nextInfo, phone: normalized };
      setDetailStep(1);
      setContactInfo(nextInfo);
      setMessages((prev) => [
        ...prev,
        {
          text: "What name would you like us to use for you?",
          role: "assistant",
        },
      ]);
      return;
    }

    if (detailStep === 1) {
      // Collected preferred name, then ask about immediate online support.
      nextInfo = { ...nextInfo, name: normalized };
      setDetailStep(2);
      setContactInfo(nextInfo);
      setMessages((prev) => [
        ...prev,
        {
          text: "Thank you for sharing that. Would you like to talk to someone online right now? You can say yes, no, or skip.",
          role: "assistant",
        },
      ]);
      return;
    }

    // Step 1 — collected online support preference, save details and keep chatting.
    const wantsOnlineSupport = !!normalized && ["yes", "y", "sure", "ok", "okay", "please"].includes(normalized.toLowerCase());
    if (!pendingTriage) return;

    if (wantsOnlineSupport) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Online support right now: Lifeline 13 11 14 (lifeline.org.au). Thank you.",
          role: "assistant",
        },
      ]);
    }

    const updatedNotes = wantsOnlineSupport
      ? `${pendingTriage.summary}\nUser asked for immediate online support options.`
      : pendingTriage.summary;
    const triageWithNotes: TriagePayload = { ...pendingTriage, summary: updatedNotes };

    setContactInfo(nextInfo);
    finalizeWithTriage(
      "Thank you for sharing that with me.",
      triageWithNotes,
      pendingAnswers,
      nextInfo
    );
  }

  function finalizeWithTriage(
    message: string,
    triage: TriagePayload,
    finalAnswers: CheckInAnswer[],
    details?: { name?: string; phone?: string }
  ) {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: message, role: "assistant" }]);
    }, typingDelay(message));

    setTimeout(async () => {
      localStorage.setItem("hp_answers", JSON.stringify(finalAnswers));
      localStorage.setItem("hp_triage", JSON.stringify(triage));
      localStorage.setItem("hp_resultType", classificationToResultType(triage.classification));

      // Save contact details while keeping the chat active.
      const sessionId = await ensureSessionId();
      if (sessionId) {
        try {
          await fetch(apiUrl(`/api/session/${sessionId}/details`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: details?.name,
              phone: details?.phone,
              notes: triage.summary,
              flags: triage.flags,
            }),
          });
        } catch {
          // Backend unavailable — continue chat without persistence
        }
      }

      setFinished(true);
      setPhase("checkin");
      setPendingTriage(null);
      setPendingAnswers([]);
      setDetailStep(0);
      setContactInfo({});
      setIsTyping(true);
      const closingMsg = "Thank you for reaching out today. Your details have been saved and our team will follow up with you. Take care of yourself — and remember, Lifeline is always available on **13 11 14** if you need someone to talk to.";
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { text: closingMsg, role: "assistant" },
        ]);
      }, typingDelay(closingMsg));
    }, 2400);
  }

  return (
    <div className="chat-wrapper">
      {/* Header */}
      <div className="chat-header">
        <div className="logo">🌿 Hope Pathways</div>
        <div className="chat-subtitle">Support navigator</div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <ChatBubble key={i} text={msg.text} role={msg.role} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Text input */}
      <div className="chat-footer">
        <input
          type="text"
          value={draft}
          disabled={finished}
          placeholder={finished ? "Check-in complete" : "Type your reply here..."}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(draft);
            }
          }}
        />
        <button className="btn btn-accent btn-small" disabled={finished} onClick={() => handleSubmit(draft)}>
          Send
        </button>
      </div>

      {phase === "checkin" && !finished && (
        <button className="end-chat-link" onClick={handleEndChat} disabled={endingChat}>
          {endingChat ? "One moment..." : "I'm ready to finish"}
        </button>
      )}
    </div>
  );
}

async function fetchAINextQuestion(
  answers: CheckInAnswer[],
  askedQuestions: string[]
): Promise<NextQuestionPayload> {
  try {
    const entries = answers.map((a, idx) => ({
      question: askedQuestions[idx] ?? `Question ${a.step}`,
      answer: a.answer,
    }));

    const res = await fetch(apiUrl("/api/triage/next-question"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries,
        askedQuestions,
      }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = (await res.json()) as Partial<NextQuestionPayload>;
    if (typeof data.question !== "string") throw new Error("Missing next question");
    return {
      question: data.question,
      shouldComplete: !!data.shouldComplete,
    };
  } catch {
    const lastAnswer = answers.length > 0 ? answers[answers.length - 1].answer : "";
    return {
      question: buildNextPrompt(lastAnswer),
      shouldComplete: answers.length >= 4,
    };
  }
}

async function fetchAITriage(answers: CheckInAnswer[], askedQuestions: string[]): Promise<TriagePayload> {
  try {
    const entries = answers.map((a, idx) => ({
      question: askedQuestions[idx] ?? `Check-in question ${a.step}`,
      answer: a.answer,
    }));

    const res = await fetch(apiUrl("/api/triage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return (await res.json()) as TriagePayload;
  } catch {
    // API unavailable — fall back to client-side rule-based triage
    return buildTriage(answers);
  }
}

function buildNextPrompt(lastUserText: string): string {
  const reflection = buildReflection(lastUserText);
  const followUps = [
    "What has felt hardest for you in the last few days?",
    "When do these feelings hit you the most during the day?",
    "What support, if any, has helped even a little so far?",
    "Is there someone you trust that you can lean on right now?",
    "What would feeling a bit safer tonight look like for you?",
  ];

  const index = Math.floor(Math.random() * followUps.length);
  return `${reflection} ${followUps[index]}`;
}

function buildReflection(text: string): string {
  if (text.length < 12) {
    return "Thanks for sharing that with me.";
  }
  return "Thank you for sharing that, it sounds like this has been really hard.";
}



function buildTriage(answers: CheckInAnswer[]): TriagePayload {
  const transcript = answers.map((a) => a.answer).join(" ").toLowerCase();

  let classification: Classification = "hub_referral";

  if (isCrisisText(transcript)) {
    classification = "crisis";
  } else if (
    includesAny(transcript, ["community", "peer", "group", "connection", "not ready for clinic"])
  ) {
    classification = "peer_support";
  } else if (
    includesAny(transcript, ["information", "tips", "coping", "resources", "just want info", "self help"]) &&
    !includesAny(transcript, ["struggling", "not coping", "hard", "overwhelmed"])
  ) {
    classification = "self_guided";
  }

  const flags = deriveFlags(transcript);
  const language = detectLanguage(answers.map((a) => a.answer).join(" "));
  const summary = buildSummary(answers, classification);

  return {
    classification,
    crisis: classification === "crisis",
    summary,
    recommended_resource: recommendedResource(classification),
    language_detected: language,
    flags,
  };
}

function buildSummary(answers: CheckInAnswer[], classification: Classification): string {
  const keyPoints = answers.slice(0, 3).map((a) => a.answer).join(" | ");
  if (classification === "self_guided") {
    return `Person reports mild to moderate stress and is primarily seeking practical information and coping supports. Main themes shared: ${keyPoints}. No immediate safety indicators were disclosed in this check-in.`;
  }
  if (classification === "peer_support") {
    return `Person is experiencing distress and appears to value connection-based support with others who understand lived experience. Main themes shared: ${keyPoints}. No immediate safety risk language was disclosed.`;
  }
  if (classification === "crisis") {
    return "Person disclosed high-risk language suggestive of immediate safety concerns. Urgent crisis support and emergency escalation are recommended without delay.";
  }
  return `Person appears to be struggling to cope and would likely benefit from a warm, in-person, low-barrier service. Main themes shared: ${keyPoints}. A hub-based referral is recommended as the next step.`;
}

function deriveFlags(transcript: string): string[] {
  const flags: string[] = [];
  if (includesAny(transcript, ["first time", "never spoken", "not before", "new to this"])) {
    flags.push("first_time_seeker");
  }
  if (includesAny(transcript, ["alone", "no one", "isolated", "by myself"])) {
    flags.push("social_isolation");
  }
  if (includesAny(transcript, ["emergency", "ed", "hospital", "psych ward", "presented"])) {
    flags.push("previous_ed_presentation");
  }
  if (includesAny(transcript, ["interpreter", "migrant", "refugee", "english is not my first language"])) {
    flags.push("cald_background");
  }
  return flags;
}

function detectLanguage(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0102\u0103\u00C2\u00E2\u0110\u0111\u00CA\u00EA\u00D4\u00F4\u01A0\u01A1\u01AF\u01B0]/.test(text)) return "vi";
  return "en";
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((word) => text.includes(word));
}

function recommendedResource(classification: Classification): string {
  if (classification === "crisis") return "Lifeline 13 11 14 / Emergency 000";
  if (classification === "peer_support") return "SANE Forums";
  if (classification === "self_guided") return "Beyond Blue";
  return "Hope Pathways Health and Wellbeing Hub";
}

function classificationToResultType(classification: Classification): ResultType {
  if (classification === "crisis") return "crisis";
  if (classification === "peer_support") return "peer";
  if (classification === "self_guided") return "info";
  return "hub";
}

export default Chat;
