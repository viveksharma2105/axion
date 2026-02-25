import { collegeLinkRepo, syncCollegeLinkUseCase } from "@/http/container";
import { SyncLogRepository } from "@/infrastructure/database/repositories/sync-log.repository";
import { MAX_CONSECUTIVE_FAILURES } from "@axion/shared";
import { Worker } from "bullmq";
import {
  SYNC_QUEUE,
  type SyncCollegeLinkJobData,
  bullmqConnection,
  enqueueAttendanceAlertCheck,
  enqueueSyncJob,
} from "./queues";

const syncLogRepo = new SyncLogRepository();

/**
 * Sync worker — processes two job types:
 *
 * 1. `syncCollegeLink` — sync a single college link
 * 2. `scheduleSyncAll`  — cron job that enqueues sync jobs for all active links
 *
 * On sync success: enqueues attendance alert checks.
 * On sync failure: after MAX_CONSECUTIVE_FAILURES, deactivates the college link.
 */
export function createSyncWorker() {
  const worker = new Worker(
    SYNC_QUEUE,
    async (job) => {
      // ── Cron: enqueue all active links ──────────────────────────────────
      if (job.name === "scheduleSyncAll") {
        const activeLinks = await collegeLinkRepo.findAllActive();
        console.log(
          `[SyncWorker] Cron: enqueuing sync for ${activeLinks.length} active links`,
        );
        for (const link of activeLinks) {
          await enqueueSyncJob(link.id);
        }
        return;
      }

      // ── Per-link sync ───────────────────────────────────────────────────
      const { collegeLinkId } = job.data as SyncCollegeLinkJobData;
      console.log(`[SyncWorker] Processing sync for link ${collegeLinkId}`);

      try {
        await syncCollegeLinkUseCase.execute(collegeLinkId);
        console.log(`[SyncWorker] Sync complete for link ${collegeLinkId}`);

        // Look up the link to get the userId for notification check
        const link = await collegeLinkRepo.findById(collegeLinkId);
        if (link) {
          await enqueueAttendanceAlertCheck(collegeLinkId, link.userId);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[SyncWorker] Sync failed for link ${collegeLinkId}:`,
          message,
        );

        // Check for consecutive failures → deactivate link
        const consecutiveFailures =
          await syncLogRepo.countConsecutiveFailures(collegeLinkId);

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.warn(
            `[SyncWorker] Deactivating link ${collegeLinkId} after ${consecutiveFailures} consecutive failures`,
          );
          await collegeLinkRepo.deactivate(collegeLinkId);
        }

        throw error; // Re-throw so BullMQ handles retries
      }
    },
    {
      connection: bullmqConnection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[SyncWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
      err.message,
    );
  });

  worker.on("error", (err) => {
    console.error("[SyncWorker] Worker error:", err.message);
  });

  console.log("[SyncWorker] Started");
  return worker;
}
