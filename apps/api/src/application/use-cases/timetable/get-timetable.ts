import type {
  ICollegeLinkRepository,
  ITimetableRepository,
} from "@/application/ports/repositories";
import type { ICacheService } from "@/application/ports/services";
import type { TimetableEntry } from "@/domain/entities";
import { CollegeLinkNotFoundError } from "@/domain/errors";

/**
 * Get the full weekly timetable for the user's linked college.
 */
export class GetTimetableUseCase {
  constructor(
    private readonly timetableRepo: ITimetableRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(userId: string): Promise<TimetableEntry[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    const cached = await this.cacheService.get<TimetableEntry[]>(
      "timetable",
      link.id,
    );
    if (cached) return cached;

    const entries = await this.timetableRepo.findByCollegeLink(link.id);

    if (entries.length > 0) {
      await this.cacheService.set("timetable", link.id, entries);
    }

    return entries;
  }
}

/** Format a Date as "YYYY-MM-DD" in local time. */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's schedule for the user.
 *
 * Filters by the exact lecture date (YYYY-MM-DD) so that lectures
 * scheduled for a future date with the same day-of-week are excluded.
 */
export class GetTodayScheduleUseCase {
  constructor(
    private readonly timetableRepo: ITimetableRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
  ) {}

  async execute(userId: string): Promise<TimetableEntry[]> {
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    const today = toLocalDateString(new Date());
    return this.timetableRepo.findByDate(link.id, today);
  }
}
