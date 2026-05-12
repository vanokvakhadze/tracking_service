# Phase 6 — Super Admin (Week 13)

> **Goal:** Sazeo team manages all tenants from one dashboard.
> **Effort:** ~25 hours
> **Prerequisites:** Phase 5 (billing) complete.

---

## 🎯 Overview

ეს არის **შენი** (Sazeo founder/team) ხელსაწყო. Tenant-ებს არ უხილავთ.

ბოლოს:
- ✅ Dashboard: MRR, active companies, churn rate
- ✅ Tenants list + detail
- ✅ Impersonate user (for support)
- ✅ Audit log viewer
- ✅ Platform settings

---

## 📋 Tasks

### Task 6.1 — Super Admin Role

**Goal:** Add `super_admin` role on user level.

**Files to create:**
- Supabase migration

**Implementation:**

```sql
-- Add super_admin flag (separate from tenant role)
alter table public.users
  add column is_platform_admin boolean default false;

create index idx_users_platform_admin on public.users(is_platform_admin) where is_platform_admin = true;

-- Manually grant yourself super admin
update public.users set is_platform_admin = true where email = 'your@email.com';

-- RLS policy: platform admins can see all tenants
create policy "tenants_platform_admin" on public.tenants
  for select using (
    (select is_platform_admin from public.users where id = auth.uid()) = true
  );
```

**Acceptance criteria:**
- [ ] Manual grant works in DB
- [ ] Platform admin can SELECT from any tenant
- [ ] Regular users can't see other tenants

**Commit:** `feat(super-admin): add platform admin role`

---

### Task 6.2 — Super Admin Layout

**Goal:** Separate `/platform/*` route group with own shell.

**Files to create:**
- `apps/web/app/(super-admin)/layout.tsx`
- `apps/web/components/layout/PlatformTopBar.tsx`
- `apps/web/components/layout/PlatformSidebar.tsx`

**References:**
- Mockup: `reference/designs/15_super_admin.png`

**Implementation:**
- TopBar workspace branding: "Sazeo Platform / admin.sazeo.io"
- Sidebar mode pill: "Platform"
- Different color accent: amber (#D97706) — distinct from tenant blue
- Different domain: `admin.sazeo.io` (configure separately in Vercel)

**Acceptance criteria:**
- [ ] Only platform admins can access `/platform/*`
- [ ] Non-admins get 404
- [ ] Distinct branding from tenant UI

**Commit:** `feat(super-admin): add layout with platform branding`

---

### Task 6.3 — Platform Dashboard

**Goal:** Metrics for all tenants.

**Files to create:**
- `apps/web/app/(super-admin)/platform/page.tsx`
- `apps/web/components/platform/MRRChart.tsx`
- `apps/web/components/platform/TenantsTable.tsx`

**References:**
- Mockup: `reference/designs/15_super_admin.png`

**Acceptance criteria:**
- [ ] 4 metrics: MRR, active companies, total users, trial→paid %
- [ ] Tenants table with: name, subdomain, plan, users, monthly revenue, status
- [ ] Filter pills: Pro / Basic / Trial
- [ ] Sortable columns
- [ ] Export to CSV

**Commit:** `feat(super-admin): add platform dashboard`

---

### Task 6.4 — Tenant Detail Page

**Goal:** Drill into one tenant's data.

**Files to create:**
- `apps/web/app/(super-admin)/platform/tenants/[id]/page.tsx`

**Acceptance criteria:**
- [ ] Tenant info card
- [ ] Subscription details (Stripe link)
- [ ] User list
- [ ] Activity timeline
- [ ] Admin actions: suspend, refund, impersonate

**Commit:** `feat(super-admin): add tenant detail page`

---

### Task 6.5 — Impersonate User

**Goal:** Super admin "logs in as" tenant user for support.

**Files to create:**
- `apps/web/app/(super-admin)/platform/tenants/[id]/impersonate-action.ts`

**Implementation:**

```typescript
'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function impersonateUser(userId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify super admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user!.id)
    .single()

  if (!profile?.is_platform_admin) {
    throw new Error('Forbidden')
  }

  // Use service_role to generate magic link for target user
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: targetUser } = await admin
    .from('users')
    .select('email:auth.users!inner(email)')
    .eq('id', userId)
    .single()

  // Generate magic link
  const { data } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser!.email,
  })

  // Log impersonation
  await admin.from('audit_log').insert({
    actor_id: user!.id,
    action: 'impersonate_user',
    target_id: userId,
    metadata: { reason: 'support' },
  })

  redirect(data.properties.action_link)
}
```

**Acceptance criteria:**
- [ ] Only platform admins can call
- [ ] Logs impersonation to audit_log
- [ ] Magic link logs in as target user
- [ ] Banner shown to impersonating user: "🚨 Impersonating: name@example.com"
- [ ] Easy "exit impersonation" button

**Commit:** `feat(super-admin): add user impersonation`

---

### Task 6.6 — Audit Log Viewer

**Goal:** View all platform admin actions.

**Files to create:**
- Supabase migration for `audit_log` table
- `apps/web/app/(super-admin)/platform/audit/page.tsx`

**Implementation:**

```sql
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}',
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);

create index idx_audit_actor on public.audit_log(actor_id);
create index idx_audit_action on public.audit_log(action);
create index idx_audit_occurred on public.audit_log(occurred_at desc);
```

**Acceptance criteria:**
- [ ] Table with all admin actions
- [ ] Filter by actor, action type, date range
- [ ] Read-only (no edits/deletes)
- [ ] Pagination
- [ ] Search

**Commit:** `feat(super-admin): add audit log viewer`

---

## ✅ Phase 6 Complete Checklist

- [ ] Platform admin role works
- [ ] Dashboard shows real MRR + metrics
- [ ] Can drill into any tenant
- [ ] Impersonation works + audited
- [ ] Audit log accessible
- [ ] Distinct branding from tenant UI

**🎉 Move to Phase 7: `08_PHASE_POLISH.md`**
