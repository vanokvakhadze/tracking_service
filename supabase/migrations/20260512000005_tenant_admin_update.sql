-- Migration: tenant admins can update their own tenant's settings.
-- Backs the /settings page (name, timezone, default_language, etc.).

drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships m
      where m.user_id   = auth.uid()
        and m.tenant_id = tenants.id
        and m.is_active = true
        and m.role in ('tenant_admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.tenant_memberships m
      where m.user_id   = auth.uid()
        and m.tenant_id = tenants.id
        and m.is_active = true
        and m.role in ('tenant_admin', 'super_admin')
    )
  );
