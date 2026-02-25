import type { ICollegeLinkRepository } from "@/application/ports/repositories";
import type { CollegeLinkWithCollege } from "@/domain/entities";

/**
 * Get all college links for the authenticated user.
 */
export class GetCollegeLinksUseCase {
  constructor(private readonly collegeLinkRepo: ICollegeLinkRepository) {}

  async execute(userId: string): Promise<CollegeLinkWithCollege[]> {
    return this.collegeLinkRepo.findByUserId(userId);
  }
}
