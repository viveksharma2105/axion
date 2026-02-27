import { getMarksSummaryUseCase, getMarksUseCase } from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { toISOString } from "@/http/utils";
import { marksQuerySchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * Marks routes — all require authentication.
 *
 * GET /         — all marks/grades (filterable by semester, examType)
 * GET /summary  — latest SGPA/CGPA summary
 */
export const marksRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const query = marksQuerySchema.parse(c.req.query());

    const records = await getMarksUseCase.execute(userId, {
      semester: query.semester,
      examType: query.examType,
    });

    return c.json({
      data: records.map((m) => ({
        id: m.id,
        courseCode: m.courseCode,
        courseName: m.courseName,
        examType: m.examType,
        maxMarks: m.maxMarks,
        obtainedMarks: m.obtainedMarks,
        grade: m.grade,
        sgpa: m.sgpa,
        cgpa: m.cgpa,
        semester: m.semester,
        syncedAt: toISOString(m.syncedAt),
      })),
    });
  })
  .get("/summary", async (c) => {
    const userId = c.get("userId");
    const summary = await getMarksSummaryUseCase.execute(userId);
    return c.json({ data: summary });
  });
