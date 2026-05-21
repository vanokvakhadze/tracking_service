import { Button } from '@/components/ui/Button'
import { Clock, Mail, RotateCw, X } from 'lucide-react'
import type { PendingInvitationRow } from './types'

interface PendingInvitationsCardProps {
  invitations: PendingInvitationRow[]
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })
}

export function PendingInvitationsCard({ invitations }: PendingInvitationsCardProps) {
  const active = invitations.filter((item) => new Date(item.expires_at).getTime() > Date.now())
  const expired = invitations.filter((item) => new Date(item.expires_at).getTime() <= Date.now())

  return (
    <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            მოლოდინში მოწვევები
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            {active.length} აქტიური · {expired.length} ვადაგასული
          </p>
        </div>
        <Button size="sm" variant="secondary">
          ყველა მოწვევა
        </Button>
      </div>

      {invitations.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-[var(--color-text-secondary)]">
          მოლოდინში მოწვევა არ არის
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at).getTime() <= Date.now()
            return (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3" key={invitation.id}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-[220px] flex-1">
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {invitation.email}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {invitation.role} · {formatDate(invitation.created_at)}
                  </p>
                </div>
                <span
                  className={
                    isExpired
                      ? 'inline-flex items-center gap-1 rounded-full border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-error-text)]'
                      : 'inline-flex items-center gap-1 rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning-text)]'
                  }
                >
                  <Clock className="h-3 w-3" />
                  {isExpired ? 'ვადაგასული' : 'მოლოდინში'}
                </span>
                <Button size="sm" variant="secondary">
                  <RotateCw className="h-3.5 w-3.5" />
                  Resend
                </Button>
                {!isExpired && (
                  <Button size="sm" variant="ghost">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
