import type {
  ICollegeLinkRepository,
  ICoursesRepository,
} from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { Course } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Get registered courses for the user's linked college.
 */
export class GetCoursesUseCase {
  constructor(
    private readonly coursesRepo: ICoursesRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(userId: string): Promise<Course[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    const cached = await this.cacheService.get<Course[]>("courses", link.id);
    if (cached) return cached;

    const courses = await this.coursesRepo.findByCollegeLink(link.id);

    if (courses.length > 0) {
      await this.cacheService.set("courses", link.id, courses);
    }

    return courses;
  }
}
