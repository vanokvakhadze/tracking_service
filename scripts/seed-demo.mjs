#!/usr/bin/env node
// TrackPro demo data seeder.
//
// Creates a reviewer-ready tenant on the live Supabase project:
//   - 1 tenant_admin user  (login email + password)
//   - 1 tenant             ("App Review Demo")
//   - 3 locations          (Tbilisi addresses with realistic radii)
//   - 2 employee users     (with active memberships)
//   - 1 pending provisional location (for the approve-flow review)
//
// Idempotent: if the admin email already exists, the script deletes the
// previous demo tenant + all its rows and re-creates from scratch. Run
// it as often as you need a clean slate.
//
// Usage (PowerShell or bash):
//   SUPABASE_URL=https://lekogoghgbvmrlqcqmhv.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx \
//   DEMO_PASSWORD=ReviewMe2026! \
//   node scripts/seed-demo.mjs
//
// Optional env vars:
//   DEMO_ADMIN_EMAIL    (default: review@trackpro.ge)
//   DEMO_TENANT_NAME    (default: "App Review Demo")
//   DEMO_TENANT_SUBDOMAIN (default: "review")

import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'ReviewMe2026!'
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'review@trackpro.ge'
const DEMO_TENANT_NAME = process.env.DEMO_TENANT_NAME ?? 'App Review Demo'
const DEMO_TENANT_SUBDOMAIN = process.env.DEMO_TENANT_SUBDOMAIN ?? 'review'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── data fixtures ───────────────────────────────────────────────────────────
const ADMIN = {
  email: DEMO_ADMIN_EMAIL,
  password: DEMO_PASSWORD,
  first_name: 'Demo',
  last_name: 'Admin',
}

const EMPLOYEES = [
  {
    email: 'giorgi.review@trackpro.ge',
    password: DEMO_PASSWORD,
    first_name: 'გიორგი',
    last_name: 'ბერიძე',
    employee_code: 'EMP001',
  },
  {
    email: 'nini.review@trackpro.ge',
    password: DEMO_PASSWORD,
    first_name: 'ნინი',
    last_name: 'ჭიჭიქარიძე',
    employee_code: 'EMP002',
  },
]

const LOCATIONS = [
  {
    name: 'ცენტრალური ოფისი',
    category: 'office',
    address: 'ვაჟა-ფშაველას 76, თბილისი',
    latitude: 41.7152,
    longitude: 44.7497,
    trigger_radius_m: 100,
    boundary_radius_m: 200,
  },
  {
    name: 'საქარის ფილ. #2',
    category: 'client_site',
    address: 'პეკინის გამზირი 32, თბილისი',
    latitude: 41.7264,
    longitude: 44.7686,
    trigger_radius_m: 150,
    boundary_radius_m: 300,
  },
  {
    name: 'საწყობი — დიდუბე',
    category: 'warehouse',
    address: 'წერეთლის გამზირი 117, თბილისი',
    latitude: 41.7464,
    longitude: 44.7779,
    trigger_radius_m: 200,
    boundary_radius_m: 400,
  },
]

const PROVISIONAL = {
  name: 'სუპერმარკეტი — ვაკე',
  latitude: 41.7099,
  longitude: 44.7625,
  note_from_employee: 'ვაკის სუპერმარკეტი — ახალი client visit',
}

// ── helpers ─────────────────────────────────────────────────────────────────
function wkt(lat, lng) {
  return `SRID=4326;POINT(${lng} ${lat})`
}

async function findAuthUserByEmail(email) {
  // The admin API doesn't expose a direct email lookup; we list users and
  // filter. Fine for a one-shot script.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) throw new Error(`listUsers failed: ${error.message}`)
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function deletePreviousDemo() {
  console.log('› checking for previous demo data...')
  const existing = await findAuthUserByEmail(ADMIN.email)
  if (!existing) {
    console.log('  no previous demo found, fresh seed coming up.')
    return
  }
  console.log(`  found prior admin ${existing.id}, removing…`)

  // Find tenant via membership join, then cascade-delete the tenant.
  // tenants ON DELETE CASCADE handles memberships, locations, shifts.
  const { data: memberships } = await supabase
    .from('tenant_memberships')
    .select('tenant_id')
    .eq('user_id', existing.id)
  const tenantIds = [...new Set((memberships ?? []).map((m) => m.tenant_id))]
  for (const tenantId of tenantIds) {
    await supabase.from('location_pings').delete().eq('tenant_id', tenantId)
    await supabase.from('geofence_events').delete().eq('tenant_id', tenantId)
    await supabase.from('shifts').delete().eq('tenant_id', tenantId)
    await supabase.from('invitations').delete().eq('tenant_id', tenantId)
    await supabase.from('locations').delete().eq('tenant_id', tenantId)
    await supabase.from('tenant_memberships').delete().eq('tenant_id', tenantId)
    await supabase.from('tenants').delete().eq('id', tenantId)
    console.log(`  deleted tenant ${tenantId}`)
  }

  // Delete all demo auth users (admin + employees) and their public.users rows
  for (const { email } of [ADMIN, ...EMPLOYEES]) {
    const u = await findAuthUserByEmail(email)
    if (!u) continue
    await supabase.from('users').delete().eq('id', u.id)
    await supabase.auth.admin.deleteUser(u.id)
    console.log(`  deleted user ${email}`)
  }
}

async function createAuthUser({ email, password, first_name, last_name }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  })
  if (error) throw new Error(`createUser(${email}) failed: ${error.message}`)
  return data.user
}

async function createTenant(adminUserId) {
  const { data, error } = await supabase.rpc('create_tenant_with_admin', {
    p_user_id: adminUserId,
    p_email: ADMIN.email,
    p_first_name: ADMIN.first_name,
    p_last_name: ADMIN.last_name,
    p_company_name: DEMO_TENANT_NAME,
    p_subdomain: DEMO_TENANT_SUBDOMAIN,
  })
  if (error) throw new Error(`create_tenant_with_admin failed: ${error.message}`)
  return data // tenant_id (uuid)
}

async function createLocation(tenantId, loc) {
  const { error } = await supabase.from('locations').insert({
    tenant_id: tenantId,
    name: loc.name,
    category: loc.category,
    address: loc.address,
    center: wkt(loc.latitude, loc.longitude),
    latitude: loc.latitude,
    longitude: loc.longitude,
    radius_m: loc.boundary_radius_m,
    trigger_radius_m: loc.trigger_radius_m,
    boundary_radius_m: loc.boundary_radius_m,
    status: 'active',
    is_active: true,
  })
  if (error) throw new Error(`location(${loc.name}) failed: ${error.message}`)
}

async function createEmployee(tenantId, emp) {
  const authUser = await createAuthUser(emp)
  await supabase.from('users').insert({
    id: authUser.id,
    email: emp.email,
    first_name: emp.first_name,
    last_name: emp.last_name,
    email_verified_at: new Date().toISOString(),
  })
  await supabase.from('tenant_memberships').insert({
    tenant_id: tenantId,
    user_id: authUser.id,
    role: 'user',
    is_active: true,
    employee_code: emp.employee_code,
  })
  return authUser
}

async function fetchTenantLocations(tenantId) {
  const { data, error } = await supabase
    .from('locations')
    .select('id, latitude, longitude, boundary_radius_m')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
  if (error) throw new Error(`fetch locations failed: ${error.message}`)
  return data ?? []
}

function jitterCoord(value, jitterMeters) {
  // ~111km per degree latitude -> 1m ≈ 1/111000 deg
  const jitter = (Math.random() - 0.5) * 2 * (jitterMeters / 111000)
  return value + jitter
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

async function createHistoricalShift(tenantId, userId, locations, daysAgo) {
  // Shift between 08:30-17:30 give or take. Pick a starting hour 8-10.
  const base = new Date()
  base.setDate(base.getDate() - daysAgo)
  base.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0)

  const startedAt = new Date(base)
  const visitCount = 3 + Math.floor(Math.random() * 3) // 3-5 visits
  const shiftDurationMin = 360 + Math.floor(Math.random() * 180) // 6-9 hours
  const endedAt = new Date(startedAt.getTime() + shiftDurationMin * 60 * 1000)

  const startLoc = pickRandom(locations)
  const endLoc = pickRandom(locations)
  const totalDistanceM = 4000 + Math.floor(Math.random() * 11000) // 4-15km
  const totalDwellMinutes = Math.floor(shiftDurationMin * (0.55 + Math.random() * 0.25)) // 55-80% dwell

  const { data: shiftRow, error: shiftErr } = await supabase
    .from('shifts')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      status: 'completed',
      start_location: wkt(jitterCoord(startLoc.latitude, 50), jitterCoord(startLoc.longitude, 50)),
      end_location: wkt(jitterCoord(endLoc.latitude, 50), jitterCoord(endLoc.longitude, 50)),
      total_distance_m: totalDistanceM,
      total_dwell_minutes: totalDwellMinutes,
      locations_visited: visitCount,
    })
    .select('id')
    .single()
  if (shiftErr) throw new Error(`historical shift failed: ${shiftErr.message}`)

  // Generate enter/exit pairs spread across the shift duration.
  const segmentMs = (shiftDurationMin * 60 * 1000) / visitCount
  const events = []
  for (let i = 0; i < visitCount; i++) {
    const loc = pickRandom(locations)
    const enterAt = new Date(startedAt.getTime() + i * segmentMs + Math.random() * 60_000)
    const exitAt = new Date(
      Math.min(endedAt.getTime(), enterAt.getTime() + (segmentMs * 0.7 + Math.random() * 600_000)),
    )
    const lat = jitterCoord(loc.latitude, 30)
    const lng = jitterCoord(loc.longitude, 30)
    events.push({
      tenant_id: tenantId,
      user_id: userId,
      shift_id: shiftRow.id,
      location_id: loc.id,
      event_type: 'enter',
      occurred_at: enterAt.toISOString(),
      coords: wkt(lat, lng),
      accuracy_m: 8 + Math.floor(Math.random() * 12),
      zone: 'inside',
    })
    events.push({
      tenant_id: tenantId,
      user_id: userId,
      shift_id: shiftRow.id,
      location_id: loc.id,
      event_type: 'exit',
      occurred_at: exitAt.toISOString(),
      coords: wkt(lat, lng),
      accuracy_m: 8 + Math.floor(Math.random() * 12),
      zone: 'outside',
    })
  }
  const { error: eventsErr } = await supabase.from('geofence_events').insert(events)
  if (eventsErr) throw new Error(`historical events failed: ${eventsErr.message}`)
  return events.length
}

async function createActiveShift(tenantId, userId, locations, withMockPings) {
  // Active shift started 1-3 hours ago
  const hoursAgo = 1 + Math.random() * 2
  const startedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
  const startLoc = pickRandom(locations)

  const { data: shiftRow, error: shiftErr } = await supabase
    .from('shifts')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      started_at: startedAt.toISOString(),
      status: 'active',
      start_location: wkt(jitterCoord(startLoc.latitude, 50), jitterCoord(startLoc.longitude, 50)),
      total_distance_m: Math.floor(Math.random() * 4000),
      total_dwell_minutes: Math.floor(hoursAgo * 60 * 0.7),
      locations_visited: 1,
    })
    .select('id')
    .single()
  if (shiftErr) throw new Error(`active shift failed: ${shiftErr.message}`)

  // One enter event at the start location
  const enterAt = new Date(startedAt.getTime() + 5 * 60 * 1000)
  await supabase.from('geofence_events').insert({
    tenant_id: tenantId,
    user_id: userId,
    shift_id: shiftRow.id,
    location_id: startLoc.id,
    event_type: 'enter',
    occurred_at: enterAt.toISOString(),
    coords: wkt(jitterCoord(startLoc.latitude, 20), jitterCoord(startLoc.longitude, 20)),
    accuracy_m: 10,
    zone: 'inside',
  })

  // 10 location_pings across last hour, plus optionally 2 mock_gps pings
  const pingCount = 10
  const pings = []
  for (let i = 0; i < pingCount; i++) {
    const recordedAt = new Date(Date.now() - (pingCount - i) * (60_000 / 1.5))
    pings.push({
      tenant_id: tenantId,
      user_id: userId,
      shift_id: shiftRow.id,
      recorded_at: recordedAt.toISOString(),
      coords: wkt(jitterCoord(startLoc.latitude, 80), jitterCoord(startLoc.longitude, 80)),
      accuracy_m: 6 + Math.floor(Math.random() * 8),
      battery_percent: 70 + Math.floor(Math.random() * 25),
      speed_mps: Math.random() * 2.5,
      is_mock: false,
    })
  }

  if (withMockPings) {
    // Add 2 mock pings in the last 10 minutes -> trips mock_gps alert
    for (let i = 0; i < 2; i++) {
      const recordedAt = new Date(Date.now() - (3 + i * 2) * 60 * 1000)
      pings.push({
        tenant_id: tenantId,
        user_id: userId,
        shift_id: shiftRow.id,
        recorded_at: recordedAt.toISOString(),
        coords: wkt(jitterCoord(startLoc.latitude, 200), jitterCoord(startLoc.longitude, 200)),
        accuracy_m: 5,
        battery_percent: 35,
        speed_mps: 0,
        is_mock: true,
      })
    }
  }

  const { error: pingsErr } = await supabase.from('location_pings').insert(pings)
  if (pingsErr) throw new Error(`active pings failed: ${pingsErr.message}`)
  return { shiftId: shiftRow.id, pingsInserted: pings.length }
}

async function createPendingInvitation(tenantId, invitedByUserId) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('invitations').insert({
    tenant_id: tenantId,
    email: 'demo.invite@trackpro.ge',
    role: 'user',
    token: randomBytes(32).toString('base64url'),
    expires_at: expiresAt,
    invited_by_user_id: invitedByUserId,
    status: 'pending',
  })
  if (error) throw new Error(`pending invite failed: ${error.message}`)
}

async function createPendingLocation(tenantId, submitterId) {
  const { error } = await supabase.from('locations').insert({
    tenant_id: tenantId,
    name: PROVISIONAL.name,
    category: 'other',
    center: wkt(PROVISIONAL.latitude, PROVISIONAL.longitude),
    latitude: PROVISIONAL.latitude,
    longitude: PROVISIONAL.longitude,
    radius_m: 100,
    trigger_radius_m: 50,
    boundary_radius_m: 100,
    status: 'pending_approval',
    submitted_at: new Date().toISOString(),
    created_by_user_id: submitterId,
  })
  if (error) throw new Error(`pending location failed: ${error.message}`)
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  await deletePreviousDemo()

  console.log('› creating admin auth user…')
  const admin = await createAuthUser(ADMIN)
  console.log(`  ${admin.id}`)

  console.log('› bootstrapping tenant + profile + membership…')
  const tenantId = await createTenant(admin.id)
  console.log(`  tenant ${tenantId}`)

  console.log('› seeding locations…')
  for (const loc of LOCATIONS) {
    await createLocation(tenantId, loc)
    console.log(`  ✓ ${loc.name}`)
  }

  console.log('› creating employees…')
  const employees = []
  for (const emp of EMPLOYEES) {
    const u = await createEmployee(tenantId, emp)
    employees.push(u)
    console.log(`  ✓ ${emp.email}`)
  }

  console.log('› creating 1 pending provisional location…')
  await createPendingLocation(tenantId, employees[0].id)
  console.log(`  ✓ ${PROVISIONAL.name}`)

  console.log('› seeding operational data (shifts + events + pings + invite)…')
  const tenantLocations = await fetchTenantLocations(tenantId)
  if (tenantLocations.length === 0) {
    throw new Error('no active locations found after seed — cannot generate shifts')
  }

  // 8 historical shifts across last 7 days, spread between the 2 employees.
  let historicalEvents = 0
  for (let i = 0; i < 8; i++) {
    const daysAgo = 1 + (i % 7)
    const employee = employees[i % employees.length]
    historicalEvents += await createHistoricalShift(tenantId, employee.id, tenantLocations, daysAgo)
  }
  console.log(`  ✓ 8 historical shifts (${historicalEvents} geofence events)`)

  // 2 active shifts — one with mock GPS to trip an alert.
  const active1 = await createActiveShift(tenantId, employees[0].id, tenantLocations, true)
  const active2 = await createActiveShift(tenantId, employees[1].id, tenantLocations, false)
  console.log(
    `  ✓ 2 active shifts (${active1.pingsInserted + active2.pingsInserted} pings, 2 mock_gps for alert)`,
  )

  // 1 pending invitation
  await createPendingInvitation(tenantId, admin.id)
  console.log('  ✓ 1 pending invitation (demo.invite@trackpro.ge)')

  console.log('')
  console.log('━'.repeat(60))
  console.log('Demo tenant ready.')
  console.log('━'.repeat(60))
  console.log(`Tenant:    ${DEMO_TENANT_NAME}`)
  console.log(`Subdomain: ${DEMO_TENANT_SUBDOMAIN}.trackpro.ge`)
  console.log('')
  console.log('Admin login (paste into App Store Connect / Play Console):')
  console.log(`  email:    ${ADMIN.email}`)
  console.log(`  password: ${ADMIN.password}`)
  console.log('')
  console.log('Employees (for testing the mobile app):')
  for (const emp of EMPLOYEES) {
    console.log(`  ${emp.email}  /  ${emp.password}`)
  }
  console.log('━'.repeat(60))
}

main().catch((err) => {
  console.error('seed-demo failed:', err)
  process.exit(1)
})
