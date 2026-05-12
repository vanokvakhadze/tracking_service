import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center text-2xl font-bold">
          T
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">TrackPro</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          GPS-ის თანამშრომლების ტრეკინგი
        </p>

        <div className="mt-8 text-xs text-[var(--color-text-tertiary)]">
          {error ? (
            <span>supabase error: {error.message}</span>
          ) : (
            <span>plans: {plans?.map((p) => p.name).join(' · ') ?? '—'}</span>
          )}
        </div>
      </div>
    </main>
  )
}
