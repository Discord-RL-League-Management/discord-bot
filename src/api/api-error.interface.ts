export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Maintains proper stack trace for where error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}
