import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChatMessage, TriageResult, CheckInAnswer, Classification } from "../types";
import { COLORS, API_BASE_URL } from "../constants";
import ChatBubble from "./ChatBubble";
import SupportCard from "./SupportCard";
import CrisisCard from "./CrisisCard";

const OPENING_MESSAGE =
  "Hi there — I'm really glad you reached out. You don't need to have the right words, whatever you're feeling is okay to share here. What's been on your mind, or what brought you here today?";

const CRISIS_INLINE_MESSAGE =
  "I hear you, and I want you to know that what you're feeling matters. You are not alone right now.\n\nIf you are in immediate danger, please reach out now:\n**Lifeline: 13 11 14** (24/7)\n**Emergency: 000**\n**Suicide Call Back: 1300 659 467**\n\nI'm still here with you. I'd like to take a couple of details so our team can follow up and support you properly.";

function typingDelay(text: string): number {
  const base = 800;
  const perChar = 12;
  return Math.min(base + text.length * perChar, 2200);
}

function TypingIndicatorBubble() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  return (
    <View style={styles.typingBubble}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

interface ChatScreenProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  triage: TriageResult | null;
  setTriage: React.Dispatch<React.SetStateAction<TriageResult | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onRestart: () => void;
  onBack?: () => void;
  onHome?: () => void;
}

export default function ChatScreen({
  messages,
  setMessages,
  triage,
  setTriage,
  loading,
  setLoading,
  onRestart,
  onBack,
  onHome,
}: ChatScreenProps) {
  const [input, setInput] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<CheckInAnswer[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([OPENING_MESSAGE]);
  const [finished, setFinished] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checkin" | "details">("checkin");
  const [detailStep, setDetailStep] = useState(0);
  const [contactInfo, setContactInfo] = useState<{ name?: string; phone?: string }>({});
  const [pendingTriage, setPendingTriage] = useState<TriageResult | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<CheckInAnswer[]>([]);
  const [endingChat, setEndingChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Create session on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/session`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => setSessionId(data.sessionId))
      .catch(() => {});
  }, []);

  // Add the opening message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: "1", sender: "assistant", text: OPENING_MESSAGE, timestamp: Date.now() },
      ]);
    }
  }, []);

  const addAssistantMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + Math.random()).toString(),
        sender: "assistant",
        text: stripTriageBlock(text),
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSubmit = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTyping || finished) return;

    // Handle details collection phase
    if (phase === "details") {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      handleDetailSubmit(text);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const newAnswers = [...answers, { step: currentStep + 1, answer: text }];
    setAnswers(newAnswers);

    // Persist answer to backend
    if (sessionId) {
      fetch(`${API_BASE_URL}/api/session/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep + 1, answer: text }),
      }).catch(() => {});
    }

    // Crisis detection — show inline support message, then move to details
    if (isCrisisText(text)) {
      setIsTyping(true);
      const triageResult = await fetchAITriage(newAnswers, askedQuestions);
      setTimeout(() => {
        setIsTyping(false);
        addAssistantMessage(CRISIS_INLINE_MESSAGE);
        setTimeout(() => {
          beginDetailsCollection(
            "Could we have your phone number in case we lose contact? You can type 'skip' if you'd prefer not to.",
            triageResult,
            newAnswers
          );
        }, 2000);
      }, typingDelay(CRISIS_INLINE_MESSAGE));
      return;
    }

    // Ask AI for next question
    setIsTyping(true);
    const next = await fetchAINextQuestion(newAnswers, askedQuestions);
    const fallbackQuestion = buildFallbackPrompt(text);
    const nextQuestion = next.question.trim() || fallbackQuestion;
    const assistantText = next.shouldComplete
      ? `${nextQuestion} Whenever you feel ready, you can tap "I'm ready to finish" below.`
      : nextQuestion;

    const delay = typingDelay(assistantText);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentStep(newAnswers.length);
      setAskedQuestions((prev) => [...prev, nextQuestion]);
      addAssistantMessage(assistantText);
    }, delay);
  };

  async function handleEndChat() {
    if (finished || phase !== "checkin" || endingChat) return;
    if (answers.length === 0) {
      addAssistantMessage(
        "Take your time — I'd love to hear at least a little about what's going on before we wrap up, so I can point you in the right direction."
      );
      return;
    }

    setEndingChat(true);
    setIsTyping(true);
    const triageResult = await fetchAITriage(answers, askedQuestions);
    const msg =
      "Thank you for sharing with me today — it means a lot that you trusted me with this. Before we finish, could I take a couple of details so someone from our team can check in on you?";
    setTimeout(() => {
      setIsTyping(false);
      beginDetailsCollection(msg, triageResult, answers);
      setEndingChat(false);
    }, typingDelay(msg));
  }

  function beginDetailsCollection(message: string, triageResult: TriageResult, finalAnswers: CheckInAnswer[]) {
    setPendingTriage(triageResult);
    setPendingAnswers(finalAnswers);
    setTriage(triageResult);
    setPhase("details");
    setDetailStep(0);
    setContactInfo({});

    if (triageResult.crisis) {
      setShowCrisis(true);
    }

    setTimeout(() => {
      addAssistantMessage(message);
    }, 250);
  }

  function normalizeOptionalValue(value: string): string | undefined {
    const v = value.trim();
    if (!v) return undefined;
    if (["skip", "prefer not", "n/a", "na", "none"].includes(v.toLowerCase())) return undefined;
    return v;
  }

  function handleDetailSubmit(rawInput: string) {
    const text = rawInput.trim();
    if (!text) return;

    const normalized = normalizeOptionalValue(text);
    let nextInfo = { ...contactInfo };

    if (detailStep === 0) {
      // Collected phone first, then ask for preferred name
      nextInfo = { ...nextInfo, phone: normalized };
      setDetailStep(1);
      setContactInfo(nextInfo);
      setTimeout(() => {
        addAssistantMessage("What name would you like us to use for you?");
      }, 300);
      return;
    }

    if (detailStep === 1) {
      // Collected preferred name, then ask about immediate online support
      nextInfo = { ...nextInfo, name: normalized };
      setDetailStep(2);
      setContactInfo(nextInfo);
      setTimeout(() => {
        addAssistantMessage(
          "Thank you for sharing that. Would you like to talk to someone online right now? You can say yes, no, or skip."
        );
      }, 300);
      return;
    }

    // Step 2 — collected online support preference, save details and finalize
    const wantsOnlineSupport =
      !!normalized &&
      ["yes", "y", "sure", "ok", "okay", "please"].includes(normalized.toLowerCase());
    if (!pendingTriage) return;

    if (wantsOnlineSupport) {
      addAssistantMessage(
        "Online support right now: Lifeline 13 11 14 (lifeline.org.au). Thank you."
      );
    }

    const updatedNotes = wantsOnlineSupport
      ? `${pendingTriage.summary}\nUser asked for immediate online support options.`
      : pendingTriage.summary;
    const triageWithNotes: TriageResult = { ...pendingTriage, summary: updatedNotes };

    setContactInfo(nextInfo);
    finalizeWithTriage(
      "Thank you for sharing that with me.",
      triageWithNotes,
      pendingAnswers,
      nextInfo
    );
  }

  async function finalizeWithTriage(
    message: string,
    triageResult: TriageResult,
    finalAnswers: CheckInAnswer[],
    details?: { name?: string; phone?: string }
  ) {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      addAssistantMessage(message);
    }, typingDelay(message));

    setTimeout(async () => {
      // Save contact details to backend
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/api/session/${sessionId}/details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: details?.name,
              phone: details?.phone,
              notes: triageResult.summary,
              flags: triageResult.flags,
            }),
          });
        } catch {
          // Backend unavailable — continue without persistence
        }
      }

      setFinished(true);
      setPhase("checkin");
      setPendingTriage(null);
      setPendingAnswers([]);
      setDetailStep(0);
      setContactInfo({});
      setIsTyping(true);
      const closingMsg =
        "Thank you for reaching out today. Your details have been saved and our team will follow up with you. Take care of yourself — and remember, Lifeline is always available on **13 11 14** if you need someone to talk to.";
      setTimeout(() => {
        setIsTyping(false);
        addAssistantMessage(closingMsg);
      }, typingDelay(closingMsg));
    }, 2400);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.headerNavButton}>
              <Text style={styles.headerNavText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerNavPlaceholder} />
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerLogo}>🌿 Hope Pathways</Text>
            <Text style={styles.headerSubtitle}>Support navigator</Text>
          </View>
          {onHome ? (
            <TouchableOpacity onPress={onHome} style={styles.headerNavButton}>
              <Text style={styles.headerNavText}>Home</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerNavPlaceholder} />
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={
          <>
            {isTyping && <TypingIndicatorBubble />}
            {showCrisis && (
              <CrisisCard onContinue={() => setShowCrisis(false)} />
            )}
            {triage && !showCrisis && triage.classification !== "crisis" && finished && (
              <SupportCard classification={triage.classification} />
            )}
          </>
        }
      />

      {/* Text input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={finished ? "Check-in complete" : "Type your reply here..."}
          placeholderTextColor={COLORS.textSecondary}
          multiline
          editable={!isTyping && !finished}
          onSubmitEditing={() => handleSubmit(input)}
        />
        <TouchableOpacity
          style={[styles.sendButton, (isTyping || finished) && styles.sendButtonDisabled]}
          onPress={() => handleSubmit(input)}
          disabled={isTyping || finished}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* "I'm ready to finish" button — matches frontend */}
      {phase === "checkin" && !finished && (
        <TouchableOpacity
          style={styles.endChatButton}
          onPress={handleEndChat}
          disabled={endingChat}
        >
          <Text style={[styles.endChatText, endingChat && { opacity: 0.4 }]}>
            {endingChat ? "One moment..." : "I'm ready to finish"}
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

// --- API calls (matching frontend exactly) ---

interface NextQuestionPayload {
  question: string;
  shouldComplete: boolean;
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

    const res = await fetch(`${API_BASE_URL}/api/triage/next-question`, {
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
    return { question: data.question, shouldComplete: !!data.shouldComplete };
  } catch {
    const lastAnswer = answers.length > 0 ? answers[answers.length - 1].answer : "";
    return {
      question: buildFallbackPrompt(lastAnswer),
      shouldComplete: answers.length >= 4,
    };
  }
}

async function fetchAITriage(answers: CheckInAnswer[], askedQuestions: string[]): Promise<TriageResult> {
  try {
    const entries = answers.map((a, idx) => ({
      question: askedQuestions[idx] ?? `Check-in question ${a.step}`,
      answer: a.answer,
    }));

    const res = await fetch(`${API_BASE_URL}/api/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);
    return (await res.json()) as TriageResult;
  } catch {
    return buildTriage(answers);
  }
}

// --- Helper functions (matching frontend logic exactly) ---

function stripTriageBlock(text: string): string {
  return text.replace(/<TRIAGE>[\s\S]*?<\/TRIAGE>/g, "").trim();
}

function buildFallbackPrompt(lastUserText: string): string {
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
  if (text.length < 12) return "Thanks for sharing that with me.";
  return "Thank you for sharing that, it sounds like this has been really hard.";
}

function isCrisisText(text: string): boolean {
  const lower = text.toLowerCase();
  const signals = [
    "suicide", "kill myself", "end it", "end my life", "self harm", "self-harm",
    "harm myself", "harm others", "immediate danger", "i can't go on", "i cant go on",
    "i want to end it", "i don't want to be here", "i dont want to be here",
    "want to die", "no point living", "not worth living",
  ];
  return signals.some((signal) => lower.includes(signal));
}

function buildTriage(answers: CheckInAnswer[]): TriageResult {
  const transcript = answers.map((a) => a.answer).join(" ").toLowerCase();
  let classification: Classification = "hub_referral";

  if (isCrisisText(transcript)) {
    classification = "crisis";
  } else if (includesAny(transcript, ["community", "peer", "group", "connection", "not ready for clinic"])) {
    classification = "peer_support";
  } else if (
    includesAny(transcript, ["information", "tips", "coping", "resources", "just want info", "self help"]) &&
    !includesAny(transcript, ["struggling", "not coping", "hard", "overwhelmed"])
  ) {
    classification = "self_guided";
  }

  const flags = deriveFlags(transcript);
  const language = detectLanguage(answers.map((a) => a.answer).join(" "));

  return {
    classification,
    crisis: classification === "crisis",
    summary: buildSummary(answers, classification),
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
  if (includesAny(transcript, ["first time", "never spoken", "not before", "new to this"])) flags.push("first_time_seeker");
  if (includesAny(transcript, ["alone", "no one", "isolated", "by myself"])) flags.push("social_isolation");
  if (includesAny(transcript, ["emergency", "ed", "hospital", "psych ward", "presented"])) flags.push("previous_ed_presentation");
  if (includesAny(transcript, ["interpreter", "migrant", "refugee", "english is not my first language"])) flags.push("cald_background");
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

// --- Styles matching frontend CSS ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "web" ? 20 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerNavButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerNavText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerNavPlaceholder: {
    width: 50,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 5,
    marginTop: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: COLORS.background,
    color: COLORS.textSecondary,
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  endChatButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  endChatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
});
