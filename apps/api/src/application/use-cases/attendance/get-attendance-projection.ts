import type {
  IAttendanceRepository,
  ICollegeLinkRepository,
  ICollegeRepository,
} from "@/application/ports/repositories";
import type { AttendanceProjection } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Calculate attendance projections: classes needed for threshold,
 * classes that can be skipped, etc.
 */
export class GetAttendanceProjectionUseCase {
  constructor(
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly collegeRepo: ICollegeRepository,
  ) {}

  async execute(userId: string): Promise<AttendanceProjection[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) {
      throw new CollegeLinkNotFoundError();
    }

    const college = await this.collegeRepo.findById(link.collegeId);
    const threshold = college?.attendanceThreshold ?? 75;

    const records = await this.attendanceRepo.findLatestByCollegeLink(link.id);

    return records.map((r) => {
      const currentPct = r.percentage ?? 0;
      const total = r.totalLectures;
      const present = r.totalPresent;

      // Classes needed to reach threshold:
      // (present + x) / (total + x) >= threshold/100
      // => present + x >= threshold/100 * (total + x)
      // => x * (1 - threshold/100) >= threshold/100 * total - present
      // => x >= (threshold * total / 100 - present) / (1 - threshold/100)
      const thresholdFraction = threshold / 100;
      let classesNeeded = 0;
      let canReach = true;

      if (currentPct < threshold) {
        if (thresholdFraction >= 1) {
          // Impossible to reach 100% if any absences exist
          canReach = present >= total;
          classesNeeded = canReach ? 0 : Number.POSITIVE_INFINITY;
        } else {
          const needed = Math.ceil(
            (thresholdFraction * total - present) / (1 - thresholdFraction),
          );
          classesNeeded = Math.max(0, needed);
        }
      }

      // Classes that can be skipped while maintaining threshold:
      // (present) / (total + x) >= threshold/100
      // => present * 100 / threshold >= total + x
      // => x <= present * 100 / threshold - total
      const canSkip =
        thresholdFraction > 0
          ? Math.max(0, Math.floor(present / thresholdFraction - total))
          : Number.POSITIVE_INFINITY;

      return {
        courseCode: r.courseCode,
        courseName: r.courseName,
        currentPercentage: currentPct,
        totalLectures: total,
        totalPresent: present,
        classesNeededForThreshold: Number.isFinite(classesNeeded)
          ? classesNeeded
          : -1,
        canReachThreshold: canReach && Number.isFinite(classesNeeded),
        classesCanSkip: Number.isFinite(canSkip) ? canSkip : -1,
      };
    });
  }
}
