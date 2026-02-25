import { redis } from "@/infrastructure/cache/redis";
import { type ConnectionOptions, Queue } from "bullmq";

/**
 * Shared BullMQ connection using the existing ioredis instance.
 */
export const bullmqConnection: ConnectionOptions = {
  host: redis.options.host ?? "localhost",
  port: redis.options.port ?? 6379,
  password: redis.options.password,
  db: redis.options.db ?? 0,
};

// ─── Queue names ─────────────────────────────────────────────────────────────

export const SYNC_QUEUE = "sync-queue";
export const NOTIFICATION_QUEUE = "notification-queue";

// ─── Queue instances ─────────────────────────────────────────────────────────

export const syncQueue = new Queue(SYNC_QUEUE, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60_000, // 1min, 5min, 15min approximately
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const notificationQueue = new Queue(NOTIFICATION_QUEUE, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 30_000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

// ─── Job types ───────────────────────────────────────────────────────────────

export interface SyncCollegeLinkJobData {
  collegeLinkId: string;
}

export interface CheckAttendanceAlertsJobData {
  collegeLinkId: string;
  userId: string;
}

/**
 * Enqueue a sync job for a single college link.
 */
export async function enqueueSyncJob(collegeLinkId: string): Promise<void> {
  await syncQueue.add(
    "syncCollegeLink",
    { collegeLinkId } satisfies SyncCollegeLinkJobData,
    {
      jobId: `sync:${collegeLinkId}`,
      // Deduplicate — if a sync job for this link is already queued, skip
    },
  );
}

/**
 * Enqueue an attendance alert check after a successful sync.
 */
export async function enqueueAttendanceAlertCheck(
  collegeLinkId: string,
  userId: string,
): Promise<void> {
  await notificationQueue.add("checkAttendanceAlerts", {
    collegeLinkId,
    userId,
  } satisfies CheckAttendanceAlertsJobData);
}
