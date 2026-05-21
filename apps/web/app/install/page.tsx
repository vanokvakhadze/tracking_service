import { AppleIcon, MailIcon, PlayIcon, SmartphoneIcon } from 'lucide-react'

export const metadata = {
  title: 'მობილური აპლიკაცია · TrackPro',
}

export default function InstallPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-[12px] border border-[var(--color-border)] bg-white p-6">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
          <SmartphoneIcon className="h-6 w-6" />
        </span>
        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">
          TrackPro მობილური აპლიკაცია
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          თანამშრომელი ცვლის გასახსნელად, GPS pings-ის გასაგზავნად და geofence events-ისთვის ამ
          აპლიკაციას იყენებს.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-[var(--color-text-primary)]">
              <AppleIcon className="h-4.5 w-4.5" />
            </div>
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">iOS</p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              App Store-ში მოლოდინში — ბეტა build-ისთვის TestFlight invite გადმოვაგზავნით.
            </p>
          </div>
          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-[var(--color-text-primary)]">
              <PlayIcon className="h-4.5 w-4.5" />
            </div>
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Android</p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Play Store-ში მოლოდინში — ბეტა build-ისთვის APK-ით გაგიგზავნით.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[8px] border border-[var(--color-accent-soft)] bg-[var(--color-accent-tint)] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-white text-[var(--color-accent)]">
              <MailIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                ბეტა build დაგვიკავშირდი
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                ჩვენი მისამართი:{' '}
                <a
                  className="font-semibold text-[var(--color-accent)] hover:underline"
                  href="mailto:beta@trackpro.ge"
                >
                  beta@trackpro.ge
                </a>{' '}
                — გადმოგვიწერე workspace-ის სახელი + ოპერაციული სისტემა (iOS / Android), ბეტა build
                გადმოგზავნით 24 საათში.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--color-text-tertiary)]">
          App Store / Play Store გამოშვებას ვაპირებთ {new Date().getFullYear()}-ის მე-3 კვარტალში
        </p>
      </div>
    </main>
  )
}
