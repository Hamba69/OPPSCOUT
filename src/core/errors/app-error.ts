export class AppError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  public constructor(resource: string) {
    super(`${resource} was not found.`, 404, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = "You do not have access to this resource.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  public constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}
