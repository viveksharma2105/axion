import type { IUserProfileRepository } from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { UserProfile } from "@/domain/entities";

/**
 * Get the student profile for the authenticated user.
 */
export class GetStudentProfileUseCase {
  constructor(
    private readonly userProfileRepo: IUserProfileRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(userId: string): Promise<UserProfile | null> {
    const cached = await this.cacheService.get<UserProfile>(
      "student-profile",
      userId,
    );
    if (cached) return cached;

    const profile = await this.userProfileRepo.findByUserId(userId);

    if (profile) {
      await this.cacheService.set("student-profile", userId, profile);
    }

    return profile;
  }
}
