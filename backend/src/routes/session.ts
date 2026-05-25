import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import sql from "mssql";
import { getPool } from "../db";
import { io } from "../index";
import { CheckInAnswer, ContactInfo, ResultType, TriageResult } from "../types";
import { hasCrisisSignal } from "../services/aiTriage";

const sessionCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many sessions created, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const answerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// POST /api/session — create anonymous session
router.post("/", sessionCreateLimiter, async (_req: Request, res: Response) => {
  try {
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const pool = await getPool();

    await pool.request()
      .input("id", sql.NVarChar(36), id)
      .input("created_at", sql.NVarChar(50), created_at)
      .query("INSERT INTO triage_sessions (id, created_at) VALUES (@id, @created_at)");

    const result = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM triage_sessions WHERE id = @id");

    const row = result.recordset[0];
    io.emit("session_created", row);
    res.status(201).json({ sessionId: id });
  } catch (err) {
    console.error("[POST /api/session]", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// POST /api/session/:id/answer — submit a step answer
router.post("/:id/answer", answerLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { step, answer } = req.body as CheckInAnswer;
    const pool = await getPool();

    const check = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT id FROM triage_sessions WHERE id = @id");

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .input("step", sql.Int, step)
      .input("answer", sql.NVarChar(sql.MAX), answer)
      .query("INSERT INTO session_answers (session_id, step, answer) VALUES (@session_id, @step, @answer)");

    // Real-time crisis escalation for immediate safety language
    if (hasCrisisSignal(answer)) {
      await pool.request()
        .input("id", sql.NVarChar(36), id)
        .query(`UPDATE triage_sessions SET crisis_level = 'crisis', notes = COALESCE(notes, 'Immediate crisis language detected during active chat.') WHERE id = @id AND crisis_level != 'crisis'`);

      const updatedResult = await pool.request()
        .input("id", sql.NVarChar(36), id)
        .query("SELECT * FROM triage_sessions WHERE id = @id");

      const updated = updatedResult.recordset[0];
      io.emit("crisis_alert", { session: updated, latestAnswer: answer, step, detectedAt: new Date().toISOString() });
      io.emit("new_triage", updated);
    }

    res.json({ ok: true, step, answer });
  } catch (err) {
    console.error("[POST /api/session/:id/answer]", err);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

// POST /api/session/:id/details — save contact details while chat continues
router.post("/:id/details", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, wantsCall, notes, flags } = req.body as ContactInfo;
    const pool = await getPool();

    const check = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT id FROM triage_sessions WHERE id = @id");

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const flagsJson = flags && flags.length > 0 ? JSON.stringify(flags) : null;

    await pool.request()
      .input("name", sql.NVarChar(255), name ?? null)
      .input("email", sql.NVarChar(255), email ?? null)
      .input("phone", sql.NVarChar(50), phone ?? null)
      .input("address", sql.NVarChar(500), address ?? null)
      .input("wants_call", sql.NVarChar(50), wantsCall ?? null)
      .input("notes", sql.NVarChar(sql.MAX), notes ?? null)
      .input("flags", sql.NVarChar(sql.MAX), flagsJson)
      .input("id", sql.NVarChar(36), id)
      .query(`
        UPDATE triage_sessions
        SET name = COALESCE(@name, name),
            email = COALESCE(@email, email),
            phone = COALESCE(@phone, phone),
            address = COALESCE(@address, address),
            wants_call = COALESCE(@wants_call, wants_call),
            notes = COALESCE(@notes, notes),
            flags = COALESCE(@flags, flags)
        WHERE id = @id
      `);

    const rowResult = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM triage_sessions WHERE id = @id");

    const row = rowResult.recordset[0];
    io.emit("new_triage", row);

    res.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/session/:id/details]", err);
    res.status(500).json({ error: "Failed to save details" });
  }
});

// POST /api/session/:id/complete — finalise triage, optionally save contact info
router.post("/:id/complete", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, wantsCall, notes, resultType, flags } = req.body as ContactInfo;
    const pool = await getPool();

    const check = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT id FROM triage_sessions WHERE id = @id");

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const answersResult = await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .query("SELECT step, answer FROM session_answers WHERE session_id = @session_id ORDER BY step");

    const answers = answersResult.recordset as CheckInAnswer[];
    const crisis_level: ResultType = resultType ?? determineResult(answers);
    const completed_at = new Date().toISOString();
    const flagsJson = flags && flags.length > 0 ? JSON.stringify(flags) : null;

    await pool.request()
      .input("crisis_level", sql.NVarChar(50), crisis_level)
      .input("completed_at", sql.NVarChar(50), completed_at)
      .input("name", sql.NVarChar(255), name ?? null)
      .input("email", sql.NVarChar(255), email ?? null)
      .input("phone", sql.NVarChar(50), phone ?? null)
      .input("address", sql.NVarChar(500), address ?? null)
      .input("wants_call", sql.NVarChar(50), wantsCall ?? null)
      .input("notes", sql.NVarChar(sql.MAX), notes ?? null)
      .input("flags", sql.NVarChar(sql.MAX), flagsJson)
      .input("id", sql.NVarChar(36), id)
      .query(`
        UPDATE triage_sessions
        SET crisis_level = @crisis_level, status = 'completed', completed_at = @completed_at,
            name = @name, email = @email, phone = @phone, address = @address,
            wants_call = @wants_call, notes = @notes, flags = @flags
        WHERE id = @id
      `);

    const rowResult = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM triage_sessions WHERE id = @id");

    const row = rowResult.recordset[0];
    io.emit("new_triage", row);

    const result: TriageResult = { resultType: crisis_level, sessionId: id };
    res.json(result);
  } catch (err) {
    console.error("[POST /api/session/:id/complete]", err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// GET /api/session/:id — retrieve session (for result page)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const sessionResult = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT * FROM triage_sessions WHERE id = @id");

    if (sessionResult.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const answersResult = await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .query("SELECT step, answer FROM session_answers WHERE session_id = @session_id ORDER BY step");

    res.json({ ...sessionResult.recordset[0], answers: answersResult.recordset });
  } catch (err) {
    console.error("[GET /api/session/:id]", err);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

// GET /api/session/:id/human-messages — fetch all human chat messages for a session
router.get("/:id/human-messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const check = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT id FROM triage_sessions WHERE id = @id");

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const result = await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .query("SELECT id, sender, message, created_at FROM human_chat_messages WHERE session_id = @session_id ORDER BY id ASC");

    res.json(result.recordset);
  } catch (err) {
    console.error("[GET /api/session/:id/human-messages]", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/session/:id/human-message — send a human chat message (admin or user)
router.post("/:id/human-message", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, sender } = req.body as { message: string; sender: "admin" | "user" };

    if (!message || !["admin", "user"].includes(sender)) {
      res.status(400).json({ error: "message and sender ('admin'|'user') are required" });
      return;
    }

    const pool = await getPool();

    const check = await pool.request()
      .input("id", sql.NVarChar(36), id)
      .query("SELECT id FROM triage_sessions WHERE id = @id");

    if (check.recordset.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const created_at = new Date().toISOString();
    await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .input("sender", sql.NVarChar(10), sender)
      .input("message", sql.NVarChar(sql.MAX), message)
      .input("created_at", sql.NVarChar(50), created_at)
      .query("INSERT INTO human_chat_messages (session_id, sender, message, created_at) VALUES (@session_id, @sender, @message, @created_at)");

    const msgPayload = { sessionId: id, sender, message, created_at };
    // Emit to the specific session room so user frontend can receive it
    io.to(`session:${id}`).emit("human_message", msgPayload);
    // Also emit to admin room so admin chat panel updates
    io.emit("human_message", msgPayload);

    res.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/session/:id/human-message]", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

function determineResult(answers: CheckInAnswer[]): ResultType {
  let crisis = false;
  let type: ResultType = "hub";

  for (const a of answers) {
    if (a.answer === "Yes, immediate danger" || a.answer === "I need urgent help") {
      crisis = true;
    }
    if (a.answer === "Talk to someone") type = "peer";
    if (a.answer === "Get practical information" || a.answer === "I just want information") type = "info";
    if (a.answer === "Find local support") type = "hub";
  }

  return crisis ? "crisis" : type;
}

export default router;
