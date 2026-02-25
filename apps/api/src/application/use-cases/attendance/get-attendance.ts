import type {
  IAttendanceRepository,
  ICollegeLinkRepository,
} from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { Attendance } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Get the latest attendance summary for the user's linked college.
 * Uses cache-first strategy: Redis -> Postgres -> return.
 */
export class GetAttendanceUseCase {
  constructor(
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(userId: string): Promise<Attendance[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) {
      throw new CollegeLinkNotFoundError();
    }

    // Check cache
    const cached = await this.cacheService.get<Attendance[]>(
      "attendance",
      link.id,
    );
    if (cached) return cached;

    // Query DB
    const records = await this.attendanceRepo.findLatestByCollegeLink(link.id);

    // Populate cache
    if (records.length > 0) {
      await this.cacheService.set("attendance", link.id, records);
    }

    return records;
  }
}
