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
    <header className="flex items-center h-12 px-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Left: workspace identity (220px slot to align with sidebar) */}
      <div className="flex items-center gap-2 w-[212px] pr-3">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)] text-[13px] font-semibold text-[var(--color-accent-fg)]">
          {workspaceInitial}
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)] truncate max-w-[140px]">
            {workspaceName}
          </p>
          {workspaceSubdomain && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] truncate max-w-[140px]">
              {workspaceSubdomain}.trackpro.ge
            </p>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Right: utilities + user pill */}
      <div className="flex items-center gap-1">
        <IconButton aria-label="ახალი">
          <Plus className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="ძებნა">
          <Search className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="შეტყობინებები">
          <span className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--color-error)]" />
          </span>
        </IconButton>

        <span className="mx-2 h-5 w-px bg-[var(--color-border)]" />

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
      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
      {...props}
    >
      {children}
    </button>
  )
}
