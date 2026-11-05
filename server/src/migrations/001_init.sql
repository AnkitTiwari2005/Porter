CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         text NOT NULL UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),
  name          text,
  role          text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','driver','admin')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_challenges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  consumed    boolean NOT NULL DEFAULT false,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_phone_created_idx ON otp_challenges (phone, created_at DESC);

CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  user_agent   text,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE vehicles (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  category      text NOT NULL CHECK (category IN ('bike','truck')),
  base_price    integer NOT NULL CHECK (base_price >= 0),
  base_km       double precision NOT NULL CHECK (base_km >= 0),
  rate_per_km   double precision NOT NULL CHECK (rate_per_km >= 0),
  eta_minutes   integer NOT NULL DEFAULT 20,
  active        boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promo_codes (
  code               text PRIMARY KEY CHECK (code = upper(code)),
  description        text NOT NULL DEFAULT '',
  discount_percent   integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_discount       integer NOT NULL CHECK (max_discount >= 0),
  min_fare           integer NOT NULL DEFAULT 0,
  categories         text[],
  max_uses_per_user  integer,
  max_total_uses     integer,
  starts_at          timestamptz,
  ends_at            timestamptz,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE drivers (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city_id       text NOT NULL,
  vehicle_id    text NOT NULL REFERENCES vehicles(id),
  vehicle_no    text NOT NULL,
  status        text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','suspended')),
  online        boolean NOT NULL DEFAULT false,
  lat           double precision,
  lng           double precision,
  location_at   timestamptz,
  rating        double precision NOT NULL DEFAULT 5,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX drivers_dispatch_idx ON drivers (city_id, vehicle_id) WHERE online AND status = 'approved';

CREATE TABLE orders (
  id               text PRIMARY KEY,
  track_token      text NOT NULL UNIQUE,
  customer_id      uuid NOT NULL REFERENCES users(id),
  driver_id        uuid REFERENCES drivers(user_id),
  service_type     text NOT NULL CHECK (service_type IN ('city','packers','parcel')),
  city_id          text NOT NULL,
  vehicle_id       text REFERENCES vehicles(id),
  vehicle_name     text NOT NULL,
  pickup_address   text NOT NULL,
  pickup_lat       double precision,
  pickup_lng       double precision,
  drop_address     text NOT NULL,
  drop_lat         double precision,
  drop_lng         double precision,
  distance_km      double precision,
  route_polyline   jsonb,
  pricing          jsonb NOT NULL,
  total            integer NOT NULL CHECK (total >= 0),
  promo_code       text,
  status           text NOT NULL CHECK (status IN ('pending_payment','scheduled','confirmed','searching','assigned','in_transit','delivered','cancelled')),
  payment_method   text NOT NULL CHECK (payment_method IN ('online','cod')),
  payment_status   text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','cod_due','cod_collected','refund_pending','refunded')),
  sender_name      text NOT NULL,
  sender_phone     text NOT NULL,
  receiver_name    text NOT NULL,
  receiver_phone   text NOT NULL,
  goods_type       text,
  notes            text,
  scheduled_for    timestamptz,
  delivery_otp     text NOT NULL,
  otp_attempts     integer NOT NULL DEFAULT 0,
  idempotency_key  text,
  cancel_reason    text,
  cancelled_by     text,
  cancel_fee       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  assigned_at      timestamptz,
  picked_up_at     timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  UNIQUE (customer_id, idempotency_key)
);
CREATE INDEX orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX orders_driver_idx ON orders (driver_id, status);
CREATE INDEX orders_status_idx ON orders (status, created_at);

CREATE TABLE order_events (
  id          serial PRIMARY KEY,
  order_id    text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type        text NOT NULL,
  actor_id    uuid,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id, id);

CREATE TABLE order_offers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id   uuid NOT NULL REFERENCES drivers(user_id),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired','cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  UNIQUE (order_id, driver_id)
);
CREATE INDEX offers_driver_idx ON order_offers (driver_id, status);

CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              text NOT NULL REFERENCES orders(id),
  provider              text NOT NULL,
  provider_order_id     text NOT NULL UNIQUE,
  provider_payment_id   text UNIQUE,
  amount_paise          integer NOT NULL CHECK (amount_paise > 0),
  status                text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','refunded')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments (order_id);

CREATE TABLE refunds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          uuid NOT NULL REFERENCES payments(id),
  provider_refund_id  text UNIQUE,
  amount_paise        integer NOT NULL,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  reason              text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
  id           text PRIMARY KEY,
  received_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promo_redemptions (
  id          serial PRIMARY KEY,
  code        text NOT NULL REFERENCES promo_codes(code),
  user_id     uuid NOT NULL REFERENCES users(id),
  order_id    text NOT NULL UNIQUE REFERENCES orders(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX redemptions_user_idx ON promo_redemptions (user_id, code);

CREATE TABLE driver_earnings (
  order_id    text PRIMARY KEY REFERENCES orders(id),
  driver_id   uuid NOT NULL REFERENCES drivers(user_id),
  amount      integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice_counters (fy text PRIMARY KEY, last_seq integer NOT NULL);
CREATE TABLE invoices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   text NOT NULL UNIQUE REFERENCES orders(id),
  number     text NOT NULL UNIQUE,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  data       jsonb NOT NULL
);

CREATE TABLE leads (
  id          serial PRIMARY KEY,
  company     text NOT NULL,
  contact     text NOT NULL,
  phone       text NOT NULL,
  email       text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','won','lost')),
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id          serial PRIMARY KEY,
  phone       text NOT NULL,
  template    text NOT NULL,
  body        text NOT NULL,
  status      text NOT NULL CHECK (status IN ('sent','failed')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          serial PRIMARY KEY,
  actor_id    uuid,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
