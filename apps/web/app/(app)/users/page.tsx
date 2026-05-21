import { UsersPageClient } from '@/components/users/UsersPageClient'
import type { MembershipRow, PendingInvitationRow } from '@/components/users/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type MembershipQueryRow = Omit<
  MembershipRow,
  'team_name' | 'visits_7d' | 'productivity_score' | 'activity_trend'
>

interface EventRow {
  user_id: string
  occurred_at: string
}

interface ShiftRow {
  user_id: string
  started_at: string
  ended_at: string | null
  total_dwell_minutes: number | null
}

interface GroupMembershipRow {
  user_id: string
  group: { name: string | null } | { name: string | null }[] | null
}

function pickUser(row: MembershipRow) {
  return Array.isArray(row.user) ? (row.user[0] ?? null) : row.user
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildSevenDayKeys() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return dayKey(date)
  })
}

function scoreFromShifts(shifts: ShiftRow[]) {
  if (shifts.length === 0) return 0
  const activeMinutes = shifts.reduce((sum, shift) => {
    if (shift.total_dwell_minutes) return sum + shift.total_dwell_minutes
    const end = shift.ended_at ? new Date(shift.ended_at).getTime() : Date.now()
    return sum + Math.max(0, Math.round((end - new Date(shift.started_at).getTime()) / 60000))
  }, 0)
  return Math.min(100, Math.round((activeMinutes / (shifts.length * 8 * 60)) * 100))
}

export default async function UsersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((membership) => membership.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        ამ გვერდზე წვდომა მხოლოდ admin-ს აქვს.
      </main>
    )
  }

  const tenantId = myActive.tenant?.id
  if (!tenantId) redirect('/login')

  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const dayKeys = buildSevenDayKeys()

  const [membershipsResult, invitationsResult, eventsResult, shiftsResult, groupsResult] =
    await Promise.all([
      supabase
        .from('tenant_memberships')
        .select(
          `
          id,
          role,
          is_active,
          employee_code,
          created_at,
          user:users(id, email, first_name, last_name, avatar_url, last_login_at)
        `,
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('invitations')
        .select('id, email, role, created_at, expires_at, status')
        .eq('tenant_id', tenantId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('geofence_events')
        .select('user_id, occurred_at')
        .eq('tenant_id', tenantId)
        .gte('occurred_at', sevenDaysAgo.toISOString()),
      supabase
        .from('shifts')
        .select('user_id, started_at, ended_at, total_dwell_minutes')
        .eq('tenant_id', tenantId)
        .gte('started_at', sevenDaysAgo.toISOString()),
      supabase
        .from('group_memberships')
        .select('user_id, group:groups(name)')
        .eq('tenant_id', tenantId),
    ])

  const rawMemberships = (membershipsResult.data ?? []) as MembershipQueryRow[]
  const invitations = (invitationsResult.data ?? []) as PendingInvitationRow[]
  const events = (eventsResult.data ?? []) as EventRow[]
  const shifts = (shiftsResult.data ?? []) as ShiftRow[]
  const groups = (groupsResult.data ?? []) as GroupMembershipRow[]

  const groupByUser = new Map<string, string>()
  for (const groupMembership of groups) {
    const group = Array.isArray(groupMembership.group)
      ? (groupMembership.group[0] ?? null)
      : groupMembership.group
    if (group?.name) groupByUser.set(groupMembership.user_id, group.name)
  }

  const eventsByUser = new Map<string, EventRow[]>()
  for (const event of events) {
    const existing = eventsByUser.get(event.user_id) ?? []
    existing.push(event)
    eventsByUser.set(event.user_id, existing)
  }

  const shiftsByUser = new Map<string, ShiftRow[]>()
  for (const shift of shifts) {
    const existing = shiftsByUser.get(shift.user_id) ?? []
    existing.push(shift)
    shiftsByUser.set(shift.user_id, existing)
  }

  const rows = rawMemberships.map((row) => {
    const user = pickUser(row)
    const userEvents = user ? (eventsByUser.get(user.id) ?? []) : []
    const trend = dayKeys.map(
      (key) => userEvents.filter((event) => dayKey(new Date(event.occurred_at)) === key).length,
    )
    const userShifts = user ? (shiftsByUser.get(user.id) ?? []) : []
    return {
      ...row,
      team_name: user ? (groupByUser.get(user.id) ?? null) : null,
      visits_7d: userEvents.length,
      productivity_score: scoreFromShifts(userShifts),
      activity_trend: trend,
    } satisfies MembershipRow
  })

  const activeScores = rows
    .filter((row) => row.is_active === true)
    .map((row) => row.productivity_score ?? 0)
  const averageProductivity =
    activeScores.length > 0
      ? Math.round(activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length)
      : 0

  return (
    <UsersPageClient
      canBulkInvite
      initialRows={rows}
      pendingInvitations={invitations}
      stats={{
        total: rows.length,
        active: rows.filter((row) => row.is_active === true).length,
        averageProductivity,
        pendingInvites: invitations.filter(
          (invitation) => new Date(invitation.expires_at).getTime() > Date.now(),
        ).length,
      }}
    />
  )
}
