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
 * Factory to create college link routes.
 *
 * Accepts an optional `enqueueSyncJob` so the POST handler can trigger
 * an initial sync immediately after linking. When not provided (e.g., in
 * tests), linking still works but no sync is enqueued.
 *
 * GET    /             — list user's linked colleges
 * POST   /             — link a new college account (+ enqueue initial sync)
 * DELETE /:id          — unlink a college account
 * POST   /:id/sync     — trigger manual sync (wired in index.ts after BullMQ init)
 */
export function createCollegeLinkRoutes(
  enqueueSyncJob?: (collegeLinkId: string) => Promise<void>,
) {
  return new Hono<{ Variables: AuthVariables }>()
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

      // Trigger initial sync immediately so the user doesn't stay on "pending"
      if (enqueueSyncJob) {
        await enqueueSyncJob(link.id).catch((err) => {
          console.error(
            `[CollegeLinkRoutes] Failed to enqueue initial sync for ${link.id}:`,
            err,
          );
          // Non-fatal — the link was still created successfully.
          // The cron scheduler will pick it up later.
        });
      }

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
}

/**
 * @deprecated Use createCollegeLinkRoutes() instead.
 * Kept for backward compat during migration — creates routes without initial sync.
 */
export const collegeLinkRoutes = createCollegeLinkRoutes();
