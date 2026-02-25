import type {
  ICollegeLinkRepository,
  IMarksRepository,
} from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { GpaSummary, Mark } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Get all marks/grades for the user's linked college.
 */
export class GetMarksUseCase {
  constructor(
    private readonly marksRepo: IMarksRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(
    userId: string,
    options?: { semester?: string; examType?: string },
  ): Promise<Mark[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    const cached = await this.cacheService.get<Mark[]>("marks", link.id);
    if (cached && !options?.semester && !options?.examType) return cached;

    const records = await this.marksRepo.findByCollegeLink(link.id, options);

    if (records.length > 0 && !options?.semester && !options?.examType) {
      await this.cacheService.set("marks", link.id, records);
    }

    return records;
  }
}

/**
 * Get GPA summary (latest SGPA/CGPA).
 */
export class GetMarksSummaryUseCase {
  constructor(
    private readonly marksRepo: IMarksRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
  ) {}

  async execute(userId: string): Promise<GpaSummary> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    return this.marksRepo.getGpaSummary(link.id);
  }
}
