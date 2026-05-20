-- Allow tenant admins to annotate shifts in their tenant.
drop policy if exists shifts_admin_update_notes on public.shifts;
create policy shifts_admin_update_notes on public.shifts
  for update
  to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

-- Column-level scope: only notes + updated_at are write-allowed by admins.
revoke update on public.shifts from authenticated;
grant update (notes, updated_at) on public.shifts to authenticated;
