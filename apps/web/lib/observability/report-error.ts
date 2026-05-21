import * as Sentry from '@sentry/nextjs'

type ContextValue = string | number | boolean | null | undefined

interface ServerActionErrorContext {
  action: string
  userId?: string
  [key: string]: ContextValue
}

export function reportServerActionError(error: unknown, context: ServerActionErrorContext) {
  Sentry.withScope((scope) => {
    scope.setTag('server_action', context.action)
    if (context.userId) scope.setUser({ id: context.userId })
    scope.setContext('server_action', context)

    Sentry.captureException(error)
  })
}
