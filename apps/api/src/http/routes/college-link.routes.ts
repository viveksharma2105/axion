import {
  getCollegeLinksUseCase,
  linkCollegeUseCase,
  unlinkCollegeUseCase,
} from "@/http/container";
import type { AuthVariables } from "@/http/middleware/auth";
import { authMiddleware } from "@/http/middleware/auth";
import { linkCollegeSchema } from "@axion/shared";
import { Hono } from "hono";

/**
 * College link routes — all require authentication.
 *
 * GET    /             — list user's linked colleges
 * POST   /             — link a new college account
 * DELETE /:id          — unlink a college account
 * POST   /:id/sync     — trigger manual sync (wired in app.ts after BullMQ init)
 */
export const collegeLinkRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const links = await getCollegeLinksUseCase.execute(userId);
    return c.json({
      data: links.map((link) => ({
        id: link.id,
        collegeId: link.collegeId,
        collegeName: link.collegeName,
        collegeSlug: link.collegeSlug,
        lastSyncAt: link.lastSyncAt?.toISOString() ?? null,
        syncStatus: link.syncStatus,
        syncError: link.syncError,
        isActive: link.isActive,
        createdAt: link.createdAt.toISOString(),
      })),
    });
  })
  .post("/", async (c) => {
    const userId = c.get("userId");
    const body = await c.req.json();
    const input = linkCollegeSchema.parse(body);

    const link = await linkCollegeUseCase.execute({
      userId,
      collegeSlug: input.collegeSlug,
      username: input.username,
      password: input.password,
    });

    return c.json(
      {
        data: {
          id: link.id,
          collegeId: link.collegeId,
          syncStatus: link.syncStatus,
          createdAt: link.createdAt.toISOString(),
        },
      },
      201,
    );
  })
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const collegeLinkId = c.req.param("id");

    await unlinkCollegeUseCase.execute(collegeLinkId, userId);
    return c.json({ data: { success: true } });
  });
