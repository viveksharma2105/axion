import { createApp } from "@/http/app";
import { registerAdapters } from "@/infrastructure/college-adapters";
import {
  createNotificationWorker,
  createSyncWorker,
  enqueueSyncJob,
  startCronScheduler,
} from "@/infrastructure/jobs";

// ─── Register college adapters at startup ────────────────────────────────────
registerAdapters();

// ─── Create app ──────────────────────────────────────────────────────────────
// Pass enqueueSyncJob so that:
// 1. POST /college-links triggers initial sync after linking
// 2. POST /college-links/:id/sync enqueues a manual sync job
const app = createApp(enqueueSyncJob);

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
