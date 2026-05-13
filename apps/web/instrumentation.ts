// Next.js calls this on server start (Node + Edge). It is the modern hook for
// initialising server-side observability — Sentry's docs ask us to register
// the runtime-specific config from here.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
