/**
 * Mark entity — a marks/grade record for one course and exam type.
 */
export interface Mark {
  id: string;
  collegeLinkId: string;
  courseCode: string;
  courseName: string | null;
  examType: string | null;
  maxMarks: number | null;
  obtainedMarks: number | null;
  grade: string | null;
  sgpa: number | null;
  cgpa: number | null;
  semester: string | null;
  rawData: unknown;
  syncedAt: Date;
  createdAt: Date;
}

/** Aggregated GPA summary. */
export interface GpaSummary {
  latestSgpa: number | null;
  latestCgpa: number | null;
  semester: string | null;
}
