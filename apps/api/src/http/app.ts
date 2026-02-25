import type { AuthVariables } from "@/http/middleware/auth";
import { errorHandler } from "@/http/middleware/error-handler";
import { rateLimiter } from "@/http/middleware/rate-limit";
import {
  attendanceRoutes,
  collegeLinkRoutes,
  collegeRoutes,
  coursesRoutes,
  marksRoutes,
  notificationRoutes,
  timetableRoutes,
} from "@/http/routes";
import { auth } from "@/infrastructure/auth/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

/**
 * Create and configure the Hono application.
 *
 * Returns the app instance and a function to register the manual sync route
 * (called after BullMQ queues are initialized).
 */
export function createApp() {
  const app = new Hono<{ Variables: AuthVariables }>();

  // ─── Global middleware ────────────────────────────────────────────────────
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    }),
  );

  // Rate limit: 100 requests per minute per user/IP
  app.use(
    "/api/*",
    rateLimiter({ max: 100, windowSeconds: 60, prefix: "rl:api" }),
  );

  // ─── Global error handler ────────────────────────────────────────────────
  app.onError(errorHandler);

  // ─── Better Auth handler ─────────────────────────────────────────────────
  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  // ─── Health & info ───────────────────────────────────────────────────────
  app.get("/", (c) => c.json({ name: "Axion API", version: "0.1.0" }));
  app.get("/health", (c) => c.json({ status: "ok" }));

  // ─── API routes ──────────────────────────────────────────────────────────
  app.route("/api/colleges", collegeRoutes);
  app.route("/api/college-links", collegeLinkRoutes);
  app.route("/api/attendance", attendanceRoutes);
  app.route("/api/timetable", timetableRoutes);
  app.route("/api/marks", marksRoutes);
  app.route("/api/courses", coursesRoutes);
  app.route("/api/notifications", notificationRoutes);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
