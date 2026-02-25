import type {
  IAttendanceRepository,
  ICollegeLinkRepository,
} from "@/application/ports/repositories";
import type { Attendance } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Get historical attendance data for trend charts.
 */
export class GetAttendanceHistoryUseCase {
  constructor(
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
  ) {}

  async execute(
    userId: string,
    options?: { courseCode?: string; limit?: number },
  ): Promise<Attendance[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) {
      throw new CollegeLinkNotFoundError();
    }

    return this.attendanceRepo.findHistory(link.id, options);
  }
}
