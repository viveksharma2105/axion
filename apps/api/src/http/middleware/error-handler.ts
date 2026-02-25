import {
  CollegeApiError,
  CollegeLinkAlreadyExistsError,
  CollegeLinkNotFoundError,
  CollegeNotFoundError,
  DomainError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
  SyncFailedError,
  SyncInProgressError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/errors";
import type { Context } from "hono";
import { ZodError } from "zod";

/**
 * Map domain error classes to HTTP status codes.
 */
function getStatusCode(error: DomainError): number {
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof CollegeNotFoundError) return 404;
  if (error instanceof CollegeLinkNotFoundError) return 404;
  if (error instanceof InvalidCredentialsError) return 401;
  if (error instanceof CollegeLinkAlreadyExistsError) return 409;
  if (error instanceof SyncInProgressError) return 409;
  if (error instanceof SyncFailedError) return 502;
  if (error instanceof CollegeApiError) return 502;
  if (error instanceof ValidationError) return 422;
  return 500;
}

/**
 * Global error handler for Hono.
 * Maps DomainError subclasses and ZodErrors to structured JSON responses.
 */
export function errorHandler(err: Error, c: Context): Response {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "_root";
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details,
        },
      },
      422,
    );
  }

  // Domain errors
  if (err instanceof DomainError) {
    const status = getStatusCode(err);
    const body: {
      error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
      };
    } = {
      error: { code: err.code, message: err.message },
    };

    if (err instanceof ValidationError && err.details) {
      body.error.details = err.details;
    }

    return c.json(body, status as 400);
  }

  // Unexpected errors — log but don't leak details
  console.error("[Unhandled Error]", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}
