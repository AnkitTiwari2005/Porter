-- Leader election so only one instance runs background jobs, and a shared rate-limit store for multi-instance deployments.
CREATE TABLE job_lease (name text PRIMARY KEY, holder text NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE rate_limits (key text PRIMARY KEY, hits integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE INDEX rate_limits_reset_idx ON rate_limits (reset_at);

-- Ratings and multi-stop trips
ALTER TABLE orders
  ADD COLUMN driver_stars smallint CHECK (driver_stars BETWEEN 1 AND 5),
  ADD COLUMN rating_comment text,
  ADD COLUMN rated_at timestamptz,
  ADD COLUMN stop_address text,
  ADD COLUMN stop_lat double precision,
  ADD COLUMN stop_lng double precision;

-- Driver verification (document numbers and expiry dates; admins verify before a driver can go online)
ALTER TABLE drivers
  ADD COLUMN rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN license_no text,
  ADD COLUMN license_expiry date,
  ADD COLUMN rc_expiry date,
  ADD COLUMN insurance_expiry date,
  ADD COLUMN verified_at timestamptz,
  ADD COLUMN verified_by uuid;
-- Drivers created before this migration keep working: they count as verified.
UPDATE drivers SET verified_at = now() WHERE status = 'approved';

-- Admin two-factor (TOTP). The secret is stored encrypted.
ALTER TABLE users ADD COLUMN totp_secret text, ADD COLUMN totp_enabled boolean NOT NULL DEFAULT false, ADD COLUMN totp_last_step integer;
ALTER TABLE sessions ADD COLUMN mfa_ok boolean NOT NULL DEFAULT true, ADD COLUMN mfa_attempts integer NOT NULL DEFAULT 0;
