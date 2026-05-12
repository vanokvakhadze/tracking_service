-- Migration: create_tenant_with_admin function for company signup flow
--
-- Creates tenant + user profile + tenant_admin membership in one transaction.
-- Caller passes the auth.users.id from supabase.auth.signUp() result;
-- public.users.id is intentionally set to the same UUID so RLS policies
-- that compare against auth.uid() match.
--
-- Adapted from tasks/02_PHASE_AUTH.md Task 1.3 to fit the real schema:
--   * tenant role lives on tenant_memberships, not on users
--   * subscription plan lookup uses `code` column (not `slug`) on
--     `subscription_plans` (not `plans`)

create or replace function public.create_tenant_with_admin(
  p_user_id     uuid,
  p_email       text,
  p_first_name  text,
  p_last_name   text,
  p_company_name text,
  p_subdomain   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_plan_id   uuid;
begin
  -- Validate subdomain format (lowercase alphanumeric + dash, 3-30 chars)
  if p_subdomain !~ '^[a-z0-9-]{3,30}$' then
    raise exception 'Invalid subdomain format' using errcode = '22023';
  end if;

  -- Pick the Basic plan as the default for new tenants on trial
  select id into v_plan_id
  from public.subscription_plans
  where code = 'basic'
  limit 1;

  if v_plan_id is null then
    raise exception 'Basic plan seed missing — run schema seed';
  end if;

  -- Create tenant
  insert into public.tenants (name, subdomain, plan_id, status, trial_ends_at)
  values (
    p_company_name,
    p_subdomain,
    v_plan_id,
    'trial',
    now() + interval '14 days'
  )
  returning id into v_tenant_id;

  -- Create user profile keyed by auth.users.id
  insert into public.users (id, email, first_name, last_name, email_verified_at)
  values (p_user_id, p_email, p_first_name, p_last_name, now())
  on conflict (id) do update
    set email      = excluded.email,
        first_name = excluded.first_name,
        last_name  = excluded.last_name;

  -- Grant tenant_admin membership
  insert into public.tenant_memberships (tenant_id, user_id, role, is_active)
  values (v_tenant_id, p_user_id, 'tenant_admin', true);

  return v_tenant_id;
end;
$$;

-- Allow authenticated callers to invoke the function via supabase.rpc(...)
revoke all on function public.create_tenant_with_admin(uuid, text, text, text, text, text) from public;
grant execute on function public.create_tenant_with_admin(uuid, text, text, text, text, text) to authenticated;
