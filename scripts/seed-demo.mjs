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

async function createPendingLocation(tenantId, submitterId) {
  const { error } = await supabase.from('locations').insert({
    tenant_id: tenantId,
    name: PROVISIONAL.name,
    category: 'other',
    center: wkt(PROVISIONAL.latitude, PROVISIONAL.longitude),
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
