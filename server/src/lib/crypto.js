import crypto from 'node:crypto';

export const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
export const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const randomDigits = (n) => String(crypto.randomInt(0, 10 ** n)).padStart(n, '0');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function newOrderId() {
  return `PTX-${crypto.randomInt(10000, 100000)}${crypto.randomInt(0, 36 ** 2).toString(36).toUpperCase().padStart(2, '0')}`;
}
