export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center text-2xl font-bold">
          T
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          TrackPro
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          GPS-ის თანამშრომლების ტრეკინგი
        </p>
      </div>
    </main>
  )
}
