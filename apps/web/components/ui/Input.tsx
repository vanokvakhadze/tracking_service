import { clsx } from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={clsx(
            'h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px]',
            'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10',
            error && 'border-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
