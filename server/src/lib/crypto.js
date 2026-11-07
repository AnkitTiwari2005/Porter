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

// AES-256-GCM for secrets stored in the database (e.g. TOTP seeds). Key is derived from APP_SECRET.
const keyFrom = (secret) => crypto.createHash('sha256').update(`enc:${secret}`).digest();
export function encrypt(secret, plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `v1.${iv.toString('base64url')}.${c.getAuthTag().toString('base64url')}.${enc.toString('base64url')}`;
}
export function decrypt(secret, blob) {
  const [v, iv, tag, enc] = String(blob).split('.');
  if (v !== 'v1') throw new Error('unsupported ciphertext');
  const d = crypto.createDecipheriv('aes-256-gcm', keyFrom(secret), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(enc, 'base64url')), d.final()]).toString('utf8');
}
