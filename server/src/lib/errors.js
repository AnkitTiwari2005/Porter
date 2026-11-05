export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const badRequest = (code, msg, details) => new HttpError(400, code, msg, details);
export const unauthorized = (msg = 'Please log in to continue.') => new HttpError(401, 'unauthorized', msg);
export const forbidden = (msg = 'You do not have access to this.') => new HttpError(403, 'forbidden', msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, 'not_found', msg);
export const conflict = (code, msg, details) => new HttpError(409, code, msg, details);
export const tooMany = (msg = 'Too many requests. Please try again shortly.') => new HttpError(429, 'rate_limited', msg);
