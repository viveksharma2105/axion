import type { ICollegeLinkRepository } from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Unlink (delete) a college account from the user's Axion account.
 * Invalidates all related cache entries.
 */
export class UnlinkCollegeUseCase {
  constructor(
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(collegeLinkId: string, userId: string): Promise<void> {
    // Invalidate cache before deleting so we have the ID
    await this.cacheService.invalidateCollegeLink(collegeLinkId);

    const deleted = await this.collegeLinkRepo.deleteByIdAndUser(
      collegeLinkId,
      userId,
    );
    if (!deleted) {
      throw new CollegeLinkNotFoundError(collegeLinkId);
    }
  }
}
