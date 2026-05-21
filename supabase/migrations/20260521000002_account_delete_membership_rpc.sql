-- Migration: self-serve account deletion helper
--
-- A user can soft-delete their own profile from /settings. The public app uses
-- the anon Supabase client, so direct updates to tenant_memberships would hit
-- RLS edge cases when the update itself removes the user's admin role. Keep the
-- mutation narrow and scoped to auth.uid().

create or replace function public.soft_delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  update public.tenant_memberships
  set
    is_active = false,
    updated_at = now()
  where user_id = v_user_id
    and is_active = true;

  update public.users
  set
    deleted_at = now(),
    updated_at = now(),
    email = 'deleted-' || v_user_id::text || '@trackpro.deleted'
  where id = v_user_id;
end;
$$;

revoke all on function public.soft_delete_own_account() from public;
grant execute on function public.soft_delete_own_account() to authenticated;
