import {
  getAttendanceHistoryUseCase,
  getAttendanceProjectionUseCase,
  getAttendanceUseCase,
} from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { toISOString } from "@/http/utils";
import { attendanceHistoryQuerySchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * Attendance routes — all require authentication.
 *
 * GET /             — latest attendance summary
 * GET /history      — historical attendance data for charts
 * GET /projection   — attendance projections (classes needed/can skip)
 */
export const attendanceRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const records = await getAttendanceUseCase.execute(userId);
    return c.json({
      data: records.map((r) => ({
        id: r.id,
        courseCode: r.courseCode,
        courseName: r.courseName,
        totalLectures: r.totalLectures,
        totalPresent: r.totalPresent,
        totalAbsent: r.totalAbsent,
        totalLoa: r.totalLoa,
        totalOnDuty: r.totalOnDuty,
        percentage: r.percentage,
        syncedAt: toISOString(r.syncedAt),
      })),
    });
  })
  .get("/history", async (c) => {
    const userId = c.get("userId");
    const query = attendanceHistoryQuerySchema.parse(c.req.query());

    const records = await getAttendanceHistoryUseCase.execute(userId, {
      courseCode: query.courseCode,
      limit: query.limit,
    });

    return c.json({
      data: records.map((r) => ({
        id: r.id,
        courseCode: r.courseCode,
        courseName: r.courseName,
        totalLectures: r.totalLectures,
        totalPresent: r.totalPresent,
        totalAbsent: r.totalAbsent,
        totalLoa: r.totalLoa,
        totalOnDuty: r.totalOnDuty,
        percentage: r.percentage,
        syncedAt: toISOString(r.syncedAt),
      })),
    });
  })
  .get("/projection", async (c) => {
    const userId = c.get("userId");
    const projections = await getAttendanceProjectionUseCase.execute(userId);
    return c.json({ data: projections });
  });
