import { Router, Request, Response } from "express";
import {
  classifyWithAI,
  CheckInEntry,
  FollowUpInput,
  generateFollowUpWithAI,
  NextQuestionInput,
  generateNextQuestionWithAI,
  generateChatReply,
  ChatTurnInput,
} from "../services/aiTriage";

const router = Router();

/**
 * POST /api/triage
 *
 * Body: { entries: Array<{ question: string; answer: string }> }
 *
 * Returns a TriagePayload with AI-determined classification.
 * Falls back to rule-based logic if the AI API is unavailable.
 */
router.post("/", async (req: Request, res: Response) => {
  const { entries } = req.body as { entries?: CheckInEntry[] };

  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "entries array is required and must not be empty" });
    return;
  }

  // Validate each entry
  for (const e of entries) {
    if (typeof e.question !== "string" || typeof e.answer !== "string") {
      res.status(400).json({ error: "Each entry must have a string question and answer" });
      return;
    }
  }

  try {
    const triage = await classifyWithAI(entries);
    res.json(triage);
  } catch (err) {
    console.error("[/api/triage] Unexpected error:", err);
    res.status(500).json({ error: "Triage service unavailable" });
  }
});

router.post("/follow-up", async (req: Request, res: Response) => {
  const body = req.body as Partial<FollowUpInput>;
  const currentQuestion = body.currentQuestion?.trim();
  const userAnswer = body.userAnswer?.trim();
  const nextQuestion = body.nextQuestion?.trim();

  if (!currentQuestion || !userAnswer || !nextQuestion) {
    res.status(400).json({
      error: "currentQuestion, userAnswer, and nextQuestion are required",
    });
    return;
  }

  try {
    const message = await generateFollowUpWithAI({
      currentQuestion,
      userAnswer,
      nextQuestion,
    });
    res.json({ message });
  } catch (err) {
    console.error("[/api/triage/follow-up] Unexpected error:", err);
    res.status(500).json({ error: "Follow-up generation unavailable" });
  }
});

router.post("/next-question", async (req: Request, res: Response) => {
  const body = req.body as Partial<NextQuestionInput>;
  const entries = body.entries;
  const askedQuestions = body.askedQuestions;

  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "entries array is required and must not be empty" });
    return;
  }

  if (!Array.isArray(askedQuestions)) {
    res.status(400).json({ error: "askedQuestions array is required" });
    return;
  }

  for (const entry of entries) {
    if (typeof entry.question !== "string" || typeof entry.answer !== "string") {
      res.status(400).json({ error: "Each entry must have a string question and answer" });
      return;
    }
  }

  try {
    const result = await generateNextQuestionWithAI({
      entries,
      askedQuestions,
    });
    res.json(result);
  } catch (err) {
    console.error("[/api/triage/next-question] Unexpected error:", err);
    res.status(500).json({ error: "Next-question generation unavailable" });
  }
});

router.post("/chat", async (req: Request, res: Response) => {
  const body = req.body as Partial<ChatTurnInput>;

  if (!Array.isArray(body.conversationHistory) || body.conversationHistory.length === 0) {
    res.status(400).json({ error: "conversationHistory array is required" });
    return;
  }

  if (!Array.isArray(body.entries)) {
    res.status(400).json({ error: "entries array is required" });
    return;
  }

  for (const m of body.conversationHistory) {
    if (!m.role || !m.content) {
      res.status(400).json({ error: "Each history item must have role and content" });
      return;
    }
  }

  try {
    const result = await generateChatReply({
      conversationHistory: body.conversationHistory,
      entries: body.entries,
      minQuestions: body.minQuestions,
      maxQuestions: body.maxQuestions,
    });
    res.json(result);
  } catch (err) {
    console.error("[/api/triage/chat] Unexpected error:", err);
    res.status(500).json({ error: "Chat reply unavailable" });
  }
});

export default router;
