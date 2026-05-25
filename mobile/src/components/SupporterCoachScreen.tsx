import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { COLORS } from "../constants";
import AppHeader from "./AppHeader";
import WhatsAppHandoffButton from "./WhatsAppHandoffButton";

interface CoachMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
}

interface SupporterCoachScreenProps {
  onBack: () => void;
  onHome: () => void;
}

type CoachPhase = "chat" | "consent" | "form" | "confirmed";

type ContactMethod = "Phone" | "SMS" | "Email" | "WhatsApp";
type Relationship = "Friend" | "Family" | "Partner" | "Colleague" | "Stranger" | "Other";
type DangerLevel = "Yes" | "No" | "Unsure";

interface ReferralForm {
  name: string;
  contact: string;
  method: ContactMethod;
  relationship: Relationship;
  danger: DangerLevel;
  note: string;
}

const CRISIS_KEYWORDS = [
  "suicide", "suicidal", "kill himself", "kill herself", "kill themselves",
  "self harm", "self-harm", "wants to die", "end it",
  "doesn't want to be here", "doesnt want to be here", "no reason to live",
  "goodbye messages", "has a plan", "has means", "overdose", "weapon",
  "immediate danger",
];

const INITIAL_OPTIONS = [
  "They seem depressed",
  "They mentioned suicide",
  "They are withdrawing",
  "I don't know what to say",
  "I'm worried about immediate danger",
];

const NORMAL_OPTIONS = [
  "What should I say?",
  "What should I avoid saying?",
  "How do I ask about suicide?",
  "How do I connect them to support?",
  "Request follow-up",
];

const CRISIS_OPTIONS = [
  "Help me ask directly",
  "What should I say now?",
  "Request follow-up",
  "Open WhatsApp",
];

const FOLLOW_UP_QUESTIONS = [
  "Are you worried they might hurt themselves today?",
  "Have they said anything about wanting to die, self-harm, or not wanting to be here?",
  "Are they alone right now, or is someone safe with them?",
  "Would you feel comfortable contacting support together?",
];

const CONTACT_METHODS: ContactMethod[] = ["Phone", "SMS", "Email", "WhatsApp"];
const RELATIONSHIPS: Relationship[] = ["Friend", "Family", "Partner", "Colleague", "Stranger", "Other"];
const DANGER_LEVELS: DangerLevel[] = ["Yes", "No", "Unsure"];

function hasCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function getFollowUpQuestion(step: number): string | null {
  if (step < FOLLOW_UP_QUESTIONS.length) return FOLLOW_UP_QUESTIONS[step];
  return null;
}

function getCoachResponse(text: string, isCrisis: boolean, conversationStep: number): { response: string; followUp: string | null } {
  if (isCrisis) {
    return {
      response:
        "Thank you for taking this seriously. If they may be in immediate danger, call 000 now. If they are talking about suicide or self-harm, contact Lifeline on 13 11 14 and stay with them if it is safe to do so. You can ask directly: 'Are you thinking about hurting yourself?'",
      followUp: null,
    };
  }

  const lower = text.toLowerCase();

  if (lower.includes("what should i say") || lower.includes("what to say")) {
    return {
      response: "Here are some things you could say. Try to be calm, honest, and caring. Let them know you are there for them.",
      followUp: getFollowUpQuestion(conversationStep),
    };
  }
  if (lower.includes("what should i avoid") || lower.includes("what not to say") || lower.includes("avoid saying")) {
    return {
      response: "Avoid dismissing their feelings or making promises you cannot keep. Do not say things like 'just cheer up' or 'other people have it worse'. Instead, listen and validate.",
      followUp: getFollowUpQuestion(conversationStep),
    };
  }
  if (lower.includes("ask about suicide") || lower.includes("ask directly") || lower.includes("help me ask")) {
    return {
      response: "Asking about suicide does not put the idea in someone's head. It can help them feel less alone. You could say: 'Are you thinking about suicide or hurting yourself?' Stay calm and listen to their answer.",
      followUp: getFollowUpQuestion(conversationStep),
    };
  }
  if (lower.includes("connect them to support") || lower.includes("connect to support")) {
    return {
      response: "You can encourage them to visit the Evolve Mental Health & Wellbeing Hub for free walk-in support, or call Lifeline on 13 11 14. Offer to go with them or make the call together.",
      followUp: getFollowUpQuestion(conversationStep),
    };
  }

  return {
    response:
      "That sounds really hard, and it makes sense that you want to help. A good first step is to listen without trying to fix everything. You could say: 'I'm really glad you told me. I care about you, and I'm here with you.'",
    followUp: getFollowUpQuestion(conversationStep),
  };
}

function getSuggestedPathway(danger: DangerLevel, allMessages: CoachMessage[]): string {
  const transcript = allMessages.map((m) => m.text).join(" ");
  if (danger === "Yes" || hasCrisisKeywords(transcript)) {
    return "Crisis pathway: 000 / Lifeline 13 11 14";
  }
  if (danger === "Unsure") {
    return "Urgent support guidance: Lifeline 13 11 14 and staff review";
  }
  return "Supporter follow-up / Evolve Hub referral guidance";
}

export default function SupporterCoachScreen({ onBack, onHome }: SupporterCoachScreenProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    { id: "1", sender: "coach", text: "Hi, I can help you support someone you care about. You can type what's happening, or choose one of the options below." },
  ]);
  const [input, setInput] = useState("");
  const [quickOptions, setQuickOptions] = useState<string[]>(INITIAL_OPTIONS);
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const [showEducationCards, setShowEducationCards] = useState(false);
  const [conversationStep, setConversationStep] = useState(0);
  const [phase, setPhase] = useState<CoachPhase>("chat");
  const [form, setForm] = useState<ReferralForm>({
    name: "", contact: "", method: "Phone", relationship: "Friend", danger: "No", note: "",
  });
  const [submittedForm, setSubmittedForm] = useState<ReferralForm | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const addCoachMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + Math.random()).toString(), sender: "coach", text },
    ]);
    scrollToEnd();
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text },
    ]);
  };

  const processMessage = (text: string) => {
    const isCrisis = hasCrisisKeywords(text);
    const { response, followUp } = getCoachResponse(text, isCrisis, conversationStep);

    if (isCrisis) {
      setShowCrisisCard(true);
      setShowEducationCards(false);
      setQuickOptions(CRISIS_OPTIONS);
    } else {
      setShowCrisisCard(false);
      setShowEducationCards(true);
      setQuickOptions(NORMAL_OPTIONS);
    }

    setConversationStep((s) => s + 1);

    setTimeout(() => {
      addCoachMessage(response);
      if (followUp) {
        setTimeout(() => addCoachMessage(followUp), 600);
      }
    }, 400);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addUserMessage(text);
    setInput("");
    processMessage(text);
  };

  const handleOptionTap = (option: string) => {
    if (option === "Request follow-up") {
      addUserMessage(option);
      setPhase("consent");
      setTimeout(() => {
        addCoachMessage("Would you like a support worker or volunteer to follow up with you about how to support this person?");
        scrollToEnd();
      }, 400);
      return;
    }
    if (option === "Open WhatsApp") {
      const url = `https://wa.me/61493457003?text=${encodeURIComponent("Hi Hope Pathways, I would like to speak with someone about support.")}`;
      Linking.openURL(url);
      return;
    }
    addUserMessage(option);
    processMessage(option);
  };

  const handleConsent = (consented: boolean) => {
    if (consented) {
      addUserMessage("Yes, I consent");
      setPhase("form");
      setTimeout(() => {
        addCoachMessage("Thank you. Please fill in the details below so a support worker can follow up with you.");
        scrollToEnd();
      }, 400);
    } else {
      addUserMessage("No, continue without follow-up");
      setPhase("chat");
      setQuickOptions(NORMAL_OPTIONS);
      setTimeout(() => {
        addCoachMessage("That's okay. You can still use these resources, call Lifeline on 13 11 14, or message the support team on WhatsApp for non-urgent support.");
        scrollToEnd();
      }, 400);
    }
  };

  const handleFormSubmit = () => {
    if (!form.name.trim() || !form.contact.trim()) return;
    setSubmittedForm({ ...form });
    setPhase("confirmed");
    setTimeout(() => {
      addCoachMessage("Thank you. Your referral request has been recorded on this device.");
      scrollToEnd();
    }, 400);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <AppHeader title="AI Coaching" onBack={onBack} onHome={onHome} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.sender === "user" ? styles.userBubble : styles.coachBubble]}
          >
            <Text style={[styles.bubbleText, msg.sender === "user" ? styles.userText : styles.coachText]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {/* Crisis Card */}
        {showCrisisCard && <CrisisCoachingCard />}

        {/* Education Cards */}
        {showEducationCards && <EducationCards />}

        {/* Quick Options (chat phase) */}
        {phase === "chat" && quickOptions.length > 0 && (
          <View style={styles.optionsContainer}>
            {quickOptions.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionButton} onPress={() => handleOptionTap(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Consent Phase */}
        {phase === "consent" && (
          <View style={styles.consentContainer}>
            <TouchableOpacity style={styles.consentYes} onPress={() => handleConsent(true)}>
              <Text style={styles.consentYesText}>Yes, I consent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.consentNo} onPress={() => handleConsent(false)}>
              <Text style={styles.consentNoText}>No, continue without follow-up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Referral Form */}
        {phase === "form" && (
          <ReferralFormCard form={form} setForm={setForm} onSubmit={handleFormSubmit} />
        )}

        {/* Confirmed */}
        {phase === "confirmed" && submittedForm && (
          <ReferralConfirmation
            form={submittedForm}
            pathway={getSuggestedPathway(submittedForm.danger, messages)}
            onBack={onBack}
            onHome={onHome}
          />
        )}

        {/* WhatsApp after coaching */}
        {(showEducationCards || phase === "confirmed") && (
          <View style={styles.whatsappSection}>
            <WhatsAppHandoffButton variant="outline" />
          </View>
        )}
      </ScrollView>

      {/* Input bar (only during chat/consent phases) */}
      {(phase === "chat" || phase === "consent") && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Describe your concern..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* --- Sub-components --- */

function CrisisCoachingCard() {
  return (
    <View style={styles.crisisCard}>
      <Text style={styles.crisisTitle}>🚨 Crisis Support</Text>
      <TouchableOpacity style={styles.crisisBtn} onPress={() => Linking.openURL("tel:000")}>
        <Text style={styles.crisisBtnText}>Call 000</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.crisisBtn} onPress={() => Linking.openURL("tel:131114")}>
        <Text style={styles.crisisBtnText}>Call Lifeline 13 11 14</Text>
      </TouchableOpacity>
      <Text style={styles.crisisItem}>• Stay with them if safe</Text>
      <Text style={styles.crisisItem}>• Do not promise secrecy</Text>
      <Text style={styles.crisisItem}>• Involve a trusted person, GP, or crisis service</Text>
      <Text style={styles.crisisItem}>• Remove immediate access to danger only if it is safe to do so</Text>
    </View>
  );
}

function EducationCards() {
  return (
    <View>
      <View style={styles.eduCard}>
        <Text style={styles.eduTitle}>✅ What to say</Text>
        <Text style={styles.eduItem}>• "I'm glad you told me."</Text>
        <Text style={styles.eduItem}>• "I care about you."</Text>
        <Text style={styles.eduItem}>• "You don't have to go through this alone."</Text>
        <Text style={styles.eduItem}>• "Are you thinking about hurting yourself?"</Text>
        <Text style={styles.eduItem}>• "Can we contact support together?"</Text>
      </View>
      <View style={styles.eduCard}>
        <Text style={styles.eduTitle}>🚫 What not to say</Text>
        <Text style={styles.eduItem}>• "Just cheer up."</Text>
        <Text style={styles.eduItem}>• "Other people have it worse."</Text>
        <Text style={styles.eduItem}>• "You're overreacting."</Text>
        <Text style={styles.eduItem}>• "Promise me you won't tell anyone."</Text>
        <Text style={styles.eduItem}>• "You're being selfish."</Text>
      </View>
      <View style={styles.eduCard}>
        <Text style={styles.eduTitle}>💬 How to ask directly</Text>
        <Text style={styles.eduItem}>Asking about suicide does not put the idea in someone's head. It can help them feel less alone.</Text>
        <Text style={[styles.eduItem, { fontWeight: "600", marginTop: 6 }]}>Example: "Are you thinking about suicide or hurting yourself?"</Text>
      </View>
      <View style={styles.eduCard}>
        <Text style={styles.eduTitle}>🧭 Connect to support</Text>
        <Text style={styles.eduItem}>• Evolve Mental Health & Wellbeing Hub for walk-in support</Text>
        <Text style={styles.eduItem}>• Lifeline 13 11 14 for crisis support</Text>
        <Text style={styles.eduItem}>• 000 if there is immediate danger</Text>
        <Text style={styles.eduItem}>• WhatsApp handoff for non-urgent follow-up</Text>
      </View>
    </View>
  );
}

function ReferralFormCard({
  form,
  setForm,
  onSubmit,
}: {
  form: ReferralForm;
  setForm: React.Dispatch<React.SetStateAction<ReferralForm>>;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>📋 Referral Follow-up</Text>

      <Text style={styles.formLabel}>Your name</Text>
      <TextInput style={styles.formInput} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Name" placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.formLabel}>Your phone or email</Text>
      <TextInput style={styles.formInput} value={form.contact} onChangeText={(v) => setForm((f) => ({ ...f, contact: v }))} placeholder="Phone or email" placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.formLabel}>Preferred contact method</Text>
      <View style={styles.chipRow}>
        {CONTACT_METHODS.map((m) => (
          <TouchableOpacity key={m} style={[styles.chip, form.method === m && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, method: m }))}>
            <Text style={[styles.chipText, form.method === m && styles.chipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formLabel}>Who are you supporting?</Text>
      <View style={styles.chipRow}>
        {RELATIONSHIPS.map((r) => (
          <TouchableOpacity key={r} style={[styles.chip, form.relationship === r && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, relationship: r }))}>
            <Text style={[styles.chipText, form.relationship === r && styles.chipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formLabel}>Is there immediate danger?</Text>
      <View style={styles.chipRow}>
        {DANGER_LEVELS.map((d) => (
          <TouchableOpacity key={d} style={[styles.chip, form.danger === d && styles.chipActive, d === "Yes" && form.danger === d && styles.chipDanger]} onPress={() => setForm((f) => ({ ...f, danger: d }))}>
            <Text style={[styles.chipText, form.danger === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formLabel}>Short note about what is happening</Text>
      <TextInput style={[styles.formInput, { minHeight: 80 }]} value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} placeholder="Describe the situation briefly..." placeholderTextColor={COLORS.textSecondary} multiline textAlignVertical="top" />

      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <Text style={styles.submitText}>Submit Referral</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReferralConfirmation({
  form,
  pathway,
  onBack,
  onHome,
}: {
  form: ReferralForm;
  pathway: string;
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <View style={styles.confirmCard}>
      <Text style={styles.confirmTitle}>✅ Referral Recorded</Text>
      <Text style={styles.confirmText}>
        Thank you. In a full version, this would create a consent-based follow-up request for authorised staff or volunteers. For this prototype, your details are only shown on this device.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Referral Summary</Text>
        <Text style={styles.summaryRow}>Supporter: {form.name}</Text>
        <Text style={styles.summaryRow}>Contact: {form.contact}</Text>
        <Text style={styles.summaryRow}>Preferred method: {form.method}</Text>
        <Text style={styles.summaryRow}>Relationship: {form.relationship}</Text>
        <Text style={styles.summaryRow}>Immediate danger: {form.danger}</Text>
        <Text style={styles.summaryRow}>Concern: {form.note || "—"}</Text>
        <Text style={[styles.summaryRow, { fontWeight: "700", marginTop: 8 }]}>Suggested pathway: {pathway}</Text>
      </View>

      <TouchableOpacity style={styles.navButton} onPress={onBack}>
        <Text style={styles.navButtonText}>← Back to Help Someone</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navButton, styles.navButtonHome]} onPress={onHome}>
        <Text style={[styles.navButtonText, { color: COLORS.primary }]}>Home</Text>
      </TouchableOpacity>
    </View>
  );
}

/* --- Styles --- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: COLORS.secondary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    backgroundColor: COLORS.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: { color: "#FFFFFF" },
  coachText: { color: COLORS.textPrimary },

  /* Options */
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  /* Input */
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
    color: COLORS.textPrimary,
  },
  sendButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 10,
    justifyContent: "center",
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  /* Crisis */
  crisisCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.crisisRed,
  },
  crisisTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.crisisRed,
    marginBottom: 12,
  },
  crisisBtn: {
    backgroundColor: COLORS.crisisRed,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  crisisBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  crisisItem: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginTop: 4,
  },

  /* Education */
  eduCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  eduTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  eduItem: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginLeft: 4,
  },

  /* Consent */
  consentContainer: {
    marginTop: 16,
    gap: 10,
  },
  consentYes: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  consentYesText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  consentNo: {
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  consentNoText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 15,
  },

  /* Form */
  formCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  chipDanger: {
    borderColor: COLORS.crisisRed,
    backgroundColor: COLORS.crisisRed,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  /* Confirmation */
  confirmCard: {
    marginTop: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 10,
  },
  summaryRow: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  navButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  navButtonHome: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  navButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  /* WhatsApp */
  whatsappSection: {
    marginTop: 20,
  },
});
