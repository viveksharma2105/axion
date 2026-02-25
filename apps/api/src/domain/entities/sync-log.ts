/**
 * SyncLog entity — a record of a sync operation.
 */
import type { SyncLogStatus, SyncType } from "../value-objects";

export interface SyncLog {
  id: string;
  collegeLinkId: string;
  syncType: SyncType;
  status: SyncLogStatus;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: Date;
  completedAt: Date | null;
}
