import { describe, it, expect } from 'vitest';
import { base32Encode, base32Decode, totpAt, verifyTotp } from '../src/lib/totp.js';
import { encrypt, decrypt } from '../src/lib/crypto.js';

describe('TOTP (RFC 6238)', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  it('matches the RFC 6238 SHA-1 test vectors', () => {
    expect(totpAt(secret, 59_000, 8)).toBe('94287082');
    expect(totpAt(secret, 1111111109_000, 8)).toBe('07081804');
    expect(totpAt(secret, 1234567890_000, 8)).toBe('89005924');
  });
  it('round-trips base32', () => { expect(base32Decode(base32Encode(Buffer.from('hello world'))).toString()).toBe('hello world'); });
  it('accepts one step of clock drift and nothing wider', () => {
    const t = 1_700_000_000_000;
    const code = totpAt(secret, t);
    expect(verifyTotp(secret, code, t)).toBe(true);
    expect(verifyTotp(secret, code, t + 30_000)).toBe(true);
    expect(verifyTotp(secret, code, t + 90_000)).toBe(false);
    expect(verifyTotp(secret, 'abcdef', t)).toBe(false);
  });
});

describe('secret encryption', () => {
  it('round-trips and detects tampering or a wrong key', () => {
    const blob = encrypt('app-secret-1', 'JBSWY3DPEHPK3PXP');
    expect(decrypt('app-secret-1', blob)).toBe('JBSWY3DPEHPK3PXP');
    expect(() => decrypt('another-secret', blob)).toThrow();
    expect(() => decrypt('app-secret-1', blob.slice(0, -2) + 'AA')).toThrow();
    expect(blob).not.toContain('JBSWY3DPEHPK3PXP');
  });
});
