import { getCoursesUseCase } from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { Hono } from "hono";

/**
 * Courses routes — all require authentication.
 *
 * GET / — list registered courses for the current semester
 */
export const coursesRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const courses = await getCoursesUseCase.execute(userId);
    return c.json({
      data: courses.map((course) => ({
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        facultyName: course.facultyName,
        section: course.section,
        semester: course.semester,
        syncedAt: course.syncedAt.toISOString(),
      })),
    });
  });
