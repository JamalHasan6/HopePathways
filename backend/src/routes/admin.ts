import { Router, Request, Response } from "express";
import sql from "mssql";
import { getPool, isDbAvailable } from "../db";
import { io } from "../index";

const router = Router();

// GET /api/admin/sessions — all completed sessions, newest first
router.get("/sessions", async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT * FROM triage_sessions ORDER BY created_at DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("[GET /api/admin/sessions]", err);
    res.json([]);
  }
});

// GET /api/admin/sessions/:id — single session with full answer trail
router.get("/sessions/:id", async (req: Request, res: Response) => {
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
    console.error("[GET /api/admin/sessions/:id]", err);
    res.json({ error: "Session not found or database unavailable", answers: [] });
  }
});

// GET /api/admin/sessions/:id/human-messages — all human chat messages for a session
router.get("/sessions/:id/human-messages", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .query("SELECT id, sender, message, created_at FROM human_chat_messages WHERE session_id = @session_id ORDER BY id ASC");

    res.json(result.recordset);
  } catch (err) {
    console.error("[GET /api/admin/sessions/:id/human-messages]", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/admin/sessions/:id/human-message — admin sends a message to the user
router.post("/sessions/:id/human-message", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body as { message: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
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
    const insertResult = await pool.request()
      .input("session_id", sql.NVarChar(36), id)
      .input("sender", sql.NVarChar(10), "admin")
      .input("message", sql.NVarChar(sql.MAX), message.trim())
      .input("created_at", sql.NVarChar(50), created_at)
      .query("INSERT INTO human_chat_messages (session_id, sender, message, created_at) OUTPUT INSERTED.id VALUES (@session_id, @sender, @message, @created_at)");

    const msgId: number = insertResult.recordset[0].id;
    const msgPayload = { id: msgId, sessionId: id, sender: "admin", message: message.trim(), created_at };
    io.to(`session:${id}`).emit("human_message", msgPayload);

    res.json({ ok: true, ...msgPayload });
  } catch (err) {
    console.error("[POST /api/admin/sessions/:id/human-message]", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;

