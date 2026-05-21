'use client'

import { Button } from '@/components/ui/Button'
import { Download, Plus } from 'lucide-react'

interface InviteBannerProps {
  onCsv: () => void
  onInvite: () => void
}

export function InviteBanner({ onCsv, onInvite }: InviteBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-soft))] p-5 text-white">
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold leading-tight">გააფართოვე გუნდი</h2>
          <p className="mt-1 text-[12px] text-white/85">
            1 თვის უფასო trial · 5 invite-ი ერთად - CSV-ით
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-white text-[var(--color-accent)] hover:bg-white/90"
            onClick={onCsv}
            variant="secondary"
          >
            <Download className="h-3.5 w-3.5" />
            გადახედე ნიმუშს
          </Button>
          <Button
            className="bg-white text-[var(--color-accent)] hover:bg-white/90"
            onClick={onInvite}
            variant="secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            მოწვევა
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0_1px,transparent_1px_16px)]" />
    </section>
  )
}
