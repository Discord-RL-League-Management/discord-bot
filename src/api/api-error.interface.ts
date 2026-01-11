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
    // Capture stack trace at error construction site (Node.js/V8 only; ignored on other engines)
    Error.captureStackTrace(this, this.constructor);
  }
}
