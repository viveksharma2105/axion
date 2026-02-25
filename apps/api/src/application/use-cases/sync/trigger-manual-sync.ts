import type { ICollegeLinkRepository } from "@/application/ports/repositories";
import { CollegeLinkNotFoundError, SyncInProgressError } from "@/domain/errors";
import { SyncStatus } from "@/domain/value-objects";

/**
 * Trigger a manual sync for a specific college link.
 * This is called from the HTTP layer when the user requests a sync.
 * In practice, it enqueues a BullMQ job, but the use case validates
 * ownership and current sync status first.
 */
export class TriggerManualSyncUseCase {
  constructor(
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly enqueueSyncJob: (collegeLinkId: string) => Promise<void>,
  ) {}

  async execute(collegeLinkId: string, userId: string): Promise<void> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links.find((l) => l.id === collegeLinkId);

    if (!link) {
      throw new CollegeLinkNotFoundError(collegeLinkId);
    }

    if (link.syncStatus === SyncStatus.SYNCING) {
      throw new SyncInProgressError();
    }

    await this.enqueueSyncJob(collegeLinkId);
  }
}
