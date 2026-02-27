import { getTimetableUseCase, getTodayScheduleUseCase } from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { Hono } from "hono";

/**
 * Timetable routes — all require authentication.
 *
 * GET /        — full weekly timetable
 * GET /today   — today's schedule only
 */
export const timetableRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const entries = await getTimetableUseCase.execute(userId);
    return c.json({
      data: entries.map((e) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        lectureDate: e.lectureDate,
        startTime: e.startTime,
        endTime: e.endTime,
        courseCode: e.courseCode,
        courseName: e.courseName,
        facultyName: e.facultyName,
        room: e.room,
        section: e.section,
      })),
    });
  })
  .get("/today", async (c) => {
    const userId = c.get("userId");
    const entries = await getTodayScheduleUseCase.execute(userId);
    return c.json({
      data: entries.map((e) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        lectureDate: e.lectureDate,
        startTime: e.startTime,
        endTime: e.endTime,
        courseCode: e.courseCode,
        courseName: e.courseName,
        facultyName: e.facultyName,
        room: e.room,
        section: e.section,
      })),
    });
  });
