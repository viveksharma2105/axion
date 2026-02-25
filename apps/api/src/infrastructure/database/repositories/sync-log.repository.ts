import type {
  CreateSyncLogInput,
  ISyncLogRepository,
} from "@/application/ports/repositories";
import type { SyncLog } from "@/domain/entities";
import type { SyncLogStatus, SyncType } from "@/domain/value-objects";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { syncLogs } from "../schema";

type SyncLogRow = typeof syncLogs.$inferSelect;

function toEntity(row: SyncLogRow): SyncLog {
  return {
    id: row.id,
    collegeLinkId: row.collegeLinkId,
    syncType: row.syncType as SyncType,
    status: row.status as SyncLogStatus,
    errorMessage: row.errorMessage ?? null,
    durationMs: row.durationMs ?? null,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? null,
  };
}

export class SyncLogRepository implements ISyncLogRepository {
  async create(input: CreateSyncLogInput): Promise<SyncLog> {
    const [row] = await db
      .insert(syncLogs)
      .values({
        collegeLinkId: input.collegeLinkId,
        syncType: input.syncType,
        status: input.status,
        startedAt: input.startedAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to create sync log");
    }

    return toEntity(row);
  }

  async complete(
    id: string,
    data: {
      status: SyncLogStatus;
      errorMessage?: string;
      durationMs: number;
      completedAt: Date;
    },
  ): Promise<void> {
    await db
      .update(syncLogs)
      .set({
        status: data.status,
        errorMessage: data.errorMessage,
        durationMs: data.durationMs,
        completedAt: data.completedAt,
      })
      .where(eq(syncLogs.id, id));
  }

  async findByCollegeLink(
    collegeLinkId: string,
    options?: { limit?: number },
  ): Promise<SyncLog[]> {
    const rows = await db.query.syncLogs.findMany({
      where: eq(syncLogs.collegeLinkId, collegeLinkId),
      orderBy: [desc(syncLogs.startedAt)],
      limit: options?.limit ?? 10,
    });
    return rows.map(toEntity);
  }

  async countConsecutiveFailures(collegeLinkId: string): Promise<number> {
    // Get the most recent sync logs and count consecutive failures from the top
    const recentLogs = await db.query.syncLogs.findMany({
      where: eq(syncLogs.collegeLinkId, collegeLinkId),
      orderBy: [desc(syncLogs.startedAt)],
      limit: 10,
    });

    let failures = 0;
    for (const log of recentLogs) {
      if (log.status === "failed") {
        failures++;
      } else {
        break;
      }
    }
    return failures;
  }
}
