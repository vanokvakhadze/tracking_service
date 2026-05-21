import { Sparkles } from 'lucide-react'

export function AIInsights() {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">AI insights</h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">ჯერ-ჯერობით preview</p>
      </div>
      <div className="grid min-h-[180px] place-items-center p-5 text-center">
        <div>
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-[var(--color-accent)]" />
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            AI insights მალე
          </p>
          <p className="mt-1 max-w-xs text-[12px] text-[var(--color-text-secondary)]">
            როცა მინიმუმ 30 დღის მონაცემები გროვდება, აქ გამოჩნდება ტრენდები + ანომალიები.
          </p>
        </div>
      </div>
    </section>
  )
}
