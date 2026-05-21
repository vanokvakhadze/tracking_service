'use client'

import {
  ArrowRight,
  Check,
  Circle,
  Copy,
  MapPin,
  PlayCircle,
  Smartphone,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const MOBILE_SHARED_KEY = 'trackpro.onboarding.mobile-shared'

interface OnboardingChecklistProps {
  inviteStepDone: boolean
  locationStepDone: boolean
  shiftStepDone: boolean
  memberCount: number
  pendingInviteCount: number
  locationCount: number
}

export function OnboardingChecklist({
  inviteStepDone,
  locationStepDone,
  shiftStepDone,
  memberCount,
  pendingInviteCount,
  locationCount,
}: OnboardingChecklistProps) {
  const router = useRouter()
  const [mobileShared, setMobileShared] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setMobileShared(window.localStorage.getItem(MOBILE_SHARED_KEY) === 'true')
    setHydrated(true)
  }, [])

  function markMobileShared() {
    window.localStorage.setItem(MOBILE_SHARED_KEY, 'true')
    setMobileShared(true)
  }

  const completed =
    Number(inviteStepDone) + Number(locationStepDone) + Number(mobileShared) + Number(shiftStepDone)
  const total = 4
  const allDone = completed === total

  return (
    <>
      <ProgressHeader completed={completed} total={total} />

      <ol className="space-y-3">
        <SetupStep
          cta={
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
              href="/users"
            >
              მოიწვიე გუნდი
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          description={
            inviteStepDone
              ? memberCount > 1
                ? `${memberCount} თანამშრომელი workspace-ში`
                : `${pendingInviteCount} მოწვევა გაგზავნილია`
              : 'ერთი ან მეტი ემაილით — single ან CSV bulk'
          }
          done={inviteStepDone}
          icon={Users}
          number={1}
          title="მოიწვიე გუნდი"
        />

        <SetupStep
          cta={
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
              href="/locations/new"
            >
              დაამატე ლოკაცია
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          description={
            locationStepDone
              ? `${locationCount} ლოკაცია უკვე შექმნილია`
              : 'ოფისი, საწყობი ან customer site — gps boundary radius-ით'
          }
          done={locationStepDone}
          icon={MapPin}
          number={2}
          title="დაამატე პირველი ლოკაცია"
        />

        <SetupStep
          cta={
            !hydrated ? null : mobileShared ? null : (
              <MobileShareControl onConfirm={markMobileShared} />
            )
          }
          description={
            mobileShared
              ? 'მონიშნა as shared — გადადი მე-4 ნაბიჯზე'
              : 'გუნდმა აპლიკაცია უნდა დააინსტალოს ცვლის დასაწყებად'
          }
          done={mobileShared}
          icon={Smartphone}
          number={3}
          title="გააზიარე მობილური აპლიკაცია"
        />

        <SetupStep
          cta={
            shiftStepDone ? null : (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)]">
                <Circle className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                მოლოდინში — გუნდი დაიწყებს ცვლას მობილურიდან
              </span>
            )
          }
          description={
            shiftStepDone
              ? 'პირველი ცვლა დაფიქსირდა — data ხელმისაწვდომია'
              : 'როცა თანამშრომელი ცვლას მობილურიდან გახსნის, აქ მონიშნდება'
          }
          done={shiftStepDone}
          icon={PlayCircle}
          number={4}
          title="პირველი ცვლა"
        />
      </ol>

      {allDone ? (
        <div className="rounded-[10px] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-5 text-center">
          <p className="text-[15px] font-bold text-[var(--color-success-text)]">ყველაფერი მზადაა</p>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            ცოცხალი დაშბორდი ახლა real-time data-ს აჩვენებს.
          </p>
          <button
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[var(--color-success)] px-4 text-[13px] font-semibold text-white hover:opacity-90"
            onClick={() => router.push('/dashboard')}
            type="button"
          >
            გადადი დაშბორდზე
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-center text-[12px] text-[var(--color-text-tertiary)]">
          ნაბიჯების გადახტომა გინდა?{' '}
          <Link
            className="font-semibold text-[var(--color-accent)] hover:underline"
            href="/dashboard"
          >
            გადადი დაშბორდზე
          </Link>
        </p>
      )}
    </>
  )
}

function ProgressHeader({ completed, total }: { completed: number; total: number }) {
  const pct = (completed / total) * 100
  return (
    <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[14px] font-bold text-[var(--color-text-primary)]">
            წინსვლა · {completed}/{total}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            ბაზისური ნაბიჯები რომ ბეტა-სტარტი მზად იყოს
          </p>
        </div>
        <span className="text-[24px] font-bold tabular-nums text-[var(--color-accent)]">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  )
}

interface SetupStepProps {
  number: number
  title: string
  description: string
  done: boolean
  icon: typeof Users
  cta: React.ReactNode
}

function SetupStep({ number, title, description, done, icon: Icon, cta }: SetupStepProps) {
  return (
    <li
      className={
        done
          ? 'flex items-start gap-4 rounded-[10px] border border-[var(--color-success-border)] bg-[var(--color-success-bg)]/30 p-4'
          : 'flex items-start gap-4 rounded-[10px] border border-[var(--color-border)] bg-white p-4'
      }
    >
      <span
        className={
          done
            ? 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-success)] text-white'
            : 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent-tint)] text-[var(--color-accent)]'
        }
      >
        {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
            ნაბიჯი {number}
          </span>
          {done && (
            <span className="rounded-full bg-[var(--color-success)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
              მზადაა
            </span>
          )}
        </div>
        <p className="mt-1 text-[14px] font-bold text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">{description}</p>
        {cta && <div className="mt-3">{cta}</div>}
      </div>
    </li>
  )
}

function MobileShareControl({ onConfirm }: { onConfirm: () => void }) {
  const [copied, setCopied] = useState(false)
  const installUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/install` : '/install'

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(installUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — fallback handled by manual selection
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[12px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
        onClick={copyLink}
        type="button"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? 'დაკოპირდა ✓' : 'დააკოპირე install link'}
      </button>
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
        onClick={onConfirm}
        type="button"
      >
        გავაგზავნე ✓
      </button>
    </div>
  )
}
