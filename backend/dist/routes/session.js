"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mssql_1 = __importDefault(require("mssql"));
const db_1 = require("../db");
const index_1 = require("../index");
const aiTriage_1 = require("../services/aiTriage");
const sessionCreateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: "Too many sessions created, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
const answerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: { error: "Too many requests, please slow down" },
    standardHeaders: true,
    legacyHeaders: false,
});
const router = (0, express_1.Router)();
// POST /api/session — create anonymous session
router.post("/", sessionCreateLimiter, async (_req, res) => {
    try {
        const id = (0, crypto_1.randomUUID)();
        const created_at = new Date().toISOString();
        const pool = await (0, db_1.getPool)();
        await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .input("created_at", mssql_1.default.NVarChar(50), created_at)
            .query("INSERT INTO triage_sessions (id, created_at) VALUES (@id, @created_at)");
        const result = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT * FROM triage_sessions WHERE id = @id");
        const row = result.recordset[0];
        index_1.io.emit("session_created", row);
        res.status(201).json({ sessionId: id });
    }
    catch (err) {
        console.error("[POST /api/session]", err);
        res.status(500).json({ error: "Failed to create session" });
    }
});
// POST /api/session/:id/answer — submit a step answer
router.post("/:id/answer", answerLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { step, answer } = req.body;
        const pool = await (0, db_1.getPool)();
        const check = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id FROM triage_sessions WHERE id = @id");
        if (check.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .input("step", mssql_1.default.Int, step)
            .input("answer", mssql_1.default.NVarChar(mssql_1.default.MAX), answer)
            .query("INSERT INTO session_answers (session_id, step, answer) VALUES (@session_id, @step, @answer)");
        // Real-time crisis escalation for immediate safety language
        if ((0, aiTriage_1.hasCrisisSignal)(answer)) {
            await pool.request()
                .input("id", mssql_1.default.NVarChar(36), id)
                .query(`UPDATE triage_sessions SET crisis_level = 'crisis', notes = COALESCE(notes, 'Immediate crisis language detected during active chat.') WHERE id = @id AND crisis_level != 'crisis'`);
            const updatedResult = await pool.request()
                .input("id", mssql_1.default.NVarChar(36), id)
                .query("SELECT * FROM triage_sessions WHERE id = @id");
            const updated = updatedResult.recordset[0];
            index_1.io.emit("crisis_alert", { session: updated, latestAnswer: answer, step, detectedAt: new Date().toISOString() });
            index_1.io.emit("new_triage", updated);
        }
        res.json({ ok: true, step, answer });
    }
    catch (err) {
        console.error("[POST /api/session/:id/answer]", err);
        res.status(500).json({ error: "Failed to save answer" });
    }
});
// POST /api/session/:id/details — save contact details while chat continues
router.post("/:id/details", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, wantsCall, notes, flags } = req.body;
        const pool = await (0, db_1.getPool)();
        const check = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id FROM triage_sessions WHERE id = @id");
        if (check.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        const flagsJson = flags && flags.length > 0 ? JSON.stringify(flags) : null;
        await pool.request()
            .input("name", mssql_1.default.NVarChar(255), name ?? null)
            .input("email", mssql_1.default.NVarChar(255), email ?? null)
            .input("phone", mssql_1.default.NVarChar(50), phone ?? null)
            .input("address", mssql_1.default.NVarChar(500), address ?? null)
            .input("wants_call", mssql_1.default.NVarChar(50), wantsCall ?? null)
            .input("notes", mssql_1.default.NVarChar(mssql_1.default.MAX), notes ?? null)
            .input("flags", mssql_1.default.NVarChar(mssql_1.default.MAX), flagsJson)
            .input("id", mssql_1.default.NVarChar(36), id)
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
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT * FROM triage_sessions WHERE id = @id");
        const row = rowResult.recordset[0];
        index_1.io.emit("new_triage", row);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[POST /api/session/:id/details]", err);
        res.status(500).json({ error: "Failed to save details" });
    }
});
// POST /api/session/:id/complete — finalise triage, optionally save contact info
router.post("/:id/complete", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, wantsCall, notes, resultType, flags } = req.body;
        const pool = await (0, db_1.getPool)();
        const check = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id FROM triage_sessions WHERE id = @id");
        if (check.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        const answersResult = await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .query("SELECT step, answer FROM session_answers WHERE session_id = @session_id ORDER BY step");
        const answers = answersResult.recordset;
        const crisis_level = resultType ?? determineResult(answers);
        const completed_at = new Date().toISOString();
        const flagsJson = flags && flags.length > 0 ? JSON.stringify(flags) : null;
        await pool.request()
            .input("crisis_level", mssql_1.default.NVarChar(50), crisis_level)
            .input("completed_at", mssql_1.default.NVarChar(50), completed_at)
            .input("name", mssql_1.default.NVarChar(255), name ?? null)
            .input("email", mssql_1.default.NVarChar(255), email ?? null)
            .input("phone", mssql_1.default.NVarChar(50), phone ?? null)
            .input("address", mssql_1.default.NVarChar(500), address ?? null)
            .input("wants_call", mssql_1.default.NVarChar(50), wantsCall ?? null)
            .input("notes", mssql_1.default.NVarChar(mssql_1.default.MAX), notes ?? null)
            .input("flags", mssql_1.default.NVarChar(mssql_1.default.MAX), flagsJson)
            .input("id", mssql_1.default.NVarChar(36), id)
            .query(`
        UPDATE triage_sessions
        SET crisis_level = @crisis_level, status = 'completed', completed_at = @completed_at,
            name = @name, email = @email, phone = @phone, address = @address,
            wants_call = @wants_call, notes = @notes, flags = @flags
        WHERE id = @id
      `);
        const rowResult = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT * FROM triage_sessions WHERE id = @id");
        const row = rowResult.recordset[0];
        index_1.io.emit("new_triage", row);
        const result = { resultType: crisis_level, sessionId: id };
        res.json(result);
    }
    catch (err) {
        console.error("[POST /api/session/:id/complete]", err);
        res.status(500).json({ error: "Failed to complete session" });
    }
});
// GET /api/session/:id — retrieve session (for result page)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, db_1.getPool)();
        const sessionResult = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT * FROM triage_sessions WHERE id = @id");
        if (sessionResult.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        const answersResult = await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .query("SELECT step, answer FROM session_answers WHERE session_id = @session_id ORDER BY step");
        res.json({ ...sessionResult.recordset[0], answers: answersResult.recordset });
    }
    catch (err) {
        console.error("[GET /api/session/:id]", err);
        res.status(500).json({ error: "Failed to retrieve session" });
    }
});
// GET /api/session/:id/human-messages — fetch all human chat messages for a session
router.get("/:id/human-messages", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, db_1.getPool)();
        const check = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id FROM triage_sessions WHERE id = @id");
        if (check.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        const result = await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id, sender, message, created_at FROM human_chat_messages WHERE session_id = @session_id ORDER BY id ASC");
        res.json(result.recordset);
    }
    catch (err) {
        console.error("[GET /api/session/:id/human-messages]", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
// POST /api/session/:id/human-message — send a human chat message (admin or user)
router.post("/:id/human-message", async (req, res) => {
    try {
        const { id } = req.params;
        const { message, sender } = req.body;
        if (!message || !["admin", "user"].includes(sender)) {
            res.status(400).json({ error: "message and sender ('admin'|'user') are required" });
            return;
        }
        const pool = await (0, db_1.getPool)();
        const check = await pool.request()
            .input("id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id FROM triage_sessions WHERE id = @id");
        if (check.recordset.length === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }
        const created_at = new Date().toISOString();
        await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .input("sender", mssql_1.default.NVarChar(10), sender)
            .input("message", mssql_1.default.NVarChar(mssql_1.default.MAX), message)
            .input("created_at", mssql_1.default.NVarChar(50), created_at)
            .query("INSERT INTO human_chat_messages (session_id, sender, message, created_at) VALUES (@session_id, @sender, @message, @created_at)");
        const msgPayload = { sessionId: id, sender, message, created_at };
        // Emit to the specific session room so user frontend can receive it
        index_1.io.to(`session:${id}`).emit("human_message", msgPayload);
        // Also emit to admin room so admin chat panel updates
        index_1.io.emit("human_message", msgPayload);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[POST /api/session/:id/human-message]", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});
function determineResult(answers) {
    let crisis = false;
    let type = "hub";
    for (const a of answers) {
        if (a.answer === "Yes, immediate danger" || a.answer === "I need urgent help") {
            crisis = true;
        }
        if (a.answer === "Talk to someone")
            type = "peer";
        if (a.answer === "Get practical information" || a.answer === "I just want information")
            type = "info";
        if (a.answer === "Find local support")
            type = "hub";
    }
    return crisis ? "crisis" : type;
}
exports.default = router;
