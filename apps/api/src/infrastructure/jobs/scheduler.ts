import { collegeLinkRepo } from "@/http/container";
import { enqueueSyncJob } from "./queues";

/**
 * Cron scheduler — enqueues sync jobs for all active college links.
 *
 * Designed to be triggered by an external cron mechanism (e.g., BullMQ
 * repeat job, OS crontab, or the main process on a timer).
 */
export async function scheduleAllSyncs(): Promise<number> {
  const activeLinks = await collegeLinkRepo.findAllActive();
  console.log(
    `[Scheduler] Enqueuing sync jobs for ${activeLinks.length} active links`,
  );

  let enqueued = 0;
  for (const link of activeLinks) {
    try {
      await enqueueSyncJob(link.id);
      enqueued++;
    } catch (err) {
      console.error(
        `[Scheduler] Failed to enqueue sync for link ${link.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(
    `[Scheduler] Enqueued ${enqueued}/${activeLinks.length} sync jobs`,
  );
  return enqueued;
}

/**
 * Start the cron scheduler using BullMQ's repeatable jobs.
 * Runs twice daily at 7:00 AM and 7:00 PM IST (1:30 AM and 1:30 PM UTC).
 */
export async function startCronScheduler(): Promise<void> {
  const cronSchedule = process.env.SYNC_CRON_SCHEDULE || "0 7,19 * * *";

  // Use the sync queue to schedule the "scheduleSyncAll" job
  const { syncQueue } = await import("./queues");

  // Remove any existing repeatable job with the same key
  const existingRepeatables = await syncQueue.getRepeatableJobs();
  for (const job of existingRepeatables) {
    if (job.name === "scheduleSyncAll") {
      await syncQueue.removeRepeatableByKey(job.key);
    }
  }

  await syncQueue.add(
    "scheduleSyncAll",
    {},
    {
      repeat: { pattern: cronSchedule },
      jobId: "cron-scheduleSyncAll",
    },
  );

  console.log(`[Scheduler] Cron registered: "${cronSchedule}"`);
}
