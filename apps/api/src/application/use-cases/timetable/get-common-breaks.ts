import type {
  ICollegeLinkRepository,
  ICollegeRepository,
  ITimetableRepository,
} from "@/application/ports/repositories";
import type { ICollegeAdapterService } from "@/application/ports/services";
import {
  CollegeApiError,
  CollegeLinkNotFoundError,
  InvalidCredentialsError,
} from "@/domain/errors";

// ─── Constants ───────────────────────────────────────────────────────────────

/** NCU college day boundaries (HH:mm) */
const DAY_START = "08:30";
const DAY_END = "16:20";

/** Minimum break duration to include (minutes) */
const MIN_BREAK_MINUTES = 11;

/** Monday – Saturday */
const WEEK_DAYS = [1, 2, 3, 4, 5, 6] as const;

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommonBreak {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DayBreaks {
  dayOfWeek: number;
  dayName: string;
  breaks: CommonBreak[];
}

export interface FriendTimetableEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  facultyName?: string;
  room?: string;
  section?: string;
}

export interface CompareResult {
  commonBreaks: DayBreaks[];
  friendTimetable: FriendTimetableEntry[];
}

interface TimeInterval {
  start: number; // minutes from midnight
  end: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:mm" to minutes from midnight. */
function toMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

/** Format minutes from midnight to "HH:mm". */
function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Merge overlapping or adjacent time intervals.
 * Assumes input is sorted by start.
 */
function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const first = sorted[0];
  if (!first) return [];

  const merged: TimeInterval[] = [first];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (!last || !curr) continue;

    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

/**
 * Find free gaps between merged busy intervals within
 * [dayStart, dayEnd]. Gaps shorter than minMinutes are excluded.
 */
function findFreeSlots(
  busyIntervals: TimeInterval[],
  dayStart: number,
  dayEnd: number,
  minMinutes: number,
): CommonBreak[] {
  const breaks: CommonBreak[] = [];
  let cursor = dayStart;

  for (const interval of busyIntervals) {
    // Clamp interval to the college day
    const start = Math.max(interval.start, dayStart);
    const end = Math.min(interval.end, dayEnd);

    if (start > cursor) {
      const dur = start - cursor;
      if (dur >= minMinutes) {
        breaks.push({
          startTime: toTimeString(cursor),
          endTime: toTimeString(start),
          durationMinutes: dur,
        });
      }
    }
    cursor = Math.max(cursor, end);
  }

  // Gap between last busy slot and end of day
  if (dayEnd > cursor) {
    const dur = dayEnd - cursor;
    if (dur >= minMinutes) {
      breaks.push({
        startTime: toTimeString(cursor),
        endTime: toTimeString(dayEnd),
        durationMinutes: dur,
      });
    }
  }

  return breaks;
}

// ─── Use Case ────────────────────────────────────────────────────────────────

export class GetCommonBreaksUseCase {
  constructor(
    private readonly timetableRepo: ITimetableRepository,
    private readonly collegeLinkRepo: ICollegeLinkRepository,
    private readonly collegeRepo: ICollegeRepository,
    private readonly adapterService: ICollegeAdapterService,
  ) {}

  async execute(
    userId: string,
    friendCredentials: { username: string; password: string },
  ): Promise<CompareResult> {
    // 1. Resolve the user's college link → college → adapter
    const links = await this.collegeLinkRepo.findByUserId(userId);
    const link = links[0];
    if (!link) throw new CollegeLinkNotFoundError();

    const college = await this.collegeRepo.findById(link.collegeId);
    if (!college) throw new CollegeLinkNotFoundError();

    const adapter = this.adapterService.getOrThrow(college.adapterId);

    // 2. Get the user's timetable from the DB
    const userEntries = await this.timetableRepo.findByCollegeLink(link.id);

    // 3. Fetch friend's timetable on-the-fly (ephemeral — never stored)
    let friendAuth: Awaited<ReturnType<typeof adapter.login>>;
    try {
      friendAuth = await adapter.login(friendCredentials);
    } catch {
      throw new InvalidCredentialsError(college.name);
    }

    let friendEntries: Awaited<ReturnType<typeof adapter.getTimetable>>;
    try {
      friendEntries = await adapter.getTimetable(friendAuth);
    } catch {
      throw new CollegeApiError(
        "Failed to fetch friend's timetable from college portal",
      );
    }

    // 4. Build busy intervals per day and compute common breaks
    const dayStart = toMinutes(DAY_START);
    const dayEnd = toMinutes(DAY_END);

    const result: DayBreaks[] = [];

    for (const day of WEEK_DAYS) {
      // User's lectures for this day
      const userBusy: TimeInterval[] = userEntries
        .filter((e) => e.dayOfWeek === day)
        .map((e) => ({
          start: toMinutes(e.startTime),
          end: toMinutes(e.endTime),
        }));

      // Friend's lectures for this day
      const friendBusy: TimeInterval[] = friendEntries
        .filter((e) => e.dayOfWeek === day)
        .map((e) => ({
          start: toMinutes(e.startTime),
          end: toMinutes(e.endTime),
        }));

      // Merge both into a single set of busy intervals
      const allBusy = mergeIntervals([...userBusy, ...friendBusy]);

      const breaks = findFreeSlots(
        allBusy,
        dayStart,
        dayEnd,
        MIN_BREAK_MINUTES,
      );

      result.push({
        dayOfWeek: day,
        dayName: DAY_NAMES[day] ?? "Unknown",
        breaks,
      });
    }

    // 5. Map friend entries to the response shape (strip raw data)
    const friendTimetable: FriendTimetableEntry[] = friendEntries.map((e) => ({
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      courseCode: e.courseCode,
      courseName: e.courseName,
      facultyName: e.facultyName,
      room: e.room,
      section: e.section,
    }));

    return { commonBreaks: result, friendTimetable };
  }
}
