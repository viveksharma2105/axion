import { createApp } from "@/http/app";
import { createTriggerManualSyncUseCase } from "@/http/container";
import { authMiddleware } from "@/http/middleware/auth";
import type { AuthVariables } from "@/http/middleware/auth";
import { registerAdapters } from "@/infrastructure/college-adapters";
import {
  createNotificationWorker,
  createSyncWorker,
  enqueueSyncJob,
  startCronScheduler,
} from "@/infrastructure/jobs";
import { Hono } from "hono";

// ─── Register college adapters at startup ────────────────────────────────────
registerAdapters();

// ─── Create app ──────────────────────────────────────────────────────────────
const app = createApp();

// ─── Wire up manual sync route (needs BullMQ enqueueSyncJob) ─────────────────
// This route requires the BullMQ queue, so we add it after the app is created
const triggerManualSyncUseCase = createTriggerManualSyncUseCase(enqueueSyncJob);

const syncRoute = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .post("/:id/sync", async (c) => {
    const userId = c.get("userId");
    const collegeLinkId = c.req.param("id");

    await triggerManualSyncUseCase.execute(collegeLinkId, userId);
    return c.json({ data: { success: true, message: "Sync job enqueued" } });
  });

app.route("/api/college-links", syncRoute);

// ─── Start BullMQ workers ────────────────────────────────────────────────────
createSyncWorker();
createNotificationWorker();

// ─── Start cron scheduler ────────────────────────────────────────────────────
startCronScheduler().catch((err) => {
  console.error("[Startup] Failed to start cron scheduler:", err);
});

// ─── Start server ────────────────────────────────────────────────────────────
console.log(`[Axion API] Starting on port ${process.env.PORT || 3000}`);

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
