import type {
  AttendanceRecord,
  CollegeAdapter,
  CollegeAuthResult,
  CollegeCredentials,
  CourseRecord,
  MarkRecord,
  TimetableEntry,
} from "@/application/ports/college-adapter.port";

const NCU_CONFIG = {
  baseUrl: "https://uatapi.ncuindia.edu/api",
  loginPath: "/Authentication/ValidateUser",
  attendancePath: "/myapp/Registration/GetAttendanceSummary",
  origin: "https://mycampus.ncuindia.edu",
  referer: "https://mycampus.ncuindia.edu/",
} as const;

/**
 * NCU India (The NorthCap University) adapter.
 *
 * Implements the CollegeAdapter interface using the reverse-engineered
 * MyCampus API at mycampus.ncuindia.edu.
 */
export class NcuAdapter implements CollegeAdapter {
  readonly adapterId = "ncu-india";
  readonly collegeName = "The NorthCap University";
  readonly attendanceThreshold = 75;

  async login(credentials: CollegeCredentials): Promise<CollegeAuthResult> {
    const response = await fetch(
      `${NCU_CONFIG.baseUrl}${NCU_CONFIG.loginPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        `Login failed with status ${response.status}`,
        response.status,
      );
    }

    const data = (await response.json()) as NcuLoginResponse;

    if (!data.Token && !data.token) {
      // Check if there's an error message in the response
      const message =
        data.Message ||
        data.message ||
        "Invalid credentials or unexpected response";
      throw new NcuApiError(message, 401);
    }

    const token = data.Token || data.token || "";
    const collegeUserId =
      data.EncodedId || data.encodedId || data.UserId || data.userId;

    return {
      token,
      collegeUserId: collegeUserId ? String(collegeUserId) : undefined,
      rawResponse: data,
    };
  }

  async getAttendance(auth: CollegeAuthResult): Promise<AttendanceRecord[]> {
    const response = await fetch(
      `${NCU_CONFIG.baseUrl}${NCU_CONFIG.attendancePath}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Origin: NCU_CONFIG.origin,
          Referer: NCU_CONFIG.referer,
        },
      },
    );

    if (!response.ok) {
      throw new NcuApiError(
        `Failed to fetch attendance: ${response.status}`,
        response.status,
      );
    }

    const json = (await response.json()) as NcuApiResponse;
    const records = parseAttendanceData(json);
    return records;
  }

  async getTimetable(_auth: CollegeAuthResult): Promise<TimetableEntry[]> {
    // TODO: Discover timetable endpoint from NCU network tab
    throw new NcuApiError("Timetable endpoint not yet implemented", 501);
  }

  async getMarks(_auth: CollegeAuthResult): Promise<MarkRecord[]> {
    // TODO: Discover marks endpoint from NCU network tab
    throw new NcuApiError("Marks endpoint not yet implemented", 501);
  }

  async getCourses(_auth: CollegeAuthResult): Promise<CourseRecord[]> {
    // TODO: Discover courses endpoint from NCU network tab
    throw new NcuApiError("Courses endpoint not yet implemented", 501);
  }
}

// ─── NCU Response Types (internal) ───────────────────────────────────────────

interface NcuLoginResponse {
  Token?: string;
  token?: string;
  EncodedId?: string;
  encodedId?: string;
  UserId?: string | number;
  userId?: string | number;
  Message?: string;
  message?: string;
  [key: string]: unknown;
}

interface NcuApiResponse {
  Data?: string | NcuAttendanceRow[];
  data?: string | NcuAttendanceRow[];
  Message?: string;
  message?: string;
  [key: string]: unknown;
}

interface NcuAttendanceRow {
  CourseName?: string;
  courseName?: string;
  CourseCode?: string;
  courseCode?: string;
  TotalLectures?: number;
  totalLectures?: number;
  TotalPresent?: number;
  totalPresent?: number;
  TotalAbsent?: number;
  totalAbsent?: number;
  LOA?: number;
  loa?: number;
  OnDuty?: number;
  onDuty?: number;
  Percentage?: number;
  percentage?: number;
  [key: string]: unknown;
}

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

/**
 * Parse the attendance response from NCU.
 * The `Data` field can be either a JSON array or a stringified JSON array.
 */
export function parseAttendanceData(
  response: NcuApiResponse,
): AttendanceRecord[] {
  let rows: NcuAttendanceRow[];
  const rawData = response.Data ?? response.data;

  if (!rawData) {
    return [];
  }

  if (typeof rawData === "string") {
    try {
      rows = JSON.parse(rawData) as NcuAttendanceRow[];
    } catch {
      throw new NcuApiError("Failed to parse attendance data as JSON", 500);
    }
  } else if (Array.isArray(rawData)) {
    rows = rawData;
  } else {
    return [];
  }

  return rows.map(mapAttendanceRow);
}

function mapAttendanceRow(row: NcuAttendanceRow): AttendanceRecord {
  return {
    courseCode: row.CourseCode ?? row.courseCode ?? "UNKNOWN",
    courseName: row.CourseName ?? row.courseName ?? "Unknown Course",
    totalLectures: row.TotalLectures ?? row.totalLectures ?? 0,
    totalPresent: row.TotalPresent ?? row.totalPresent ?? 0,
    totalAbsent: row.TotalAbsent ?? row.totalAbsent ?? 0,
    totalLOA: row.LOA ?? row.loa ?? 0,
    totalOnDuty: row.OnDuty ?? row.onDuty ?? 0,
    percentage: row.Percentage ?? row.percentage ?? 0,
    raw: row,
  };
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
