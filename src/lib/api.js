// Thin fetch wrapper for the Portex API. Cookies carry the session (httpOnly), so no token ever touches JS.
const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body, { headers, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.');
  }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code || 'error', e?.message || 'Something went wrong. Please try again.', e?.details);
  }
  return data;
}

export const api = {
  get: (p, opts) => request('GET', p, undefined, opts),
  post: (p, b = {}, opts) => request('POST', p, b, opts),
  put: (p, b, opts) => request('PUT', p, b, opts),
  patch: (p, b, opts) => request('PATCH', p, b, opts),
  url: (p) => `${BASE}${p}`
};

export const newIdempotencyKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
