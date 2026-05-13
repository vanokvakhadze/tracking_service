import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
}

// withSentryConfig is a passthrough when SENTRY_DSN is not set, so it's safe
// to keep the wrapper in place even during local development.
export default withSentryConfig(nextConfig, {
  // Source-map upload only fires when SENTRY_AUTH_TOKEN is available. Keep
  // that env var server-only (Vercel) so the local dev build never tries
  // to upload.
  org: process.env.SENTRY_ORG ?? 'sazeo',
  project: process.env.SENTRY_PROJECT ?? 'trackpro-web',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
})
