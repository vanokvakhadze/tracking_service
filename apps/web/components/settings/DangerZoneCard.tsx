'use client'

import { ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DeleteAccountDialog } from './DeleteAccountDialog'

interface DangerZoneCardProps {
  email: string
  isSoleAdmin: boolean
}

export function DangerZoneCard({ email, isSoleAdmin }: DangerZoneCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-error-border)] bg-white">
      <header className="flex items-start gap-3 border-b border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-6 py-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[var(--color-error)]">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-error-text)]">
            სახიფათო ზონა
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-error-text)]">
            შეუქცევადი მოქმედებები ანგარიშის უსაფრთხოებისთვის
          </p>
        </div>
      </header>

      <div className="space-y-4 px-6 py-5">
        <div>
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            ანგარიშის წაშლა
          </p>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[var(--color-text-secondary)]">
            წაშლის შემდეგ შენი აქტიური წევრობები გაითიშება. მონაცემები ინახება 30 დღის განმავლობაში
            და შემდეგ სრულად იშლება privacy policy-ის მიხედვით.
          </p>
        </div>

        {isSoleAdmin ? (
          <div className="rounded-md border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-[12px] leading-5 text-[var(--color-warning-text)]">
            შენ ხარ ერთადერთი ადმინისტრატორი. წაშლამდე გადაეცი ადმინისტრატორის როლი სხვას ან
            მოგვწერე support@trackpro.ge.
          </div>
        ) : null}

        <button
          type="button"
          disabled={isSoleAdmin}
          onClick={() => setOpen(true)}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-[6px] bg-[var(--color-error)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-error-text)] disabled:pointer-events-none disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-text-tertiary)]"
        >
          <Trash2 className="h-4 w-4" />
          ანგარიშის წაშლა
        </button>
      </div>

      <DeleteAccountDialog open={open} email={email} onClose={() => setOpen(false)} />
    </section>
  )
}
