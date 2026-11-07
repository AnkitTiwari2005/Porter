import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, ApiError, newIdempotencyKey } from './api';

const reply = (status, body, ct = 'application/json') => ({ ok: status < 400, status, headers: { get: () => ct }, json: async () => body });
afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends cookies, JSON bodies and custom headers', async () => {
    const f = vi.fn().mockResolvedValue(reply(200, { ok: true }));
    vi.stubGlobal('fetch', f);
    await api.post('/orders', { a: 1 }, { headers: { 'Idempotency-Key': 'k' } });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/orders');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"a":1}' });
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'Idempotency-Key': 'k' });
  });
  it('turns API errors into ApiError with code, message and details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(409, { error: { code: 'price_changed', message: 'Fare changed', details: { total: 500 } } })));
    const e = await api.post('/orders', {}).catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 409, code: 'price_changed', message: 'Fare changed', details: { total: 500 } });
  });
  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const e = await api.get('/catalog').catch((x) => x);
    expect(e).toMatchObject({ status: 0, code: 'network' });
    expect(e.message).toMatch(/connection/i);
  });
  it('survives non-JSON error pages (e.g. a proxy 502)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(502, null, 'text/html')));
    const e = await api.get('/catalog').catch((x) => x);
    expect(e).toMatchObject({ status: 502, code: 'error' });
  });
  it('generates distinct idempotency keys', () => { expect(newIdempotencyKey()).not.toBe(newIdempotencyKey()); });
});
