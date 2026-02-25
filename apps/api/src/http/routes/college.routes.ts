import { listCollegesUseCase } from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { Hono } from "hono";

/**
 * College routes — public endpoint for listing supported colleges.
 *
 * GET /colleges — list all active colleges
 */
export const collegeRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/",
  async (c) => {
    const colleges = await listCollegesUseCase.execute();
    return c.json({
      data: colleges.map((col) => ({
        id: col.id,
        slug: col.slug,
        name: col.name,
        attendanceThreshold: col.attendanceThreshold,
        isActive: col.isActive,
      })),
    });
  },
);
