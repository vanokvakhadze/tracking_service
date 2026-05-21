import * as Sentry from '@sentry/nextjs'

interface ReportContext {
  action: string
  tenantId?: string | null
  userId?: string | null
  extra?: Record<string, unknown>
}

/**
 * Capture a server-action error in Sentry with a stable `action` tag so we can
 * filter the issue stream by surface (e.g. "invite-user", "create-location"). The
 * call is no-op when SENTRY_DSN is unset (Sentry SDK degrades gracefully).
 */
export function reportServerActionError(error: unknown, context: ReportContext) {
  Sentry.withScope((scope) => {
    scope.setTag('server_action', context.action)
    if (context.tenantId) scope.setTag('tenant_id', context.tenantId)
    if (context.userId) scope.setTag('user_id', context.userId)
    if (context.extra) scope.setExtras(context.extra)
    Sentry.captureException(error)
  })
}
