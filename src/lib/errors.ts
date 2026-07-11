export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403)
    this.name = "ForbiddenError"
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, "CONFLICT", 409)
    this.name = "ConflictError"
  }
}

export class UploadError extends AppError {
  constructor(message = "Upload failed") {
    super(message, "UPLOAD_ERROR", 400)
    this.name = "UploadError"
  }
}
