import { HttpError } from './errors.js';

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Validates req[part] with a zod schema and replaces it with the parsed (stripped, coerced) value.
export const validate = (schema, part = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[part]);
  if (!r.success) {
    const details = r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, 'invalid_request', details[0] ? `${details[0].path || 'request'}: ${details[0].message}` : 'Invalid request', details));
  }
  req[part] = r.data;
  next();
};
