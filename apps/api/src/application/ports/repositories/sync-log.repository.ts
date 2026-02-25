import type { SyncLog } from "@/domain/entities";
import type { SyncLogStatus, SyncType } from "@/domain/value-objects";

export interface CreateSyncLogInput {
  collegeLinkId: string;
  syncType: SyncType;
  status: SyncLogStatus;
  startedAt: Date;
}

export interface ISyncLogRepository {
  /** Create a new sync log entry. */
  create(input: CreateSyncLogInput): Promise<SyncLog>;

  /** Update a sync log with completion status. */
  complete(
    id: string,
    data: {
      status: SyncLogStatus;
      errorMessage?: string;
      durationMs: number;
      completedAt: Date;
    },
  ): Promise<void>;

  /** Get recent sync logs for a college link. */
  findByCollegeLink(
    collegeLinkId: string,
    options?: { limit?: number },
  ): Promise<SyncLog[]>;

  /** Count consecutive failures for a college link. */
  countConsecutiveFailures(collegeLinkId: string): Promise<number>;
}
