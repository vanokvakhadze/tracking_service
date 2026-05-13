import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthBody {
  status: 'ok' | 'degraded' | 'down'
  ts: string
  checks: {
    database: 'ok' | 'down'
    error?: string
  }
}

export async function GET() {
  const startedAt = Date.now()
  const body: HealthBody = {
    status: 'ok',
    ts: new Date().toISOString(),
    checks: { database: 'ok' },
  }

  // Cheapest possible DB roundtrip - `select 1` via a known table.
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('subscription_plans')
      .select('id', { head: true, count: 'exact' })
      .limit(1)
    if (error) {
      body.status = 'down'
      body.checks.database = 'down'
      body.checks.error = error.message
    }
  } catch (err) {
    body.status = 'down'
    body.checks.database = 'down'
    body.checks.error = err instanceof Error ? err.message : 'unknown'
  }

  const took = Date.now() - startedAt
  const status = body.status === 'ok' ? 200 : 503

  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Latency-Ms': String(took),
    },
  })
}
