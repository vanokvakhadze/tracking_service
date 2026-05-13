# task.045 — Activate Stripe billing (deferred Phase 5 enable)

**Type:** 🤖 Codex + 👤 Gio (Stripe + Supabase dashboards)
**Phase:** 5 — Billing
**Depends on:** Migration 11 already applied · Stripe code already in repo (commits 42b2930, 54f54ec, 33565dc, 41d8f40)
**Commit:** `feat(billing): activate stripe checkout + portal + webhook`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/(app)/billing/page.tsx` — currently a "coming soon" placeholder
- `apps/web/components/billing/CurrentPlanCard.tsx` — live version, currently unused
- `apps/web/components/billing/BillingPortalCard.tsx` — live version, currently unused
- `apps/web/components/billing/TrialBanner.tsx` — live, currently unused
- `apps/web/app/(app)/billing/checkout-action.ts` — server action, ready
- `apps/web/app/api/stripe/portal/route.ts` — portal route, ready
- `apps/web/lib/stripe/server.ts` — SDK instance, ready
- `supabase/functions/stripe-webhook/` — webhook + README

## Goal
Flip the billing system from "preview only" to fully live. The code is already in the repo from Phase 5 chunks 1-4; this task wires it back into the UI + runs the operational steps Gio needs to perform once.

---

## Pre-work (👤 Gio, before Codex executes)

### 1. Stripe account + products
1. https://dashboard.stripe.com → sign up
2. **Settings → Business settings → Currency: GEL**
3. Test mode ON
4. **Products → Create** for each:
   - TrackPro Basic — 5 GEL / seat / monthly recurring
   - TrackPro Pro — 12 GEL / seat / monthly
   - TrackPro Enterprise — 25 GEL / seat / monthly
5. Copy each price id (`price_xxx`) — used in env vars below
6. **Developers → API keys** — copy publishable + secret keys (test mode)

### 2. Env vars in `apps/web/.env.local`
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```
(`STRIPE_WEBHOOK_SECRET` comes after step 3.)

### 3. Deploy webhook
```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```
Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events: `customer.subscription.created/updated/deleted/trial_will_end`, `invoice.payment_failed`, `invoice.payment_succeeded`
- Copy signing secret → set in Supabase Dashboard → Edge Functions → stripe-webhook → Secrets:
  - `STRIPE_SECRET_KEY` (same as web)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...`

---

## Codex steps

### 1. Re-add billing to sidebar
In `apps/web/components/layout/SidebarNav.tsx`:
- Add `CreditCard` to the lucide-react import
- Uncomment the billing nav item:
  ```ts
  { href: '/billing', label: 'გადახდები', icon: CreditCard },
  ```

### 2. Replace placeholder `/billing` with the live UI
Overwrite `apps/web/app/(app)/billing/page.tsx` with the live version below — it pulls tenant + plans data and mounts the three live components.

```tsx
import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { BillingPortalCard } from '@/components/billing/BillingPortalCard'
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

interface TenantBillingRow {
  id: string
  name: string
  plan_code: string | null
  subscription_status: string | null
  subscription_quantity: number | null
  current_period_end: string | null
  trial_ends_at: string | null
}

interface PlanLookupRow {
  code: string
  name: string
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const tenantId = membership?.tenant?.id
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)
  const params = await searchParams

  if (!tenantId || !isAdmin) {
    return (
      <>
        <SubHeader title="გადახდები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          {!tenantId ? 'აქტიური workspace ვერ მოიძებნა.' : 'ბილინგი მხოლოდ admin-ისთვისაა.'}
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const [{ data: tenant }, { data: plans }] = await Promise.all([
    supabase
      .from('tenants')
      .select(
        'id, name, plan_code, subscription_status, subscription_quantity, current_period_end, trial_ends_at',
      )
      .eq('id', tenantId)
      .single()
      .overrideTypes<TenantBillingRow, { merge: false }>(),
    supabase
      .from('subscription_plans')
      .select('code, name')
      .overrideTypes<PlanLookupRow[], { merge: false }>(),
  ])

  if (!tenant) return <main className="p-8">Tenant not found.</main>

  const planName = (plans ?? []).find((p) => p.code === tenant.plan_code)?.name ?? null

  return (
    <>
      <SubHeader title="გადახდები" subtitle="გეგმის შეცვლა, გადახდის მეთოდი, ანგარიშები" />
      <main className="p-6 space-y-4">
        {params.success && (
          <Banner tone="success" text="გადახდა წარმატებით — სუბსკრიფცია გააქტიურდა." />
        )}
        {params.canceled && (
          <Banner tone="warning" text="გადახდა გაუქმდა. შეგიძლია ხელახლა სცადო ნებისმიერ დროს." />
        )}

        <CurrentPlanCard
          planCode={tenant.plan_code}
          planName={planName}
          status={tenant.subscription_status}
          quantity={tenant.subscription_quantity ?? 1}
          currentPeriodEnd={tenant.current_period_end}
          trialEndsAt={tenant.trial_ends_at}
        />
        <BillingPortalCard />
        <TrialBanner status={tenant.subscription_status} trialEndsAt={tenant.trial_ends_at} />
      </main>
    </>
  )
}

function Banner({ tone, text }: { tone: 'success' | 'warning'; text: string }) {
  const classes =
    tone === 'success'
      ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
      : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
  return <div className={`rounded-md border px-4 py-3 text-[13px] ${classes}`}>{text}</div>
}
```

## Acceptance criteria
- [ ] Sidebar shows "გადახდები" tab
- [ ] `/billing` renders CurrentPlanCard + BillingPortalCard + TrialBanner
- [ ] Clicking "Pro · არჩევა" opens Stripe Checkout (test mode)
- [ ] Successful test card `4242 4242 4242 4242` returns to /billing?success=true
- [ ] After return, the tenant's `subscription_status` in DB becomes `active` (webhook fired)
- [ ] Sidebar nav badge / count not added — billing is a single static link

## Commit
```powershell
git add apps/web/components/layout/SidebarNav.tsx apps/web/app/\(app\)/billing/page.tsx
git commit -m "feat(billing): activate stripe checkout + portal + webhook"
```

## DO NOT
- ❌ Hard-enforce trial expiry in middleware yet — TrialBanner is sufficient for v1
- ❌ Build per-seat auto-sync (DB trigger + edge function for quantity adjustment) — separate follow-up
- ❌ Commit the real `STRIPE_*` keys — they live in `.env.local` only
