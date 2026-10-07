-- Premium pack ("Kakebo Master System", kakebo-master-system-pack): guest purchases via Stripe.
-- Fully separate from profiles, subscriptions, access_grants and Plus. No FK to auth.users.
-- All four tables are server-only: RLS enabled with NO policies (deny-all for anon/authenticated);
-- only the service role (which bypasses RLS) can read/write, and only from server routes.

-- 1. Purchases. One row per paid Checkout Session.
create table if not exists public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null check (pack_id = 'kakebo-master-system-pack'),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text unique,
  customer_email text,
  amount_total integer not null check (amount_total > 0),
  currency text not null,
  livemode boolean not null,
  status text not null default 'paid' check (status in ('paid', 'refunded', 'disputed')),
  paid_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Access tokens (guest credential, permanent until revoked). Only the SHA-256 hash is stored.
create table if not exists public.premium_access_tokens (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.premium_purchases(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists premium_access_tokens_purchase_idx
  on public.premium_access_tokens (purchase_id);

-- 3. Webhook idempotency ledger: one row per processed Stripe event id.
create table if not exists public.premium_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- 4. Download log: one row per delivered file.
create table if not exists public.premium_downloads (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.premium_purchases(id) on delete cascade,
  file_id text not null check (file_id in ('excel', 'tutorial', 'ebook')),
  created_at timestamptz not null default now()
);
create index if not exists premium_downloads_purchase_idx
  on public.premium_downloads (purchase_id, created_at desc);

alter table public.premium_purchases enable row level security;
alter table public.premium_access_tokens enable row level security;
alter table public.premium_webhook_events enable row level security;
alter table public.premium_downloads enable row level security;

revoke all on public.premium_purchases from anon, authenticated;
revoke all on public.premium_access_tokens from anon, authenticated;
revoke all on public.premium_webhook_events from anon, authenticated;
revoke all on public.premium_downloads from anon, authenticated;
