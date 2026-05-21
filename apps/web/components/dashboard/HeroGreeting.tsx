interface HeroGreetingProps {
  name: string
  activeNow: number
  totalUsers: number
  distanceTodayKm: number
  visitsToday: number
}

export function HeroGreeting({
  name,
  activeNow,
  totalUsers,
  distanceTodayKm,
  visitsToday,
}: HeroGreetingProps) {
  return (
    <section className="relative overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,var(--color-accent-hover),var(--color-accent),var(--color-accent-soft))] p-5 text-white">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[22px] font-bold leading-tight">გამარჯობა, {name}</h2>
          <p className="mt-1 text-[13px] text-white/85">
            {activeNow} თანამშრომელი ცოცხალია · {Math.max(totalUsers - activeNow, 0)} offline ·
            განახლება რეალურ დროში
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-white/20 lg:border-l lg:pl-6">
          <HeroStat label="ცოცხალია now" value={`${activeNow}/${totalUsers}`} />
          <HeroStat label="მანძილი დღეს" value={`${distanceTodayKm.toFixed(1)} კმ`} />
          <HeroStat label="ვიზიტი" value={String(visitsToday)} />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-white/75">{label}</p>
      <p className="mt-1 text-[22px] font-bold leading-tight tabular-nums">{value}</p>
    </div>
  )
}
