// express-rate-limit store backed by Postgres, so limits are shared by every API instance.
export class PgRateStore {
  constructor({ db, prefix, clock = { now: () => new Date() } }) {
    this.db = db;
    this.prefix = prefix;
    this.clock = clock;
    this.localKeys = true;
  }
  init(options) { this.windowMs = options.windowMs; }
  key(k) { return `${this.prefix}:${k}`; }
  async increment(key) {
    const now = this.clock.now();
    const resetAt = new Date(now.getTime() + this.windowMs);
    const r = await this.db.query(
      `INSERT INTO rate_limits (key, hits, reset_at) VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE WHEN rate_limits.reset_at <= $3 THEN 1 ELSE rate_limits.hits + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= $3 THEN $2 ELSE rate_limits.reset_at END
       RETURNING hits, reset_at`, [this.key(key), resetAt, now]);
    return { totalHits: r.rows[0].hits, resetTime: new Date(r.rows[0].reset_at) };
  }
  async decrement(key) { await this.db.query('UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE key = $1', [this.key(key)]); }
  async resetKey(key) { await this.db.query('DELETE FROM rate_limits WHERE key = $1', [this.key(key)]); }
}
