/**
 * Base class for all domain errors.
 *
 * Domain errors represent business-rule violations or expected failure
 * conditions. They carry a machine-readable `code` and a human-readable
 * `message`. The HTTP layer maps these to appropriate status codes.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ─── Authentication / Authorization ──────────────────────────────────────────

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "Authentication required") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";

  constructor(message = "You do not have permission to access this resource") {
    super(message);
  }
}

// ─── Not Found ───────────────────────────────────────────────────────────────

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";

  constructor(resource: string, id?: string) {
    const msg = id
      ? `${resource} with id "${id}" not found`
      : `${resource} not found`;
    super(msg);
  }
}

export class CollegeNotFoundError extends DomainError {
  readonly code = "COLLEGE_NOT_FOUND";

  constructor(identifier: string) {
    super(`College "${identifier}" not found or not active`);
  }
}

export class CollegeLinkNotFoundError extends DomainError {
  readonly code = "COLLEGE_LINK_NOT_FOUND";

  constructor(id?: string) {
    const msg = id
      ? `College link "${id}" not found`
      : "No active college link found for this user";
    super(msg);
  }
}

// ─── College Integration ─────────────────────────────────────────────────────

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";

  constructor(collegeName?: string) {
    const msg = collegeName
      ? `Invalid credentials for ${collegeName}`
      : "Invalid college portal credentials";
    super(msg);
  }
}

export class CollegeApiError extends DomainError {
  readonly code = "COLLEGE_API_ERROR";

  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
  }
}

export class CollegeLinkAlreadyExistsError extends DomainError {
  readonly code = "COLLEGE_LINK_ALREADY_EXISTS";

  constructor() {
    super("You already have a linked account for this college");
  }
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export class SyncFailedError extends DomainError {
  readonly code = "SYNC_FAILED";
}

export class SyncInProgressError extends DomainError {
  readonly code = "SYNC_IN_PROGRESS";

  constructor() {
    super("A sync is already in progress for this college link");
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}
