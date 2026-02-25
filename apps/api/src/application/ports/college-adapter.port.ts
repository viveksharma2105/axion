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
  /** Display name returned by the college system */
  displayName?: string;
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
  /** ISO date string "YYYY-MM-DD" for the specific lecture date */
  date: string;
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
  semester?: number;
  sessionName?: string;
  raw?: unknown;
}

export interface CourseRecord {
  courseCode: string;
  courseName: string;
  credits?: number;
  courseNature?: string;
  courseDeliveryMode?: string;
  electiveType?: string;
  /** "L-T-P" format, e.g., "3-0-2" */
  ltp?: string;
  semester?: number;
  rollNo?: string;
  raw?: unknown;
}

export interface DateSheetEntry {
  courseCode: string;
  courseName: string;
  /** ISO date string "YYYY-MM-DD" */
  examDate: string;
  /** Human-readable date, e.g., "04-Dec-2025" */
  examDateFormatted: string;
  startTime: string;
  endTime: string;
  room?: string;
  slotNo?: number;
  seatNo?: string;
  raw?: unknown;
}

export interface StudentProfile {
  rollNo: string;
  studentName: string;
  semester: number;
  programmeName: string;
  degreeLevel: string;
  fatherName?: string;
  mobileNo?: string;
  section?: string;
  /** Base64-encoded JPEG image (without data URI prefix) */
  studentImage?: string;
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

  /** Fetch exam date sheet (optional — not all colleges expose this) */
  getDateSheet?(auth: CollegeAuthResult): Promise<DateSheetEntry[]>;

  /** Fetch student profile details (optional) */
  getStudentProfile?(auth: CollegeAuthResult): Promise<StudentProfile>;

  /** Check if token is still valid (optional optimization) */
  isTokenValid?(auth: CollegeAuthResult): Promise<boolean>;

  /** Refresh an expired token (if the college API supports it) */
  refreshToken?(auth: CollegeAuthResult): Promise<CollegeAuthResult>;
}
