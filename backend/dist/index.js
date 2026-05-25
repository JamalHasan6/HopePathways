"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const session_1 = __importDefault(require("./routes/session"));
const admin_1 = __importDefault(require("./routes/admin"));
const triage_1 = __importDefault(require("./routes/triage"));
const db_1 = require("./db");
const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:8081",
    "https://happy-bush-0b1c48700.7.azurestaticapps.net",
    "https://kind-bay-067e62600.7.azurestaticapps.net",
];
const envOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOrigins = envOrigins.length > 0
    ? [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])]
    : DEFAULT_ALLOWED_ORIGINS;
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
});
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({ origin: corsOrigins }));
app.use(express_1.default.json());
app.use("/api/session", session_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/triage", triage_1.default);
app.get("/", (_req, res) => {
    res.json({
        message: "Hope Pathways backend is running",
        health: "/api/health",
    });
});
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "hope-pathways-backend" });
});
exports.io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    // Users join a room for their session so admin messages reach them
    socket.on("join_session", (sessionId) => {
        socket.join(`session:${sessionId}`);
        console.log(`Socket ${socket.id} joined room session:${sessionId}`);
    });
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
(0, db_1.initDb)()
    .then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🌿 Hope Pathways backend running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.warn("⚠️  Failed to connect to Azure SQL:", err.message);
    console.warn("Starting backend without database. Some features will be unavailable.");
    httpServer.listen(PORT, () => {
        console.log(`🌿 Hope Pathways backend running on http://localhost:${PORT} (without DB)`);
    });
});
exports.default = app;
