import { AlertTriangle, Clock } from 'lucide-react'

interface TrialBannerProps {
  status: string | null
  trialEndsAt: string | null
}

export function TrialBanner({ status, trialEndsAt }: TrialBannerProps) {
  if (status !== 'trialing' || !trialEndsAt) return null

  const ends = new Date(trialEndsAt)
  const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86_400_000))
  const expired = daysLeft === 0 && ends.getTime() < Date.now()

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-[10px] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-error-text)]" />
        <div className="text-[13px] text-[var(--color-error-text)]">
          <p className="font-semibold">უფასო ცდა დასრულდა</p>
          <p className="mt-0.5">აირჩიე გეგმა ქვემოთ რომ აპის გამოყენება გააგრძელო.</p>
        </div>
      </div>
    )
  }

  const tone = daysLeft <= 3 ? 'warning' : 'info'
  const classes =
    tone === 'warning'
      ? 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
      : 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]'

  return (
    <div className={`flex items-center gap-3 rounded-[10px] border p-4 ${classes}`}>
      <Clock className="h-5 w-5 shrink-0" />
      <p className="text-[13px]">
        უფასო ცდა მთავრდება <strong>{daysLeft} დღეში</strong> (
        {ends.toLocaleDateString('ka-GE', { day: 'numeric', month: 'long' })}). გადახდის
        გასააქტიურებლად აირჩიე გეგმა.
      </p>
    </div>
  )
}
