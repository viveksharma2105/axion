import { auth } from "@/infrastructure/auth/auth";
import { registerAdapters } from "@/infrastructure/college-adapters";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// ─── Register college adapters at startup ────────────────────────────────────
registerAdapters();

// ─── Create Hono app ─────────────────────────────────────────────────────────
const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// ─── Better Auth handler ─────────────────────────────────────────────────────
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ─── API routes ──────────────────────────────────────────────────────────────
app.get("/", (c) => {
  return c.json({ name: "Axion API", version: "0.1.0" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
