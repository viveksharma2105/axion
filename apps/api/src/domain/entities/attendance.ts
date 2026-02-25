/**
 * Attendance entity — a snapshot of attendance for one course
 * at a specific point in time.
 */
export interface Attendance {
  id: string;
  collegeLinkId: string;
  courseCode: string;
  courseName: string | null;
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  totalLoa: number;
  totalOnDuty: number;
  percentage: number | null;
  rawData: unknown;
  syncedAt: Date;
  createdAt: Date;
}

/** Calculated attendance analytics for a single course. */
export interface AttendanceProjection {
  courseCode: string;
  courseName: string | null;
  currentPercentage: number;
  totalLectures: number;
  totalPresent: number;
  /** Classes needed to reach the threshold */
  classesNeededForThreshold: number;
  /** Can the student still reach the threshold? */
  canReachThreshold: boolean;
  /** How many classes the student can skip and still meet threshold */
  classesCanSkip: number;
}
