import type { TimetableEntry } from "@/domain/entities";

export interface UpsertTimetableInput {
  collegeLinkId: string;
  dayOfWeek: number;
  /** ISO date "YYYY-MM-DD" */
  lectureDate: string | null;
  startTime: string;
  endTime: string;
  courseCode: string | null;
  courseName: string | null;
  facultyName: string | null;
  room: string | null;
  section: string | null;
  rawData: unknown;
  syncedAt: Date;
}

export interface ITimetableRepository {
  /** Get the full weekly timetable for a college link. */
  findByCollegeLink(collegeLinkId: string): Promise<TimetableEntry[]>;

  /** Get schedule for a college link filtered by date ("YYYY-MM-DD"). */
  findByDate(collegeLinkId: string, date: string): Promise<TimetableEntry[]>;

  /** @deprecated Use findByDate for date-accurate queries. */
  findByDay(
    collegeLinkId: string,
    dayOfWeek: number,
  ): Promise<TimetableEntry[]>;

  /**
   * Replace the entire timetable for a college link.
   * Deletes old entries and inserts new ones in a transaction.
   */
  replaceAll(
    collegeLinkId: string,
    entries: UpsertTimetableInput[],
  ): Promise<void>;

  /** Delete all timetable entries for a college link. */
  deleteByCollegeLink(collegeLinkId: string): Promise<void>;
}
