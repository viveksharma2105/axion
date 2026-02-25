/**
 * Timetable entity — a single class slot in the weekly schedule.
 */
export interface TimetableEntry {
  id: string;
  collegeLinkId: string;
  dayOfWeek: number;
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
