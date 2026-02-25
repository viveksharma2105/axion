import type {
  AttendanceRecord,
  CollegeAdapter,
  CollegeAuthResult,
  CollegeCredentials,
  CourseRecord,
  DateSheetEntry,
  MarkRecord,
  StudentProfile,
  TimetableEntry,
} from "@/application/ports/college-adapter.port";

// ─── NCU API Configuration ──────────────────────────────────────────────────

const NCU_CONFIG = {
  baseUrl: "https://uatapi.ncuindia.edu/api",
  origin: "https://mycampus.ncuindia.edu",
  referer: "https://mycampus.ncuindia.edu/",
  paths: {
    login: "/Authentication/ValidateUser",
    attendance: "/myapp/Registration/GetAttendanceSummary",
    schedule: "/myapp/Student/GetSchedule",
    currentCourses: "/myapp/Registration/GetCurrentCourses",
    resultSummary: "/myapp/Examination/GetResultSummary",
    dateSheet: "/myapp/Examination/GetDateSheet",
    studentDetails: "/myapp/Dashboard/GetStudentBasicDetails",
    internalMarks: "/myapp/Examination/GetInternalMarks",
  },
} as const;

// ─── NCU Adapter ─────────────────────────────────────────────────────────────

/**
 * NCU India (The NorthCap University) adapter.
 *
 * Implements the CollegeAdapter interface using the reverse-engineered
 * MyCampus API at mycampus.ncuindia.edu.
 *
 * API patterns:
 * - All data endpoints use GET with `?userId=<encodedId>` query param
 * - The `userId` must be URL-encoded (contains `=` which becomes `%3D`)
 * - All responses wrap data in `{Data, FileName, StatusCode, Message, Succeeded}`
 * - The `Data` field is a **stringified JSON** string (not a direct object/array)
 * - Auth token goes in `Authorization: Bearer <token>` header
 * - Origin/Referer headers are required (CORS)
 */
export class NcuAdapter implements CollegeAdapter {
  readonly adapterId = "ncu-india";
  readonly collegeName = "The NorthCap University";
  readonly attendanceThreshold = 75;

  async login(credentials: CollegeCredentials): Promise<CollegeAuthResult> {
    const response = await fetch(
      `${NCU_CONFIG.baseUrl}${NCU_CONFIG.paths.login}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer null",
          Origin: NCU_CONFIG.origin,
          Referer: NCU_CONFIG.referer,
        },
        body: JSON.stringify({
          UserName: credentials.username,
          Password: credentials.password,
          IpAddress: "",
          UserType: "",
        }),
      },
    );

    if (!response.ok) {
      throw new NcuApiError(
        `Login request failed with HTTP ${response.status}`,
        response.status,
      );
    }

    const data = (await response.json()) as NcuLoginResponse;
    return parseLoginResponse(data);
  }

  async getAttendance(auth: CollegeAuthResult): Promise<AttendanceRecord[]> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.attendance,
      auth,
    );
    return parseAttendanceData(json);
  }

  async getTimetable(auth: CollegeAuthResult): Promise<TimetableEntry[]> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.schedule,
      auth,
    );
    return parseScheduleData(json);
  }

  async getMarks(auth: CollegeAuthResult): Promise<MarkRecord[]> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.resultSummary,
      auth,
    );
    return parseResultSummaryData(json);
  }

  async getCourses(auth: CollegeAuthResult): Promise<CourseRecord[]> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.currentCourses,
      auth,
    );
    return parseCoursesData(json);
  }

  async getDateSheet(auth: CollegeAuthResult): Promise<DateSheetEntry[]> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.dateSheet,
      auth,
    );
    return parseDateSheetData(json);
  }

  async getStudentProfile(auth: CollegeAuthResult): Promise<StudentProfile> {
    const json = await this.fetchEndpoint<NcuApiResponse>(
      NCU_CONFIG.paths.studentDetails,
      auth,
    );
    return parseStudentProfileData(json);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Generic fetch for NCU data endpoints.
   * All data endpoints use GET with `?userId=<encodedId>`.
   */
  private async fetchEndpoint<T>(
    path: string,
    auth: CollegeAuthResult,
  ): Promise<T> {
    if (!auth.collegeUserId) {
      throw new NcuApiError(
        "Missing collegeUserId — login first to obtain the encoded user ID",
        400,
      );
    }

    const encodedUserId = encodeURIComponent(auth.collegeUserId);
    const url = `${NCU_CONFIG.baseUrl}${path}?userId=${encodedUserId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Origin: NCU_CONFIG.origin,
        Referer: NCU_CONFIG.referer,
      },
    });

    if (!response.ok) {
      throw new NcuApiError(
        `NCU API error at ${path}: HTTP ${response.status}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  }
}

// ─── NCU Response Types (internal) ───────────────────────────────────────────

/**
 * Login response: `{token, User: {UserId, Name, Details}}`
 * Failed login: `{Data: null, StatusCode: 200, Message: "Invalid Username and Password", Succeeded: false}`
 */
interface NcuLoginResponse {
  // Successful login fields
  token?: string;
  User?: {
    UserId?: string;
    Name?: string;
    Details?: string;
  };
  // Failed login fields (same wrapper as data endpoints)
  Data?: unknown;
  StatusCode?: number;
  Message?: string;
  Succeeded?: boolean;
}

/**
 * Standard NCU API response wrapper.
 * `Data` is always a **stringified JSON** string when present.
 */
interface NcuApiResponse {
  Data?: string | null;
  FileName?: string | null;
  StatusCode?: number;
  Message?: string;
  Succeeded?: boolean;
}

// ─── Raw row types from parsed Data ─────────────────────────────────────────

interface NcuAttendanceRow {
  CourseCode?: string;
  CourseName?: string;
  TotalLectures?: number;
  TotalPresent?: number;
  TotalAbsent?: number;
  TotalLOA?: number;
  TotalOnDuty?: number;
  /** NCU uses Percentage1, NOT Percentage */
  Percentage1?: number;
}

interface NcuScheduleData {
  /** Dates with max lecture slots */
  Table?: NcuScheduleDateRow[];
  /** Actual schedule entries */
  Table1?: NcuScheduleEntryRow[];
}

interface NcuScheduleDateRow {
  LdATE?: string;
  LectureDate?: string;
  MaxRow?: number;
}

interface NcuScheduleEntryRow {
  StartTime?: string;
  /** Note: lowercase 'e' — inconsistent casing from NCU API */
  endtime?: string;
  LdATE?: string;
  CourseDetails?: string;
  FACULTYNAME?: string;
  LectureDate?: string;
  LectureTiming?: string;
  ClassRoomNo?: string;
  MaxRow?: number;
  FacultyImage?: string;
}

interface NcuCourseRow {
  RollNo?: string;
  SemesterNo?: number;
  CourseNature?: string;
  CourseDeliveryMode?: string;
  /** Format: "CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT" */
  CourseDetails?: string;
  TotalCredit?: string;
  Mode?: string;
  ChangeMode?: string;
  LTP?: string;
  Selected?: boolean;
  TypeName?: string;
  ElectiveType?: string | null;
  Scheme?: string;
}

interface NcuResultSummaryRow {
  /** e.g., "Jul-Dec - 2024" */
  SessionDetails?: string;
  SemesterNo?: number;
  Session?: number;
}

interface NcuDateSheetRow {
  CourseCode?: string;
  CourseName?: string;
  /** e.g., "04-Dec-2025" */
  Examdates?: string;
  StartTiming?: string;
  EndTiming?: string;
  RoomName?: string | null;
  SlotNo?: number;
  /** ISO format: "2025-12-04T00:00:00" */
  ExamDate?: string;
  SeatNo?: string | null;
  SeatingRow?: string | null;
  SeatingDesk?: string | null;
}

interface NcuStudentDetailRow {
  RollNo?: string;
  StudentName?: string;
  Sem?: string;
  ProgrammeName?: string;
  DegreeLevel?: string;
  FatherName?: string;
  PersonalMobileNo?: string;
  SemesterNo?: number;
  SectionName?: string;
  StudentImage?: string;
}

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

/**
 * Extract typed rows from NCU's stringified Data field.
 * Returns an empty array if Data is null/undefined.
 */
function parseDataField<T>(response: NcuApiResponse): T[] {
  const rawData = response.Data;

  if (rawData == null) {
    return [];
  }

  if (typeof rawData === "string") {
    try {
      return JSON.parse(rawData) as T[];
    } catch {
      throw new NcuApiError(
        "Failed to parse NCU API Data field as JSON",
        500,
      );
    }
  }

  return [];
}

/**
 * Parse login response.
 *
 * Successful: `{token: "eyJ...", User: {UserId: "abc=", Name: "23CSU343"}}`
 * Failed: `{Data: null, Message: "Invalid Username and Password", Succeeded: false}`
 */
export function parseLoginResponse(data: NcuLoginResponse): CollegeAuthResult {
  // Check for failed login (wrapper format with Succeeded: false)
  if (data.Succeeded === false || (!data.token && !data.User)) {
    const message =
      data.Message || "Invalid credentials or unexpected response";
    throw new NcuApiError(message, 401);
  }

  const token = data.token;
  if (!token) {
    throw new NcuApiError("No token in login response", 401);
  }

  const collegeUserId = data.User?.UserId;

  return {
    token,
    collegeUserId: collegeUserId ?? undefined,
    displayName: data.User?.Name?.trim() ?? undefined,
    rawResponse: data,
  };
}

/**
 * Parse attendance summary response.
 *
 * Data is stringified JSON array with fields:
 * `CourseCode, CourseName, TotalLectures, TotalPresent, TotalAbsent, TotalLOA, TotalOnDuty, Percentage1`
 */
export function parseAttendanceData(
  response: NcuApiResponse,
): AttendanceRecord[] {
  const rows = parseDataField<NcuAttendanceRow>(response);
  return rows.map(mapAttendanceRow);
}

function mapAttendanceRow(row: NcuAttendanceRow): AttendanceRecord {
  return {
    courseCode: row.CourseCode ?? "UNKNOWN",
    courseName: row.CourseName ?? "Unknown Course",
    totalLectures: row.TotalLectures ?? 0,
    totalPresent: row.TotalPresent ?? 0,
    totalAbsent: row.TotalAbsent ?? 0,
    totalLOA: row.TotalLOA ?? 0,
    totalOnDuty: row.TotalOnDuty ?? 0,
    percentage: row.Percentage1 ?? 0,
    raw: row,
  };
}

/**
 * Parse schedule response.
 *
 * Data is stringified JSON with `{Table: [...], Table1: [...]}`.
 * - `Table` = dates with max lecture slots
 * - `Table1` = actual entries with StartTime, endtime, CourseDetails, etc.
 *
 * CourseDetails format: `"CSC301 -SEMINAR"` (code + space + dash + name)
 */
export function parseScheduleData(
  response: NcuApiResponse,
): TimetableEntry[] {
  const rawData = response.Data;

  if (rawData == null) {
    return [];
  }

  let scheduleData: NcuScheduleData;
  if (typeof rawData === "string") {
    try {
      scheduleData = JSON.parse(rawData) as NcuScheduleData;
    } catch {
      throw new NcuApiError("Failed to parse schedule Data as JSON", 500);
    }
  } else {
    return [];
  }

  const entries = scheduleData.Table1;
  if (!entries || !Array.isArray(entries)) {
    return [];
  }

  return entries.map(mapScheduleEntry);
}

function mapScheduleEntry(row: NcuScheduleEntryRow): TimetableEntry {
  const { code, name } = parseCourseDetails(row.CourseDetails);
  const date = parseNcuDate(row.LectureDate);
  const dayOfWeek = date ? new Date(date).getUTCDay() : 0;

  return {
    date: date ?? "",
    dayOfWeek,
    startTime: formatTimeHHmm(row.StartTime),
    endTime: formatTimeHHmm(row.endtime),
    courseCode: code,
    courseName: name,
    facultyName: row.FACULTYNAME?.trim() || undefined,
    room: row.ClassRoomNo?.trim() || undefined,
    raw: row,
  };
}

/**
 * Parse current courses response.
 *
 * CourseDetails format: `"CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT"`
 */
export function parseCoursesData(response: NcuApiResponse): CourseRecord[] {
  const rows = parseDataField<NcuCourseRow>(response);
  return rows.map(mapCourseRow);
}

function mapCourseRow(row: NcuCourseRow): CourseRecord {
  const { code, name } = parseCourseDetails(row.CourseDetails);

  return {
    courseCode: code,
    courseName: name,
    credits: row.TotalCredit ? Number.parseFloat(row.TotalCredit) : undefined,
    courseNature: row.CourseNature ?? undefined,
    courseDeliveryMode: row.CourseDeliveryMode ?? undefined,
    electiveType: row.ElectiveType ?? undefined,
    ltp: row.LTP ?? undefined,
    semester: row.SemesterNo ?? undefined,
    rollNo: row.RollNo ?? undefined,
    raw: row,
  };
}

/**
 * Parse result summary response.
 *
 * Returns semester list with session details. NCU's `GetInternalMarks`
 * endpoint returns HTTP 500, so we use `GetResultSummary` which provides
 * session/semester info. The actual detailed grade sheet (DGS) is a PDF
 * and cannot be parsed into structured mark records.
 */
export function parseResultSummaryData(
  response: NcuApiResponse,
): MarkRecord[] {
  const rows = parseDataField<NcuResultSummaryRow>(response);
  return rows.map(mapResultSummaryRow);
}

function mapResultSummaryRow(row: NcuResultSummaryRow): MarkRecord {
  return {
    courseCode: "",
    courseName: "",
    examType: "semester",
    semester: row.SemesterNo ?? undefined,
    sessionName: row.SessionDetails ?? undefined,
    raw: row,
  };
}

/**
 * Parse date sheet response.
 */
export function parseDateSheetData(
  response: NcuApiResponse,
): DateSheetEntry[] {
  const rows = parseDataField<NcuDateSheetRow>(response);
  return rows.map(mapDateSheetRow);
}

function mapDateSheetRow(row: NcuDateSheetRow): DateSheetEntry {
  const examDate = parseNcuDate(row.ExamDate);

  return {
    courseCode: row.CourseCode ?? "UNKNOWN",
    courseName: row.CourseName ?? "Unknown Course",
    examDate: examDate ?? "",
    examDateFormatted: row.Examdates ?? "",
    startTime: row.StartTiming ?? "",
    endTime: row.EndTiming ?? "",
    room: row.RoomName ?? undefined,
    slotNo: row.SlotNo ?? undefined,
    seatNo: row.SeatNo ?? undefined,
    raw: row,
  };
}

/**
 * Parse student basic details response.
 * Data is an array but always contains a single element.
 */
export function parseStudentProfileData(
  response: NcuApiResponse,
): StudentProfile {
  const rows = parseDataField<NcuStudentDetailRow>(response);

  if (rows.length === 0) {
    throw new NcuApiError("No student profile data returned", 404);
  }

  const row = rows[0]!;
  return {
    rollNo: row.RollNo ?? "",
    studentName: row.StudentName?.trim() ?? "",
    semester: row.SemesterNo ?? 0,
    programmeName: row.ProgrammeName ?? "",
    degreeLevel: row.DegreeLevel ?? "",
    fatherName: row.FatherName?.trim() ?? undefined,
    mobileNo: row.PersonalMobileNo ?? undefined,
    section: row.SectionName ?? undefined,
    studentImage: row.StudentImage ?? undefined,
    raw: row,
  };
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Parse NCU's CourseDetails format into code and name.
 *
 * Formats seen:
 * - `"CSC301 -SEMINAR"` (space before dash, no space after)
 * - `"CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT"` (space on both sides)
 * - `"CLV210 - SOFT SKILLS - A CAREER CATALYST (VA-II)"` (multiple dashes in name)
 *
 * Strategy: split on the FIRST ` -` or ` - `, code is before, name is after.
 */
export function parseCourseDetails(details?: string): {
  code: string;
  name: string;
} {
  if (!details) {
    return { code: "UNKNOWN", name: "Unknown Course" };
  }

  // Match: <code> followed by ` -` or ` - ` then <name>
  const match = details.match(/^(\S+)\s+-\s*(.*)/);
  if (match) {
    return {
      code: match[1]!.trim(),
      name: match[2]!.trim(),
    };
  }

  // Fallback: return whole string as name
  return { code: "UNKNOWN", name: details.trim() };
}

/**
 * Parse NCU ISO date string to "YYYY-MM-DD".
 * Input: `"2026-02-24T00:00:00"` → `"2026-02-24"`
 */
export function parseNcuDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;

  // Handle ISO format "YYYY-MM-DDTHH:mm:ss"
  const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  return undefined;
}

/**
 * Format NCU time string to "HH:mm".
 * Input: `"08:30:00"` → `"08:30"`
 * Input: `"14:20:00"` → `"14:20"`
 */
export function formatTimeHHmm(time?: string): string {
  if (!time) return "";

  const match = time.match(/^(\d{2}:\d{2})/);
  return match ? match[1]! : time;
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class NcuApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "NcuApiError";
  }
}
