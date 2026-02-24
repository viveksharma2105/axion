/**
 * College adapter port — defines the contract that every college adapter
 * must implement. This is an application-layer port; concrete adapters
 * live in infrastructure/college-adapters/.
 *
 * See AXION.md section 8.1 for the full specification.
 */

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CollegeCredentials {
  username: string;
  password: string;
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface CollegeAuthResult {
  token: string;
  expiresAt?: Date;
  /** Opaque user ID from the college system (e.g., NCU's encoded ID) */
  collegeUserId?: string;
  rawResponse?: unknown;
}

export interface AttendanceRecord {
  courseCode: string;
  courseName: string;
  totalLectures: number;
  totalPresent: number;
  totalAbsent: number;
  totalLOA: number;
  totalOnDuty: number;
  percentage: number;
  raw?: unknown;
}

export interface TimetableEntry {
  /** 0 = Sunday, 1 = Monday, …, 6 = Saturday */
  dayOfWeek: number;
  /** "HH:mm" format */
  startTime: string;
  /** "HH:mm" format */
  endTime: string;
  courseCode: string;
  courseName: string;
  facultyName?: string;
  room?: string;
  section?: string;
  raw?: unknown;
}

export interface MarkRecord {
  courseCode: string;
  courseName: string;
  examType: string;
  maxMarks?: number;
  obtainedMarks?: number;
  grade?: string;
  sgpa?: number;
  cgpa?: number;
  semester?: string;
  raw?: unknown;
}

export interface CourseRecord {
  courseCode: string;
  courseName: string;
  credits?: number;
  facultyName?: string;
  section?: string;
  semester?: string;
  raw?: unknown;
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface CollegeAdapter {
  /** Unique adapter identifier — must match colleges.adapter_id in DB */
  readonly adapterId: string;

  /** Human-readable college name */
  readonly collegeName: string;

  /** Default attendance threshold percentage for this college */
  readonly attendanceThreshold: number;

  /** Authenticate with the college portal */
  login(credentials: CollegeCredentials): Promise<CollegeAuthResult>;

  /** Fetch attendance summary */
  getAttendance(auth: CollegeAuthResult): Promise<AttendanceRecord[]>;

  /** Fetch timetable/schedule */
  getTimetable(auth: CollegeAuthResult): Promise<TimetableEntry[]>;

  /** Fetch marks/grades */
  getMarks(auth: CollegeAuthResult): Promise<MarkRecord[]>;

  /** Fetch registered courses */
  getCourses(auth: CollegeAuthResult): Promise<CourseRecord[]>;

  /** Check if token is still valid (optional optimization) */
  isTokenValid?(auth: CollegeAuthResult): Promise<boolean>;

  /** Refresh an expired token (if the college API supports it) */
  refreshToken?(auth: CollegeAuthResult): Promise<CollegeAuthResult>;
}
