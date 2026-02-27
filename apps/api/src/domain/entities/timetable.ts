/**
 * Timetable entity — a single class slot in the schedule.
 */
export interface TimetableEntry {
  id: string;
  collegeLinkId: string;
  dayOfWeek: number;
  /** ISO date "YYYY-MM-DD" — the specific date this lecture is scheduled for */
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
  createdAt: Date;
}
