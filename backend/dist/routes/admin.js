"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = require("../db");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// GET /api/admin/sessions — all completed sessions, newest first
router.get("/sessions", async (_req, res) => {
    try {
        const pool = await (0, db_1.getPool)();
        const result = await pool.request()
            .query("SELECT * FROM triage_sessions ORDER BY created_at DESC");
        res.json(result.recordset);
    }
    catch (err) {
        console.error("[GET /api/admin/sessions]", err);
        res.json([]);
    }
});
// GET /api/admin/sessions/:id — single session with full answer trail
router.get("/sessions/:id", async (req, res) => {
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
        console.error("[GET /api/admin/sessions/:id]", err);
        res.json({ error: "Session not found or database unavailable", answers: [] });
    }
});
// GET /api/admin/sessions/:id/human-messages — all human chat messages for a session
router.get("/sessions/:id/human-messages", async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, db_1.getPool)();
        const result = await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .query("SELECT id, sender, message, created_at FROM human_chat_messages WHERE session_id = @session_id ORDER BY id ASC");
        res.json(result.recordset);
    }
    catch (err) {
        console.error("[GET /api/admin/sessions/:id/human-messages]", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
// POST /api/admin/sessions/:id/human-message — admin sends a message to the user
router.post("/sessions/:id/human-message", async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        if (!message?.trim()) {
            res.status(400).json({ error: "message is required" });
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
        const insertResult = await pool.request()
            .input("session_id", mssql_1.default.NVarChar(36), id)
            .input("sender", mssql_1.default.NVarChar(10), "admin")
            .input("message", mssql_1.default.NVarChar(mssql_1.default.MAX), message.trim())
            .input("created_at", mssql_1.default.NVarChar(50), created_at)
            .query("INSERT INTO human_chat_messages (session_id, sender, message, created_at) OUTPUT INSERTED.id VALUES (@session_id, @sender, @message, @created_at)");
        const msgId = insertResult.recordset[0].id;
        const msgPayload = { id: msgId, sessionId: id, sender: "admin", message: message.trim(), created_at };
        index_1.io.to(`session:${id}`).emit("human_message", msgPayload);
        res.json({ ok: true, ...msgPayload });
    }
    catch (err) {
        console.error("[POST /api/admin/sessions/:id/human-message]", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});
exports.default = router;
