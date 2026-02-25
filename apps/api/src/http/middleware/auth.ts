import { UnauthorizedError } from "@/domain/errors";
import { auth } from "@/infrastructure/auth/auth";
import { createMiddleware } from "hono/factory";

/**
 * Hono context variables set by the auth middleware.
 */
export type AuthVariables = {
  userId: string;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

/**
 * Auth middleware — validates the session via Better Auth and injects
 * `userId` + `session` into the Hono context variables.
 *
 * Apply this to all routes that require authentication.
 */
export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.session || !session?.user) {
    throw new UnauthorizedError();
  }

  c.set("userId", session.user.id);
  c.set("session", {
    id: session.session.id,
    userId: session.user.id,
    expiresAt: session.session.expiresAt,
  });

  await next();
});
