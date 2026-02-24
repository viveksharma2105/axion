import { describe, expect, it } from "vitest";
import { NcuApiError, parseAttendanceData } from "../ncu.adapter";

import attendanceResponse from "./fixtures/attendance-response.json";
import attendanceStringified from "./fixtures/attendance-stringified-response.json";
import loginFailedResponse from "./fixtures/login-failed-response.json";
import loginResponse from "./fixtures/login-response.json";

describe("NcuAdapter", () => {
  describe("parseAttendanceData", () => {
    it("parses attendance array data correctly", () => {
      const records = parseAttendanceData(attendanceResponse);

      expect(records).toHaveLength(4);

      // First record
      expect(records[0]).toEqual({
        courseCode: "CSE101",
        courseName: "Introduction to Computer Science",
        totalLectures: 40,
        totalPresent: 35,
        totalAbsent: 3,
        totalLOA: 1,
        totalOnDuty: 1,
        percentage: 87.5,
        raw: attendanceResponse.Data[0],
      });

      // Check the low-attendance course
      const physics = records.find((r) => r.courseCode === "PHY102");
      expect(physics).toBeDefined();
      expect(physics!.percentage).toBe(66.67);
      expect(physics!.totalAbsent).toBe(8);
    });

    it("parses stringified Data field", () => {
      const records = parseAttendanceData(attendanceStringified);

      expect(records).toHaveLength(1);
      expect(records[0]!.courseCode).toBe("CSE101");
      expect(records[0]!.percentage).toBe(87.5);
    });

    it("returns empty array when Data is missing", () => {
      const records = parseAttendanceData({
        Message: "No data",
        Status: true,
      });
      expect(records).toEqual([]);
    });

    it("throws on invalid stringified JSON", () => {
      expect(() =>
        parseAttendanceData({
          Data: "not-valid-json{{{",
        }),
      ).toThrow(NcuApiError);
    });

    it("handles case-insensitive field names", () => {
      const records = parseAttendanceData({
        data: [
          {
            courseCode: "TEST100",
            courseName: "Test Course",
            totalLectures: 10,
            totalPresent: 8,
            totalAbsent: 2,
            loa: 0,
            onDuty: 0,
            percentage: 80,
          },
        ],
      });

      expect(records).toHaveLength(1);
      expect(records[0]!.courseCode).toBe("TEST100");
      expect(records[0]!.totalPresent).toBe(8);
    });

    it("provides defaults for missing fields", () => {
      const records = parseAttendanceData({
        Data: [{ CourseCode: "MIN100" }],
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

  describe("login response fixtures", () => {
    it("successful login has token and encoded ID", () => {
      expect(loginResponse.Token).toBeTruthy();
      expect(loginResponse.EncodedId).toBe("MTIzNDU2");
      expect(loginResponse.Status).toBe(true);
    });

    it("failed login has no token", () => {
      expect(loginFailedResponse.Token).toBeNull();
      expect(loginFailedResponse.Status).toBe(false);
      expect(loginFailedResponse.Message).toBe("Invalid User Name or Password");
    });
  });
});
