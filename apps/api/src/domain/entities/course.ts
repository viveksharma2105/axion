/**
 * Course entity — a registered course for the current semester.
 */
export interface Course {
  id: string;
  collegeLinkId: string;
  courseCode: string;
  courseName: string;
  credits: number | null;
  facultyName: string | null;
  section: string | null;
  semester: string | null;
  rawData: unknown;
  syncedAt: Date;
  createdAt: Date;
}
