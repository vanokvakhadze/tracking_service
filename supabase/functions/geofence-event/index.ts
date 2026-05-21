// Supabase Edge Function: geofence-event
//
// Receives raw ENTER/EXIT events from the mobile background tracker
// (Phase 3-Lite: expo-task-manager + expo-location). Runs the small bit of
// authority that the client cannot be trusted with:
//   - insert into public.geofence_events (audit trail)
//   - auto-open / auto-close the user's shift
//   - fan out a push notification via Expo Push API
//
// Required env vars:
//   - SUPABASE_URL (auto)
//   - SUPABASE_SERVICE_ROLE_KEY (auto)
//
// Deploy:
//   supabase functions deploy geofence-event
//
// Hysteresis note (v1):
//   We rely on the native OS geofencing to debounce: iOS region monitoring
//   already requires the device to remain inside/outside for ~30s before it
//   fires Enter/Exit, and Android proximity alerts behave similarly. So the
//   30s entry / 60s exit hysteresis from the design rules is approximated
//   by the platform — we do not run pg_cron jobs to gate it. If false
//   positives appear in beta, add a pending_geofence_events table + a 60s
//   delay before committing EXIT to ended_at.

import { createClient } from 'jsr:@supabase/supabase-js@2'

interface EventPayload {
  location_id: string
  event_type: 'enter' | 'exit'
  zone?: 'trigger' | 'boundary' // omitted → trigger (back-compat with v1 clients)
  latitude: number
  longitude: number
  accuracy_m: number | null
  occurred_at: string // ISO 8601
  is_mock?: boolean
  battery_percent?: number
  speed_mps?: number
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('[geofence-event] missing SUPABASE_URL or SERVICE_ROLE_KEY')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 1) Verify caller from the Authorization header. We trust the user JWT
  //    here because the Edge Function then writes via the service-role
  //    client (RLS-bypassing) — the JWT is *only* for identity.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userJwt = authHeader.slice('Bearer '.length)

  const supabaseAuth = createClient(SUPABASE_URL ?? '', SERVICE_ROLE ?? '', {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  })

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: EventPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  if (
    !payload?.location_id ||
    !payload?.event_type ||
    !['enter', 'exit'].includes(payload.event_type) ||
    typeof payload.latitude !== 'number' ||
    typeof payload.longitude !== 'number' ||
    !payload.occurred_at
  ) {
    return new Response('Invalid payload', { status: 400 })
  }

  // 2) Service-role client for the writes below.
  const supabase = createClient(SUPABASE_URL ?? '', SERVICE_ROLE ?? '')

  // 3) Resolve the location → its tenant. RLS is bypassed by the service
  //    role; we re-check membership manually below.
  const { data: location, error: locErr } = await supabase
    .from('locations')
    .select('id, tenant_id, name')
    .eq('id', payload.location_id)
    .single()
  if (locErr || !location) {
    return new Response('Location not found', { status: 404 })
  }

  // 4) Verify the user is an active member of that tenant.
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('id, is_active')
    .eq('user_id', user.id)
    .eq('tenant_id', location.tenant_id)
    .maybeSingle()
  if (!membership?.is_active) {
    return new Response('Forbidden', { status: 403 })
  }

  const wktPoint = `SRID=4326;POINT(${payload.longitude} ${payload.latitude})`
  const zone: 'trigger' | 'boundary' = payload.zone === 'boundary' ? 'boundary' : 'trigger'

  // 5) Insert the raw event. coords is a geography column; supabase-js types
  //    it as `unknown`, so we cast at the boundary.
  await supabase.from('geofence_events').insert({
    tenant_id: location.tenant_id,
    user_id: user.id,
    location_id: location.id,
    event_type: payload.event_type,
    zone,
    coords: wktPoint as unknown as never,
    accuracy_m: payload.accuracy_m ?? null,
    occurred_at: payload.occurred_at,
  })

  // 6) Drop a location_ping so the admin live-map updates.
  await supabase.from('location_pings').insert({
    tenant_id: location.tenant_id,
    user_id: user.id,
    coords: wktPoint as unknown as never,
    accuracy_m: payload.accuracy_m ?? null,
    is_mock: payload.is_mock ?? false,
    battery_percent: payload.battery_percent ?? null,
    speed_mps: payload.speed_mps ?? null,
    recorded_at: payload.occurred_at,
  })

  // 7) Mock-GPS guard. The client also gates, but the server has the last
  //    word — we do not open a shift from a spoofed ping.
  if (payload.is_mock) {
    await dispatchAlert(supabase, location.tenant_id, 'mock_gps', {
      title: 'Mock GPS გამოვლენილია',
      body: `${user.email ?? 'employee'} — ${location.name ?? 'unknown location'}`,
      data: { user_id: user.id, location_id: location.id, kind: 'mock_gps' },
    })
    return new Response(JSON.stringify({ ok: true, ignored: 'mock_gps' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 8) Boundary-zone events don't move shift state — they only notify.
  if (zone === 'boundary') {
    if (payload.event_type === 'enter') {
      await notifyUser(supabase, user.id, {
        title: 'ახლოს ხართ',
        body: location.name
          ? `${location.name} — სამუშაო ზონაში შემოხვედით`
          : 'სამუშაო ზონაში შემოხვედით',
        data: { kind: 'approaching', location_id: location.id },
      })
    } else {
      await dispatchAlert(supabase, location.tenant_id, 'out_of_zone', {
        title: 'სამუშაო ზონიდან გასვლა',
        body: `${user.email ?? 'employee'} — ${location.name ?? 'ლოკაცია'}`,
        data: { kind: 'out_of_zone', user_id: user.id, location_id: location.id },
      })
    }
    return new Response(JSON.stringify({ ok: true, zone }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 9) Trigger-zone events: drain any shifts whose 60-second exit timer
  //    has elapsed before we make new decisions. This is the "drain" step
  //    that lets the server commit closes without pg_cron.
  await supabase.rpc('finalize_pending_shifts')

  // 10) Auto-open / cancel-pending-close / start-pending-close.
  const EXIT_HYSTERESIS_MS = 60_000

  if (payload.event_type === 'enter') {
    const { data: openShift } = await supabase
      .from('shifts')
      .select('id, pending_close_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (openShift) {
      // Re-entry inside the 60s window — cancel the pending close.
      if (openShift.pending_close_at) {
        await supabase.from('shifts').update({ pending_close_at: null }).eq('id', openShift.id)
      }
    } else {
      const { data: newShift } = await supabase
        .from('shifts')
        .insert({
          tenant_id: location.tenant_id,
          user_id: user.id,
          started_at: payload.occurred_at,
          status: 'active',
          start_location: wktPoint as unknown as never,
        })
        .select('id')
        .single()

      if (newShift) {
        await notifyUser(supabase, user.id, {
          title: 'ცვლა დაიწყო',
          body: location.name ? `${location.name}-ში მისულხართ` : 'მისულხართ',
          data: { kind: 'shift_started', shift_id: newShift.id },
        })
      }
    }
  } else {
    // exit — schedule the close 60s out, don't commit yet
    const { data: openShift } = await supabase
      .from('shifts')
      .select('id, pending_close_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (openShift && !openShift.pending_close_at) {
      const pendingCloseAt = new Date(
        new Date(payload.occurred_at).getTime() + EXIT_HYSTERESIS_MS,
      ).toISOString()
      await supabase
        .from('shifts')
        .update({
          pending_close_at: pendingCloseAt,
          end_location: wktPoint as unknown as never,
        })
        .eq('id', openShift.id)
    }
    // If openShift already has pending_close_at, we don't move the timer
    // forward — the first EXIT wins. A re-ENTER cancels; otherwise the
    // next finalize_pending_shifts call commits the close.
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
}

type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'

interface AlertSetting {
  push_enabled: boolean
  email_enabled: boolean
  email_recipients: string[]
}

async function getAlertSetting(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  alertKind: AlertKind,
): Promise<AlertSetting> {
  const { data } = await supabase
    .from('tenant_alert_settings')
    .select('push_enabled, email_enabled, email_recipients')
    .eq('tenant_id', tenantId)
    .eq('alert_kind', alertKind)
    .maybeSingle()
  return (
    (data as AlertSetting | null) ?? {
      push_enabled: true,
      email_enabled: false,
      email_recipients: [],
    }
  )
}

async function dispatchAlert(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  alertKind: AlertKind,
  payload: PushPayload,
) {
  const setting = await getAlertSetting(supabase, tenantId, alertKind)

  if (setting.push_enabled) {
    await notifyTenantAdmins(supabase, tenantId, payload)
  }

  if (setting.email_enabled && setting.email_recipients.length > 0) {
    await sendAlertEmail(setting.email_recipients, payload)
  }
}

async function sendAlertEmail(recipients: string[], payload: PushPayload): Promise<void> {
  // Resend integration is wired here when RESEND_API_KEY is configured.
  // For now we log and return -- the setting is persisted so the day we
  // flip the key on, no further code changes are required.
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.log(
      `[geofence-event] email skipped (RESEND_API_KEY not set) recipients=${recipients.length} title=${payload.title}`,
    )
    return
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrackPro <alerts@trackpro.ge>',
        to: recipients,
        subject: payload.title,
        text: payload.body,
      }),
    })
  } catch (err) {
    console.error('[geofence-event] email send failed', err)
  }
}

async function notifyUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: PushPayload,
) {
  const { data: devices } = await supabase
    .from('user_devices')
    .select('expo_push_token')
    .eq('user_id', userId)
  await sendExpoPush(devices ?? [], payload)
}

async function notifyTenantAdmins(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  payload: PushPayload,
) {
  const { data: members } = await supabase
    .from('tenant_memberships')
    .select('user_id, role, is_active')
    .eq('tenant_id', tenantId)

  const adminIds = (members ?? [])
    .filter((m) => m.is_active && ['tenant_admin', 'super_admin'].includes(m.role))
    .map((m) => m.user_id)
  if (adminIds.length === 0) return

  const { data: devices } = await supabase
    .from('user_devices')
    .select('expo_push_token')
    .in('user_id', adminIds)
  await sendExpoPush(devices ?? [], payload)
}

async function sendExpoPush(
  devices: { expo_push_token: string }[],
  payload: PushPayload,
): Promise<void> {
  if (devices.length === 0) return
  const messages = devices.map((d) => ({
    to: d.expo_push_token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default',
  }))
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (err) {
    console.error('[geofence-event] push send failed', err)
  }
}
