'use client'

import { CalendarClock, Users } from 'lucide-react'
import { useState } from 'react'
import { createCheckoutSession } from '@/app/(app)/billing/checkout-action'
import { Button } from '@/components/ui/Button'

interface CurrentPlanCardProps {
  planCode: string | null
  planName: string | null
  status: string | null
  quantity: number
  currentPeriodEnd: string | null
  trialEndsAt: string | null
}

const STATUS_LABELS: Record<
  string,
  { label: string; tone: 'info' | 'warning' | 'success' | 'error' }
> = {
  trialing: { label: 'უფასო ცდა', tone: 'info' },
  active: { label: 'აქტიური', tone: 'success' },
  past_due: { label: 'გადახდის ვადა გასულია', tone: 'warning' },
  unpaid: { label: 'გადაუხდელი', tone: 'error' },
  canceled: { label: 'გაუქმებული', tone: 'error' },
  incomplete: { label: 'არასრული', tone: 'warning' },
  incomplete_expired: { label: 'ვადაგასული', tone: 'error' },
  paused: { label: 'შეჩერებული', tone: 'warning' },
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ka-GE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CurrentPlanCard(props: CurrentPlanCardProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusMeta = props.status ? STATUS_LABELS[props.status] : null
  const isTrialing = props.status === 'trialing'

  async function pick(plan: 'basic' | 'pro' | 'enterprise') {
    setLoadingPlan(plan)
    setError(null)
    const formData = new FormData()
    formData.set('plan', plan)
    const result = await createCheckoutSession(formData)
    if (result?.error) {
      setError(result.error)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">მიმდინარე გეგმა</h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[24px] font-bold text-[var(--color-text-primary)]">
              {props.planName ?? 'Trial'}
            </p>
            {statusMeta && <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />}
          </div>
          <div className="text-right text-[12px] text-[var(--color-text-secondary)]">
            <div className="flex items-center justify-end gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {props.quantity} თანამშრომელი
            </div>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {isTrialing
                ? `ცდა მთავრდება ${fmtDate(props.trialEndsAt)}`
                : `შემდეგი გადახდა ${fmtDate(props.currentPeriodEnd)}`}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
          <PlanButton
            plan="basic"
            label="Basic"
            price="5"
            current={props.planCode === 'basic'}
            loading={loadingPlan === 'basic'}
            onPick={() => pick('basic')}
          />
          <PlanButton
            plan="pro"
            label="Pro"
            price="12"
            current={props.planCode === 'pro'}
            loading={loadingPlan === 'pro'}
            onPick={() => pick('pro')}
            recommended
          />
          <PlanButton
            plan="enterprise"
            label="Enterprise"
            price="25"
            current={props.planCode === 'enterprise'}
            loading={loadingPlan === 'enterprise'}
            onPick={() => pick('enterprise')}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'info' | 'warning' | 'success' | 'error'
}) {
  const classes = {
    success:
      'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
    info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
    warning:
      'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
    error:
      'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
  }[tone]
  return (
    <span
      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  )
}

interface PlanButtonProps {
  plan: 'basic' | 'pro' | 'enterprise'
  label: string
  price: string
  current: boolean
  loading: boolean
  recommended?: boolean
  onPick: () => void
}

function PlanButton({
  plan,
  label,
  price,
  current,
  loading,
  recommended,
  onPick,
}: PlanButtonProps) {
  return (
    <div
      className={
        recommended
          ? 'rounded-[8px] border-2 border-[var(--color-accent)] p-4'
          : 'rounded-[8px] border border-[var(--color-border)] p-4'
      }
    >
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="mt-1 text-[18px] font-bold text-[var(--color-text-primary)] tabular-nums">
        {price}{' '}
        <span className="text-[11px] font-normal text-[var(--color-text-secondary)]">GEL/თვე</span>
      </p>
      <Button
        type="button"
        onClick={onPick}
        loading={loading}
        disabled={current}
        variant={recommended ? 'primary' : 'secondary'}
        className="mt-3 w-full"
      >
        {current ? 'ამჟამინდელი' : 'არჩევა'}
      </Button>
    </div>
  )
}
