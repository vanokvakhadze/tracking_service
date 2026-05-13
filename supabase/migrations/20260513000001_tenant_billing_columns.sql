-- Migration: add Stripe billing columns to tenants
--
-- The reference schema already has `stripe_customer_id` (text, nullable) and
-- a `tenant_status` enum, but Phase 5 needs richer state to mirror Stripe's
-- subscription lifecycle independently of our internal tenant_status.

alter table public.tenants
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status     text default 'trialing'
    check (subscription_status in (
      'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
    )),
  add column if not exists subscription_quantity   integer default 1,
  add column if not exists current_period_end      timestamptz,
  add column if not exists plan_code                text;

create index if not exists idx_tenants_stripe_customer
  on public.tenants(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_tenants_subscription_status
  on public.tenants(subscription_status);

-- The Stripe webhook (Edge Function) updates these columns using the
-- service-role key — RLS is bypassed there. Admins on the dashboard read
-- these via the existing tenants_read_member policy; no new READ policy
-- needed. UPDATE policy for these specific columns is intentionally NOT
-- added — only the webhook should mutate billing state, never the client.
