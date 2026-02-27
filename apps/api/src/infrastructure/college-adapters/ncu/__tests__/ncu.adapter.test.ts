import { describe, expect, it } from "vitest";
import {
  NcuApiError,
  extractJwtExpiry,
  formatTimeHHmm,
  isJwtExpired,
  parseAttendanceData,
  parseCourseDetails,
  parseCoursesData,
  parseDateSheetData,
  parseLoginResponse,
  parseNcuDate,
  parseResultSummaryData,
  parseScheduleData,
  parseStudentProfileData,
} from "../ncu.adapter";

import attendanceResponse from "./fixtures/attendance-response.json";
import coursesResponse from "./fixtures/courses-response.json";
import datesheetResponse from "./fixtures/datesheet-response.json";
import loginFailedResponse from "./fixtures/login-failed-response.json";
import loginResponse from "./fixtures/login-response.json";
import resultSummaryResponse from "./fixtures/result-summary-response.json";
import scheduleResponse from "./fixtures/schedule-response.json";
import studentDetailsResponse from "./fixtures/student-details-response.json";

// ─── Login Parsing ───────────────────────────────────────────────────────────

describe("parseLoginResponse", () => {
  it("parses successful login with token and User.UserId", () => {
    const result = parseLoginResponse(loginResponse);

    expect(result.token).toBeTruthy();
    expect(result.token).toContain("eyJ");
    expect(result.collegeUserId).toBe(
      "UbJNwqAjguPyZVN3hR2IYcu5y9K5GpJNP_-ZJudZ8Z0=",
    );
    expect(result.displayName).toBe("23CSU343");
    expect(result.rawResponse).toEqual(loginResponse);
    // Token expiry should be extracted from the JWT's exp claim
    expect(result.expiresAt).toBeInstanceOf(Date);
    // Fixture JWT has exp=1770003600 → Date minus 60s buffer
    expect(result.expiresAt!.getTime()).toBe((1770003600 - 60) * 1000);
  });

  it("throws on failed login (Succeeded: false)", () => {
    expect(() => parseLoginResponse(loginFailedResponse)).toThrow(NcuApiError);
    expect(() => parseLoginResponse(loginFailedResponse)).toThrow(
      "Invalid Username and Password",
    );
  });

  it("throws on response with no token and no User", () => {
    expect(() => parseLoginResponse({} as never)).toThrow(NcuApiError);
  });

  it("throws on response with Succeeded false even if token present", () => {
    expect(() =>
      parseLoginResponse({
        token: "some-token",
        Succeeded: false,
        Message: "Account locked",
      } as never),
    ).toThrow("Account locked");
  });
});

// ─── Attendance Parsing ──────────────────────────────────────────────────────

describe("parseAttendanceData", () => {
  it("parses real stringified attendance data correctly", () => {
    const records = parseAttendanceData(attendanceResponse);

    expect(records).toHaveLength(6);

    // First record: CLV210
    expect(records[0]).toEqual({
      courseCode: "CLV210",
      courseName: "SOFT SKILLS - A CAREER CATALYST (VA-II)",
      totalLectures: 4,
      totalPresent: 4,
      totalAbsent: 0,
      totalLOA: 0,
      totalOnDuty: 0,
      percentage: 100.0,
      raw: expect.objectContaining({ CourseCode: "CLV210" }),
    });

    // Check DEVOPS course
    const devops = records.find((r) => r.courseCode === "CSL373");
    expect(devops).toBeDefined();
    expect(devops!.percentage).toBe(84.85);
    expect(devops!.totalPresent).toBe(28);
    expect(devops!.totalAbsent).toBe(5);
    expect(devops!.totalLectures).toBe(33);

    // Check low-attendance course (MME001)
    const mme = records.find((r) => r.courseCode === "MME001");
    expect(mme).toBeDefined();
    expect(mme!.percentage).toBe(66.67);
  });

  it("returns empty array when Data is null", () => {
    const records = parseAttendanceData({
      Data: null,
      StatusCode: 200,
      Message: "",
      Succeeded: true,
    });
    expect(records).toEqual([]);
  });

  it("returns empty array when Data is undefined", () => {
    const records = parseAttendanceData({
      StatusCode: 200,
      Message: "No data",
      Succeeded: true,
    });
    expect(records).toEqual([]);
  });

  it("throws NcuApiError on invalid JSON string in Data", () => {
    expect(() =>
      parseAttendanceData({
        Data: "not-valid-json{{{",
        StatusCode: 200,
        Succeeded: true,
      }),
    ).toThrow(NcuApiError);
  });

  it("provides defaults for missing fields", () => {
    const records = parseAttendanceData({
      Data: '[{"CourseCode":"MIN100"}]',
      StatusCode: 200,
      Succeeded: true,
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      courseCode: "MIN100",
      courseName: "Unknown Course",
      totalLectures: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLOA: 0,
      totalOnDuty: 0,
      percentage: 0,
    });
  });
});

// ─── Schedule Parsing ────────────────────────────────────────────────────────

describe("parseScheduleData", () => {
  it("parses real schedule data with Table/Table1 structure", () => {
    const entries = parseScheduleData(scheduleResponse);

    expect(entries).toHaveLength(5);

    // First entry: CSC301 on 2026-02-24 (Tuesday)
    expect(entries[0]).toEqual({
      date: "2026-02-24",
      dayOfWeek: 2, // Tuesday
      startTime: "08:30",
      endTime: "10:20",
      courseCode: "CSC301",
      courseName: "SEMINAR",
      facultyName: "Nishu",
      room: "RN 237",
      raw: expect.objectContaining({ CourseDetails: "CSC301 -SEMINAR" }),
    });

    // Third entry: CSL373 DEVOPS
    expect(entries[2]!.courseCode).toBe("CSL373");
    expect(entries[2]!.courseName).toBe("DEVOPS");
    expect(entries[2]!.startTime).toBe("12:30");
    expect(entries[2]!.endTime).toBe("14:20");
    expect(entries[2]!.room).toBe("RN 302");

    // Fifth entry: next day (Wednesday)
    expect(entries[4]!.date).toBe("2026-02-25");
    expect(entries[4]!.dayOfWeek).toBe(3); // Wednesday
    expect(entries[4]!.courseCode).toBe("CSL229");
    expect(entries[4]!.courseName).toBe(
      "SOFTWARE ENGINEERING & PROJECT MANAGEMENT",
    );
  });

  it("returns empty array when Data is null", () => {
    const entries = parseScheduleData({
      Data: null,
      StatusCode: 200,
      Succeeded: true,
    });
    expect(entries).toEqual([]);
  });

  it("returns empty array when Table1 is missing", () => {
    const entries = parseScheduleData({
      Data: '{"Table":[]}',
      StatusCode: 200,
      Succeeded: true,
    });
    expect(entries).toEqual([]);
  });

  it("throws on invalid JSON in Data", () => {
    expect(() =>
      parseScheduleData({
        Data: "not-json",
        StatusCode: 200,
        Succeeded: true,
      }),
    ).toThrow(NcuApiError);
  });
});

// ─── Courses Parsing ─────────────────────────────────────────────────────────

describe("parseCoursesData", () => {
  it("parses real courses data correctly", () => {
    const courses = parseCoursesData(coursesResponse);

    expect(courses).toHaveLength(5);

    // First course: CSL229
    expect(courses[0]).toEqual({
      courseCode: "CSL229",
      courseName: "SOFTWARE ENGINEERING & PROJECT MANAGEMENT",
      credits: 4.0,
      courseNature: "CORE",
      courseDeliveryMode: "LECTURE COURSE",
      electiveType: undefined,
      ltp: "3-0-2",
      semester: 6,
      rollNo: "23CSU343",
      raw: expect.objectContaining({
        CourseDetails: "CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT",
      }),
    });

    // PE course: CSL373 DEVOPS
    const devops = courses.find((c) => c.courseCode === "CSL373");
    expect(devops).toBeDefined();
    expect(devops!.courseNature).toBe("PE");
    expect(devops!.electiveType).toBe("PE-6");
    expect(devops!.credits).toBe(4.0);
    expect(devops!.ltp).toBe("2-0-4");

    // Skill development: CLV210
    const softSkills = courses.find((c) => c.courseCode === "CLV210");
    expect(softSkills).toBeDefined();
    expect(softSkills!.courseNature).toBe("SKILL DEVELOPMENT ELECTIVE");
    expect(softSkills!.credits).toBe(0.0);
    expect(softSkills!.electiveType).toBe("SDE-1");
  });

  it("returns empty array when Data is null", () => {
    const courses = parseCoursesData({
      Data: null,
      StatusCode: 200,
      Succeeded: true,
    });
    expect(courses).toEqual([]);
  });
});

// ─── Result Summary Parsing ──────────────────────────────────────────────────

describe("parseResultSummaryData", () => {
  it("parses semester list correctly", () => {
    const marks = parseResultSummaryData(resultSummaryResponse);

    expect(marks).toHaveLength(3);

    expect(marks[0]).toEqual({
      courseCode: "",
      courseName: "",
      examType: "semester",
      semester: 3,
      sessionName: "Jul-Dec - 2024",
      raw: expect.objectContaining({ Session: 19 }),
    });

    expect(marks[1]!.semester).toBe(4);
    expect(marks[1]!.sessionName).toBe("Jan-Jun - 2025");

    expect(marks[2]!.semester).toBe(5);
    expect(marks[2]!.sessionName).toBe("Jul-Dec - 2025");
  });

  it("returns empty array when Data is null", () => {
    const marks = parseResultSummaryData({
      Data: null,
      StatusCode: 200,
      Succeeded: true,
    });
    expect(marks).toEqual([]);
  });
});

// ─── Date Sheet Parsing ──────────────────────────────────────────────────────

describe("parseDateSheetData", () => {
  it("parses date sheet entries correctly", () => {
    const entries = parseDateSheetData(datesheetResponse);

    expect(entries).toHaveLength(3);

    expect(entries[0]).toEqual({
      courseCode: "CSL236",
      courseName: "INTRODUCTION TO AI & ML",
      examDate: "2025-12-04",
      examDateFormatted: "04-Dec-2025",
      startTime: "01:30 AM",
      endTime: "04:30 AM",
      room: undefined,
      slotNo: 2,
      seatNo: undefined,
      raw: expect.objectContaining({ CourseCode: "CSL236" }),
    });

    // Last entry: CSL209 with different slot
    expect(entries[2]!.courseCode).toBe("CSL209");
    expect(entries[2]!.slotNo).toBe(1);
    expect(entries[2]!.startTime).toBe("09:30 AM");
    expect(entries[2]!.examDate).toBe("2025-12-15");
  });

  it("returns empty array when Data is null", () => {
    const entries = parseDateSheetData({
      Data: null,
      StatusCode: 200,
      Succeeded: true,
    });
    expect(entries).toEqual([]);
  });
});

// ─── Student Profile Parsing ─────────────────────────────────────────────────

describe("parseStudentProfileData", () => {
  it("parses student details correctly", () => {
    const profile = parseStudentProfileData(studentDetailsResponse);

    expect(profile).toEqual({
      rollNo: "23CSU343",
      studentName: "VIVEK KUMAR",
      semester: 6,
      programmeName:
        "BACHELOR OF TECHNOLOGY (COMPUTER SCIENCE AND ENGINEERING)",
      degreeLevel: "UG",
      fatherName: "RAJESH",
      mobileNo: "9876543210",
      section: "Section - FA",
      studentImage: undefined,
      raw: expect.objectContaining({ RollNo: "23CSU343" }),
    });
  });

  it("throws when Data is empty array", () => {
    expect(() =>
      parseStudentProfileData({
        Data: "[]",
        StatusCode: 200,
        Succeeded: true,
      }),
    ).toThrow(NcuApiError);
    expect(() =>
      parseStudentProfileData({
        Data: "[]",
        StatusCode: 200,
        Succeeded: true,
      }),
    ).toThrow("No student profile data returned");
  });

  it("throws when Data is null", () => {
    expect(() =>
      parseStudentProfileData({
        Data: null,
        StatusCode: 200,
        Succeeded: true,
      }),
    ).toThrow(NcuApiError);
  });
});

// ─── Utility Functions ───────────────────────────────────────────────────────

describe("parseCourseDetails", () => {
  it('parses "CSC301 -SEMINAR" (space before dash, no space after)', () => {
    const result = parseCourseDetails("CSC301 -SEMINAR");
    expect(result).toEqual({ code: "CSC301", name: "SEMINAR" });
  });

  it('parses "CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT" (spaces around dash)', () => {
    const result = parseCourseDetails(
      "CSL229 - SOFTWARE ENGINEERING & PROJECT MANAGEMENT",
    );
    expect(result).toEqual({
      code: "CSL229",
      name: "SOFTWARE ENGINEERING & PROJECT MANAGEMENT",
    });
  });

  it('parses "CLV210 - SOFT SKILLS - A CAREER CATALYST (VA-II)" (multiple dashes)', () => {
    const result = parseCourseDetails(
      "CLV210 - SOFT SKILLS - A CAREER CATALYST (VA-II)",
    );
    expect(result).toEqual({
      code: "CLV210",
      name: "SOFT SKILLS - A CAREER CATALYST (VA-II)",
    });
  });

  it("returns defaults for undefined input", () => {
    expect(parseCourseDetails(undefined)).toEqual({
      code: "UNKNOWN",
      name: "Unknown Course",
    });
  });

  it("returns defaults for empty string", () => {
    expect(parseCourseDetails("")).toEqual({
      code: "UNKNOWN",
      name: "Unknown Course",
    });
  });

  it("handles unparseable format as fallback", () => {
    expect(parseCourseDetails("JUST A NAME")).toEqual({
      code: "UNKNOWN",
      name: "JUST A NAME",
    });
  });
});

describe("parseNcuDate", () => {
  it('parses ISO format "2026-02-24T00:00:00" to "2026-02-24"', () => {
    expect(parseNcuDate("2026-02-24T00:00:00")).toBe("2026-02-24");
  });

  it('parses "2025-12-04T00:00:00" to "2025-12-04"', () => {
    expect(parseNcuDate("2025-12-04T00:00:00")).toBe("2025-12-04");
  });

  it("returns undefined for undefined input", () => {
    expect(parseNcuDate(undefined)).toBeUndefined();
  });

  it("returns undefined for non-ISO format", () => {
    expect(parseNcuDate("24-Feb-2026")).toBeUndefined();
  });
});

describe("formatTimeHHmm", () => {
  it('formats "08:30:00" to "08:30"', () => {
    expect(formatTimeHHmm("08:30:00")).toBe("08:30");
  });

  it('formats "14:20:00" to "14:20"', () => {
    expect(formatTimeHHmm("14:20:00")).toBe("14:20");
  });

  it("returns empty string for undefined", () => {
    expect(formatTimeHHmm(undefined)).toBe("");
  });

  it("returns original string if no match", () => {
    expect(formatTimeHHmm("8:30 AM")).toBe("8:30 AM");
  });
});

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

describe("extractJwtExpiry", () => {
  it("extracts expiry from a valid JWT with exp claim", () => {
    // Fixture token has exp=1770003600
    const expiry = extractJwtExpiry(loginResponse.token);
    expect(expiry).toBeInstanceOf(Date);
    // 60-second buffer subtracted
    expect(expiry!.getTime()).toBe((1770003600 - 60) * 1000);
  });

  it("returns undefined for a token without exp claim", () => {
    // JWT with payload {"sub":"test"} (no exp)
    const noExpToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake-sig";
    expect(extractJwtExpiry(noExpToken)).toBeUndefined();
  });

  it("returns undefined for malformed token (not 3 parts)", () => {
    expect(extractJwtExpiry("not-a-jwt")).toBeUndefined();
    expect(extractJwtExpiry("only.two")).toBeUndefined();
    expect(extractJwtExpiry("")).toBeUndefined();
  });

  it("returns undefined for token with invalid base64 payload", () => {
    expect(extractJwtExpiry("a.!!!invalid!!!.c")).toBeUndefined();
  });
});

describe("isJwtExpired", () => {
  it("returns true for an expired token", () => {
    // Fixture token exp=1770003600 which is in the past (2026-02-02)
    expect(isJwtExpired(loginResponse.token)).toBe(true);
  });

  it("returns true for malformed tokens", () => {
    expect(isJwtExpired("not-a-jwt")).toBe(true);
    expect(isJwtExpired("")).toBe(true);
  });

  it("returns false for a token with far-future exp", () => {
    // Create a JWT payload with exp far in the future (year 2099)
    const futureExp = Math.floor(new Date("2099-01-01").getTime() / 1000);
    const payload = btoa(JSON.stringify({ exp: futureExp }));
    const futureToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.fake-sig`;
    expect(isJwtExpired(futureToken)).toBe(false);
  });
});

// ─── NcuApiError ─────────────────────────────────────────────────────────────

describe("NcuApiError", () => {
  it("has correct name, message, and statusCode", () => {
    const error = new NcuApiError("test error", 404);
    expect(error.name).toBe("NcuApiError");
    expect(error.message).toBe("test error");
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(Error);
  });
});
