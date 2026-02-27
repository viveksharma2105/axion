import { getStudentProfileUseCase } from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { Hono } from "hono";

/**
 * Profile routes — all require authentication.
 *
 * GET / — get the student profile for the current user
 */
export const profileRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const profile = await getStudentProfileUseCase.execute(userId);

    if (!profile) {
      return c.json({ data: { profile: null } });
    }

    return c.json({
      data: {
        profile: {
          rollNo: profile.rollNo,
          studentName: profile.studentName,
          semester: profile.semester,
          programmeName: profile.programmeName,
          degreeLevel: profile.degreeLevel,
          fatherName: profile.fatherName,
          mobileNo: profile.mobileNo,
          section: profile.section,
          studentImage: profile.studentImage,
        },
      },
    });
  });
