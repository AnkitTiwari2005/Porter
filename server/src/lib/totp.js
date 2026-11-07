import crypto from 'node:crypto';

// RFC 6238 time-based one-time passwords (SHA-1, 30 s step, 6 digits), compatible with Google Authenticator, Authy, 1Password...
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
export function base32Decode(s) {
  let bits = '';
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error('invalid base32');
    bits += i.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export const newSecret = () => base32Encode(crypto.randomBytes(20));

export function hotp(secretBytes, counter, digits = 6) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', secretBytes).update(msg).digest();
  const o = h[h.length - 1] & 0x0f;
  const bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export const totpAt = (secretB32, timeMs, digits = 6) => hotp(base32Decode(secretB32), Math.floor(timeMs / 30000), digits);

// Returns the matched 30-second step (current or one either side, for clock drift) or null. Constant-time compare.
export function matchTotpStep(secretB32, code, timeMs = Date.now()) {
  if (!/^[0-9]{6}$/.test(String(code))) return null;
  const key = base32Decode(secretB32);
  const step = Math.floor(timeMs / 30000);
  let hit = null;
  for (const d of [-1, 0, 1]) {
    if (crypto.timingSafeEqual(Buffer.from(hotp(key, step + d)), Buffer.from(String(code)))) hit = step + d;
  }
  return hit;
}
export const verifyTotp = (secretB32, code, timeMs = Date.now()) => matchTotpStep(secretB32, code, timeMs) !== null;

export const otpauthUrl = (secretB32, account, issuer) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
