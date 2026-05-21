// Runs on the client. Sentry v8+ / Next.js 16 (Turbopack) picks up this file
// instead of the legacy `sentry.client.config.ts`. Activated only when
// NEXT_PUBLIC_SENTRY_DSN is set so local/dev builds stay quiet.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV ?? 'production',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  })
}
