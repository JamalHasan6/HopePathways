import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import sessionRoutes from "./routes/session";
import adminRoutes from "./routes/admin";
import triageRoutes from "./routes/triage";
import { initDb } from "./db";

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

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: corsOrigins, methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3001;

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/triage", triageRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "Hope Pathways backend is running",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "hope-pathways-backend" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Users join a room for their session so admin messages reach them
  socket.on("join_session", (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined room session:${sessionId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

initDb()
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

export default app;
