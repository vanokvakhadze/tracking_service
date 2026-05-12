import { ChevronDown, ShieldCheck } from 'lucide-react'
import { SidebarNav } from './SidebarNav'

interface SidebarProps {
  footerName: string
  footerRole: string
  footerInitials: string
}

export function Sidebar({ footerName, footerRole, footerInitials }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-2">
      {/* Mode pill (admin only for now) */}
      <button
        type="button"
        className="mb-3 flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 hover:bg-[var(--color-surface-2)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[var(--color-accent-tint)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
        </span>
        <span className="flex-1 text-left text-[13px] font-semibold text-[var(--color-text-primary)]">
          Admin Panel
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
      </button>

      <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        მართვა
      </p>
      <SidebarNav />

      <div className="mt-auto flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[12px] font-semibold text-[var(--color-accent)]">
          {footerInitials}
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate max-w-[140px]">
            {footerName}
          </p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">{footerRole}</p>
        </div>
      </div>
    </aside>
  )
}
