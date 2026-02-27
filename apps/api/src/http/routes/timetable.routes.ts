import {
  getCommonBreaksUseCase,
  getTimetableUseCase,
  getTodayScheduleUseCase,
} from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { rateLimiter } from "@/http/middleware/rate-limit";
import { compareRequestSchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * Timetable routes — all require authentication.
 *
 * GET  /         — full weekly timetable
 * GET  /today    — today's schedule only
 * POST /compare  — compare with a friend's timetable (common breaks)
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
  })
  .post(
    "/compare",
    rateLimiter({ max: 5, windowSeconds: 60, prefix: "rl:compare" }),
    async (c) => {
      const userId = c.get("userId");
      const body = compareRequestSchema.parse(await c.req.json());
      const result = await getCommonBreaksUseCase.execute(userId, body);
      return c.json({ data: result });
    },
  );
