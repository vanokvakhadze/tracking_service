import {
  ArrowRight,
  BatteryCharging,
  Bell,
  Camera,
  ChartBar,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'TrackPro — GPS-ის თანამშრომელთა ტრექინგი',
  description:
    'ცვლის ავტომატური დაწყება + დასრულება გეოფენსით. სუფთა რეპორტები. KAYA-style UX. საქართველოს ბაზრისთვის.',
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <PricingTeaser />
      <CtaStrip />
      <Footer />
    </>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-tint)] via-[var(--color-bg)] to-[var(--color-bg)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-tint)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-hover)]">
              <Sparkles className="h-3 w-3" />
              საქართველოს ბაზრისთვის
            </span>
            <h1 className="mt-5 text-[44px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-[56px]">
              თანამშრომელთა ცვლა{' '}
              <span className="text-[var(--color-accent)]">თვითონ ჩაიწერება</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--color-text-secondary)]">
              გეოფენსი იპოვის, რომ თანამშრომელი სამუშაოზე მისულია — ცვლა იწყება ავტომატურად. გავიდა
              — ცვლა მთავრდება. არც manual punch-clock, არც mock GPS, არც დაუდევრობით მიწერილი
              საათები.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--color-accent)] px-6 text-[14px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                დაიწყე უფასოდ
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white px-6 text-[14px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
              >
                ფასები
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-[var(--color-text-tertiary)]">
              14 დღიანი ცდა · ბარათი არ მოითხოვება · ქართულ ენაზე
            </p>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-4 rounded-[24px] bg-[var(--color-accent)] opacity-10 blur-3xl"
      />
      <div className="relative rounded-[18px] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              საქარის ფილ. #2
            </span>
          </div>
          <span className="rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success-text)]">
            ცვლა მიდის
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="დრო ლოკაციაზე" value="04:32" />
          <Stat label="ცვლის რეჟიმი" value="Auto" />
        </div>
        <div className="mt-3 rounded-[10px] bg-[var(--color-accent-tint)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-hover)]">
            ცოცხალი მონაცემები
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-text-primary)]">
            გიორგი ბერიძე · 5 თანამშრომელი მიდის
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[var(--color-surface)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function Features() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <h2 className="text-[32px] font-bold tracking-tight text-[var(--color-text-primary)]">
            რას აკეთებს TrackPro
          </h2>
          <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
            ერთი აპლიკაცია მენეჯერისთვის და თანამშრომლისთვის. ნაჩვენებია ცოცხალი GPS, შრომის
            საათები, და სამუშაო ზონები.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<MapPin className="h-5 w-5" />}
            title="გეოფენსი + hysteresis"
            description="თითო ლოკაციას ორი ზონა — Trigger (ცვლის ცენტრი) და Boundary (alert ფარგლები). 30 წამიანი hysteresis-ი თავიდან აიცილებს false trigger-ებს."
          />
          <Feature
            icon={<ChartBar className="h-5 w-5" />}
            title="რეპორტები ფინანსისთვის"
            description="გადახდის გვერდი ავტომატურად ფარდის სრულ საათებს, ლოკაციებს, შრომის რეგიონს. CSV ექსპორტი."
          />
          <Feature
            icon={<Bell className="h-5 w-5" />}
            title="push შეტყობინებები"
            description="ცვლის დაწყება, სამუშაო ზონიდან გასვლა, Mock GPS, ბატარეის სიგრძე — ყველაფერი push-ით ადმინს და თანამშრომელს."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Mock GPS დაცვა"
            description="iOS-ის isFromMockProvider + Android-ის isMock-ი — შენი თანამშრომელი ვერ მოგატყუებს. ცვლა იბლოკება + ადმინს მისდის push."
          />
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="ლოკაციის მონიშვნა"
            description="თანამშრომელი მიდის ახალ ადგილზე — იღებს ფოტოს. ადმინი მოწიწებით ამოწმებს და approve-ს უკეთებს ერთი დაჭერით."
          />
          <Feature
            icon={<BatteryCharging className="h-5 w-5" />}
            title="ბატარეის ეკონომია"
            description="Motion-based state machine — ჩათული მდგომარეობაში GPS იცი, მოძრაობისას უხდიდება. ~70% ბატარიის გადარჩენა."
          />
        </div>
      </div>
    </section>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-[14px] border border-[var(--color-border)] bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
        {icon}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'დააყენე აპლიკაცია',
      description:
        'მენეჯერი ქმნის ანგარიშს, ემატება ლოკაციები რუკაზე ან მისამართით. თანამშრომელი იწერს მობილური აპლიკაციით 1 წუთში.',
    },
    {
      n: '2',
      title: 'ცვლა იწერება ავტომატურად',
      description:
        'თანამშრომელი მიდის სამუშაოზე — გეოფენსი იცის. ცვლა იწყება. გავიდა — ცვლა მთავრდება. არც აპლიკაცია უნდა გახსნა.',
    },
    {
      n: '3',
      title: 'ანგარიში სუფთად',
      description:
        'მენეჯერი ხედავს ცოცხალ რუკას, ცვლის საათებს, Mock GPS attempt-ებს. რეპორტი ფინანსისთვის — ერთი დაჭერით CSV.',
    },
  ]
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <h2 className="text-[32px] font-bold tracking-tight text-[var(--color-text-primary)]">
            3 ნაბიჯში
          </h2>
          <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
            დაარეგისტრირე, დაამატე ლოკაცია, მოიწვია გუნდი. ცვლების ტრექინგი მერე თვითონ ხდება.
          </p>
        </header>

        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="relative rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <span
                aria-hidden="true"
                className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-bold text-[var(--color-accent-fg)]"
              >
                {step.n}
              </span>
              <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function PricingTeaser() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[32px] font-bold tracking-tight text-[var(--color-text-primary)]">
          ფასი — თანამშრომელზე
        </h2>
        <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
          არ გჭირდება მინიმუმი. გადახდილია მხოლოდ აქტიური თანამშრომელი. შეჩერდი ან გააქტიურდი
          ნებისმიერ დროს.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--color-accent)] px-6 text-[14px] font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
          >
            იხილე ფასები
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CtaStrip() {
  return (
    <section className="bg-[var(--color-accent)] px-6 py-16 text-center text-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-[28px] font-bold tracking-tight">გადააქციე ცვლის ჩაწერა ავტომატად</h2>
        <p className="mt-3 text-[14px] opacity-90">
          14 დღე უფასოდ. ბარათი არ მოითხოვება. შესვლა 1 წუთშია.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-white px-6 text-[14px] font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface)]"
          >
            დაიწყე უფასოდ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-accent)] text-[14px] font-bold text-[var(--color-accent-fg)]">
              T
            </span>
            <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              TrackPro
            </span>
          </div>
          <p className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
            © {new Date().getFullYear()} Sazeo
          </p>
        </div>

        <FooterCol
          title="პროდუქტი"
          links={[
            ['ფიჩერები', '/#features'],
            ['ფასები', '/pricing'],
          ]}
        />
        <FooterCol
          title="კომპანია"
          links={[
            ['კონფიდენციალურობა', '/privacy'],
            ['პირობები', '/terms'],
          ]}
        />
        <FooterCol
          title="დახმარება"
          links={[
            ['შესვლა', '/login'],
            ['რეგისტრაცია', '/signup'],
          ]}
        />
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-[13px]">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
