import { Bell, Plus, Search } from 'lucide-react'
import { UserMenu } from './UserMenu'

interface TopBarProps {
  workspaceInitial: string
  workspaceName: string
  workspaceSubdomain: string | null
  userInitials: string
  userDisplayName: string
  userRole: string
}

export function TopBar({
  workspaceInitial,
  workspaceName,
  workspaceSubdomain,
  userInitials,
  userDisplayName,
  userRole,
}: TopBarProps) {
  return (
    <header className="flex items-center h-12 px-3 gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Left: workspace identity (200px slot to align with sidebar) */}
      <div className="flex items-center gap-2 w-[200px] pl-1 shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--color-accent)] text-[11px] font-bold text-[var(--color-accent-fg)]">
          {workspaceInitial}
        </span>
        <div className="leading-tight min-w-0">
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)] truncate">
            {workspaceName}
          </p>
          {workspaceSubdomain && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
              {workspaceSubdomain}.trackpro.ge
            </p>
          )}
        </div>
      </div>

      {/* Search (left-aligned right after brand, per Dashboard v2 mockup) */}
      <div className="flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-[12px] text-[var(--color-text-tertiary)] min-w-[280px]">
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 truncate">მოძებნე ლოკაცია, თანამშრომელი, ანგარიში…</span>
        <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Right: utilities + user pill */}
      <div className="flex items-center gap-1 shrink-0">
        <IconButton aria-label="ახალი">
          <Plus className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton aria-label="შეტყობინებები">
          <span className="relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-error)]" />
            </span>
          </span>
        </IconButton>

        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />

        <UserMenu initials={userInitials} displayName={userDisplayName} role={userRole} />
      </div>
    </header>
  )
}

function IconButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
      {...props}
    >
      {children}
    </button>
  )
}
