# task.040 — Alerts inbox (mobile admin)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036
**Commit:** `feat(mobile): add alerts inbox`

---

## Read first
- `tasks/00_HANDOFF.md`
- `tasks/reference/tracking_saas_schema.sql` § geofence_events + location_pings + device_status_logs
- Mockup: `tasks/reference/designs/09_admin_alerts.png`

## Goal
Replace the `admin-alerts.tsx` placeholder with an inbox surfacing tenant-wide alert-worthy events. There is no dedicated `alerts` table — derive alerts from existing event tables in a single Edge Function or RPC:

| Severity | Source                                            | Description                       |
|----------|---------------------------------------------------|-----------------------------------|
| Critical | `location_pings` where `is_mock = true`           | Mock GPS detected                 |
| Critical | `device_status_logs` where `is_location_enabled = false` | Location disabled while on shift |
| Warning  | `device_status_logs` where `battery_percent < 15` | Low battery                       |
| Warning  | `geofence_events` exit + no return within 1h while on shift | Out of zone                |

## Files to add

### Migration `supabase/migrations/<YYYYMMDD>_admin_alerts_rpc.sql`
A SECURITY DEFINER RPC `get_admin_alerts(p_tenant_id uuid, p_since timestamptz)` that returns a unified shape:

```sql
create or replace function public.get_admin_alerts(
  p_tenant_id uuid,
  p_since     timestamptz default now() - interval '7 days'
)
returns table (
  id          text,
  severity    text,  -- 'critical' | 'warning'
  kind        text,  -- 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
  user_id     uuid,
  user_name   text,
  occurred_at timestamptz,
  details     jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  -- Mock GPS pings
  select
    ('ping:' || p.id)::text,
    'critical'::text,
    'mock_gps'::text,
    p.user_id,
    coalesce(u.first_name || ' ' || u.last_name, u.email),
    p.recorded_at,
    jsonb_build_object('accuracy_m', p.accuracy_m) as details
  from public.location_pings p
  join public.users u on u.id = p.user_id
  where p.tenant_id = p_tenant_id
    and p.is_mock = true
    and p.recorded_at >= p_since
  -- Low battery (last 7d)
  union all
  select
    ('battery:' || d.id)::text,
    'warning'::text,
    'low_battery'::text,
    d.user_id,
    coalesce(u.first_name || ' ' || u.last_name, u.email),
    d.reported_at,
    jsonb_build_object('battery_percent', d.battery_percent)
  from public.device_status_logs d
  join public.users u on u.id = d.user_id
  where d.tenant_id = p_tenant_id
    and d.battery_percent < 15
    and d.reported_at >= p_since
  -- Location disabled during shift
  union all
  select
    ('loc_off:' || d.id)::text,
    'critical'::text,
    'location_disabled'::text,
    d.user_id,
    coalesce(u.first_name || ' ' || u.last_name, u.email),
    d.reported_at,
    jsonb_build_object('has_permission', d.has_location_permission)
  from public.device_status_logs d
  join public.users u on u.id = d.user_id
  where d.tenant_id = p_tenant_id
    and d.is_location_enabled = false
    and d.reported_at >= p_since
  order by 6 desc -- occurred_at desc
  limit 200;
end;
$$;

grant execute on function public.get_admin_alerts(uuid, timestamptz) to authenticated;
```

Apply via Supabase SQL editor; run `pnpm db:types` afterwards.

### `apps/mobile/src/services/alerts.ts`
```ts
export type AlertSeverity = 'critical' | 'warning'
export interface AdminAlert {
  id: string
  severity: AlertSeverity
  kind: 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
  user_id: string
  user_name: string
  occurred_at: string
  details: Record<string, unknown> | null
}

export async function fetchAdminAlerts(): Promise<AdminAlert[]>
```

Uses `supabase.rpc('get_admin_alerts', { p_tenant_id })` resolving the tenant id from `getCurrentUser()`.

## Files to modify

### `apps/mobile/app/(tabs)/admin-alerts.tsx`
- SafeAreaView + ScrollView with RefreshControl
- Critical alerts first (red bg), warnings below (amber bg)
- Each card: severity badge + kind label (translated to Georgian) + user name + relative time + quick "swipe to dismiss" (use `react-native-gesture-handler` or just an "x" button for v1)
- Empty state: "ალერტი არ არის"

Tab badge update: the existing `(tabs)/_layout.tsx` shows no badge yet on `admin-alerts`. Add an unread count to the tab bar — derive it from the same alerts query (e.g., critical count). Acceptable to leave the badge static `null` until a follow-up; the must-have is the inbox screen.

Georgian kind labels:
- `mock_gps` → "ყალბი GPS"
- `location_disabled` → "ლოკაცია გათიშულია"
- `low_battery` → "დაბალი ბატარეა"
- `out_of_zone` → "ზონის გარეთ"

## Acceptance criteria
- [ ] Migration applied + `get_admin_alerts` typed in `@trackpro/database`
- [ ] When `location_pings.is_mock` is inserted in Studio, the alert appears at top after refresh
- [ ] Critical alerts render with red bg, warnings with amber bg
- [ ] Empty state surfaces when no alerts in the last 7 days
- [ ] typecheck + format:check pass

## Commit
```powershell
git add supabase/migrations apps/mobile/src/services/alerts.ts apps/mobile/app/\(tabs\)/admin-alerts.tsx packages/database/src/types.ts
git commit -m "feat(mobile): add alerts inbox"
```

## DO NOT
- ❌ Create a dedicated `alerts` table — the RPC unifies existing event sources
- ❌ Compute "out_of_zone" client-side; it's a richer derivation (geofence ENTRY then no return → query in the RPC if time allows, otherwise drop from v1)
- ❌ Auto-dismiss after read — keep alerts visible until explicitly dismissed (dismissal persistence is a follow-up)
