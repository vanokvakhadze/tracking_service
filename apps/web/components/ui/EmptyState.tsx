import { clsx } from 'clsx'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface ActionLink {
  label: string
  href: string
}

interface ActionButton {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ActionLink | ActionButton
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]"
        >
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {'href' in action ? (
            <Link
              href={action.href}
              className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[var(--color-accent)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
            >
              {action.label}
            </Link>
          ) : (
            <Button onClick={action.onClick} className="px-4">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
