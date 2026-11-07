import { hmac, sha256, randomToken, randomDigits, safeEqual, encrypt, decrypt } from '../lib/crypto.js';
import { newSecret, matchTotpStep, otpauthUrl } from '../lib/totp.js';
import { badRequest, forbidden, tooMany, conflict, HttpError } from '../lib/errors.js';

const OTP_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const PHONE_LIMIT = { count: 3, windowMs: 10 * 60_000 };
const IP_LIMIT = { count: 20, windowMs: 60 * 60_000 };
const SESSION_TTL_MS = { customer: 30 * 86_400_000, driver: 30 * 86_400_000, admin: 8 * 3_600_000 };

export const PHONE_RE = /^[6-9][0-9]{9}$/;

export function createAuth({ db, config, sms, clock, log = console }) {
  const codeHash = (phone, code) => hmac(config.APP_SECRET, `otp:${phone}:${code}`);
  const tokenHash = (token) => hmac(config.APP_SECRET, `session:${token}`);

  async function requestOtp({ phone, ip }) {
    if (!PHONE_RE.test(phone)) throw badRequest('invalid_phone', 'Enter a valid 10-digit Indian mobile number.');
    const now = clock.now();

    const byPhone = await db.query('SELECT count(*)::int AS n FROM otp_challenges WHERE phone = $1 AND created_at > $2', [phone, new Date(now - PHONE_LIMIT.windowMs)]);
    if (byPhone.rows[0].n >= PHONE_LIMIT.count) throw tooMany('Too many codes requested for this number. Try again in a few minutes.');
    if (ip) {
      const byIp = await db.query('SELECT count(*)::int AS n FROM otp_challenges WHERE ip = $1 AND created_at > $2', [ip, new Date(now - IP_LIMIT.windowMs)]);
      if (byIp.rows[0].n >= IP_LIMIT.count) throw tooMany();
    }

    const code = randomDigits(6);
    await db.query(
      'INSERT INTO otp_challenges (phone, code_hash, expires_at, ip, created_at) VALUES ($1,$2,$3,$4,$5)',
      [phone, codeHash(phone, code), new Date(now.getTime() + OTP_TTL_MS), ip || null, now]
    );
    try {
      await sms.send(phone, `${code} is your ${config.BRAND_NAME} login code. It is valid for 5 minutes. Do not share it with anyone.`);
    } catch (e) {
      // Do not leave a usable challenge behind for a code the user never received.
      await db.query('UPDATE otp_challenges SET consumed = true WHERE phone = $1 AND code_hash = $2', [phone, codeHash(phone, code)]);
      log.error?.({ err: String(e.message).slice(0, 200) }, 'OTP SMS failed');
      throw new HttpError(502, 'sms_unavailable', 'We could not send the code right now. Please try again in a minute.');
    }

    const out = { expiresInSeconds: OTP_TTL_MS / 1000 };
    if (config.OTP_DEV_ECHO && !config.isProd) out.devOtp = code;
    return out;
  }

  async function verifyOtp({ phone, code, name, ip, userAgent }) {
    if (!PHONE_RE.test(phone)) throw badRequest('invalid_phone', 'Enter a valid 10-digit Indian mobile number.');
    const now = clock.now();

    const ch = (await db.query(
      `SELECT id, code_hash, attempts FROM otp_challenges
       WHERE phone = $1 AND consumed = false AND expires_at > $2
       ORDER BY created_at DESC LIMIT 1`, [phone, now])).rows[0];
    if (!ch) throw badRequest('otp_expired', 'That code has expired. Please request a new one.');

    // Count the attempt first (atomically) so parallel guesses cannot exceed the cap.
    const upd = await db.query('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = $1 AND attempts < $2 RETURNING attempts', [ch.id, MAX_ATTEMPTS]);
    if (!upd.rowCount) throw tooMany('Too many wrong attempts. Please request a new code.');

    if (!safeEqual(codeHash(phone, String(code)), ch.code_hash)) {
      throw badRequest('invalid_otp', 'That code is incorrect.');
    }
    const used = await db.query('UPDATE otp_challenges SET consumed = true WHERE id = $1 AND consumed = false', [ch.id]);
    if (!used.rowCount) throw badRequest('otp_expired', 'That code has already been used.');

    const cleanName = name ? String(name).trim().slice(0, 80) : null;
    const user = (await db.query(
      `INSERT INTO users (phone, name) VALUES ($1, $2)
       ON CONFLICT (phone) DO UPDATE SET name = COALESCE(users.name, EXCLUDED.name), updated_at = $3
       RETURNING id, phone, name, role, status, totp_enabled`, [phone, cleanName, now])).rows[0];
    if (user.status !== 'active') throw forbidden('This account is suspended. Contact support.');

    const token = randomToken(32);
    const ttl = SESSION_TTL_MS[user.role] || SESSION_TTL_MS.customer;
    const expiresAt = new Date(now.getTime() + ttl);
    // Admins must pass a second factor (authenticator app) before the session can do anything.
    const needsMfa = user.role === 'admin' && (user.totp_enabled || config.adminRequireTotp);
    await db.query('INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip, created_at, mfa_ok) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [user.id, tokenHash(token), expiresAt, (userAgent || '').slice(0, 200), ip || null, now, !needsMfa]);
    return { user: { ...user, mfa: needsMfa ? (user.totp_enabled ? 'verify' : 'setup') : null }, token, expiresAt };
  }

  async function authenticate(token) {
    if (!token) return null;
    const r = await db.query(
      `SELECT u.id, u.phone, u.name, u.role, u.status, u.totp_enabled, s.mfa_ok
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2`, [tokenHash(token), clock.now()]);
    const u = r.rows[0];
    if (!u || u.status !== 'active') return null;
    return { id: u.id, phone: u.phone, name: u.name, role: u.role, totpEnabled: !!u.totp_enabled, mfa: u.mfa_ok ? null : (u.totp_enabled ? 'verify' : 'setup') };
  }

  async function logout(token) {
    if (token) await db.query('UPDATE sessions SET revoked_at = $2 WHERE token_hash = $1 AND revoked_at IS NULL', [tokenHash(token), clock.now()]);
  }

  async function revokeAllForUser(userId) {
    await db.query('UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL', [userId, clock.now()]);
  }

  // ---- admin two-factor (TOTP)
  async function startTotpSetup(user, { reset = false } = {}) {
    const row = (await db.query('SELECT totp_enabled FROM users WHERE id = $1', [user.id])).rows[0];
    if (row.totp_enabled && !reset) throw conflict('already_enabled', 'Two-factor authentication is already enabled.');
    const secret = newSecret();
    await db.query('UPDATE users SET totp_secret = $2 WHERE id = $1', [user.id, encrypt(config.APP_SECRET, secret)]);
    return { secret, otpauthUrl: otpauthUrl(secret, user.phone, config.BRAND_NAME) };
  }

  // Shared by enable and verify: checks the code, blocks replays of the same 30 s step.
  async function checkTotp(userId, code) {
    const u = (await db.query('SELECT totp_secret, totp_last_step FROM users WHERE id = $1', [userId])).rows[0];
    if (!u?.totp_secret) throw badRequest('totp_not_set_up', 'Start two-factor setup first.');
    const step = matchTotpStep(decrypt(config.APP_SECRET, u.totp_secret), code, clock.now().getTime());
    if (step === null || (u.totp_last_step != null && step <= u.totp_last_step)) throw badRequest('invalid_totp', 'That code is incorrect or was already used.');
    await db.query('UPDATE users SET totp_last_step = $2 WHERE id = $1', [userId, step]);
  }

  async function enableTotp(token, user, code) {
    await checkTotp(user.id, code);
    await db.query('UPDATE users SET totp_enabled = true WHERE id = $1', [user.id]);
    await db.query('UPDATE sessions SET mfa_ok = true WHERE token_hash = $1', [tokenHash(token)]);
  }

  async function verifyTotpForSession(token, user, code) {
    // Count the attempt first; after 5 wrong codes the session is destroyed and the admin must log in again.
    const att = await db.query('UPDATE sessions SET mfa_attempts = mfa_attempts + 1 WHERE token_hash = $1 AND mfa_attempts < 5 RETURNING mfa_attempts', [tokenHash(token)]);
    if (!att.rowCount) { await logout(token); throw tooMany('Too many wrong codes. Please log in again.'); }
    await checkTotp(user.id, code);
    await db.query('UPDATE sessions SET mfa_ok = true, mfa_attempts = 0 WHERE token_hash = $1', [tokenHash(token)]);
  }

  async function disableTotp(token, user, code) {
    await checkTotp(user.id, code);
    await db.query('UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_last_step = NULL WHERE id = $1', [user.id]);
  }

  return { requestOtp, verifyOtp, authenticate, logout, revokeAllForUser, startTotpSetup, enableTotp, verifyTotpForSession, disableTotp, sha256 };
}
