'use client'

import { Clock, History, MoreVertical, Phone } from 'lucide-react'
import type { TimelineEvent, TrackerVM } from './types'
import { elapsedLabel, relativeLabel } from './types'

interface Props {
  tracker: TrackerVM | null
  timeline: TimelineEvent[]
}

const STATUS_DOT = {
  active: 'var(--color-success)',
  idle: 'var(--color-warning)',
  off: 'var(--color-text-tertiary)',
} as const

const STATUS_LABEL = {
  active: 'აქტიური',
  idle: 'დაყოვნება',
  off: 'გათიშული',
} as const

export function TrackerDetailPanel({ tracker, timeline }: Props) {
  if (!tracker) {
    return (
      <aside className="flex w-[320px] shrink-0 flex-col items-center justify-center border-l border-[var(--color-border)] bg-white p-8 text-center">
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
          აირჩიე თანამშრომელი
        </p>
        <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
          მარცხნივ სიიდან ან რუკაზე pin-ი დააწექი — დეტალები აქ გამოჩნდება.
        </p>
      </aside>
    )
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-[var(--color-border)] bg-white">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <div
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold"
          style={{ backgroundColor: tracker.avatarBg, color: tracker.avatarFg }}
        >
          {tracker.initials}
          <span
            className="absolute -bottom-0.5 -right-0.5 h-[12px] w-[12px] rounded-full border-2 border-white"
            style={{ backgroundColor: STATUS_DOT[tracker.status] }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-[var(--color-text-primary)]">
            {tracker.name}
          </p>
          <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">{tracker.team}</p>
        </div>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface)]"
          aria-label="მენიუ"
          disabled
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2.5 px-4 py-3.5">
        <Stat
          label="სტატუსი"
          value={STATUS_LABEL[tracker.status]}
          valueColor={STATUS_DOT[tracker.status]}
          sub={
            tracker.lat !== null && tracker.lng !== null ? 'პოზიცია ცნობილია' : 'პოზიცია უცნობია'
          }
        />
        <Stat
          label="დაყოვნება"
          value={elapsedLabel(tracker.startedAt)}
          sub={`დაიწყო ${new Intl.DateTimeFormat('ka-GE', { hour: '2-digit', minute: '2-digit' }).format(new Date(tracker.startedAt))}`}
        />
        <Stat
          label="გავლილი დღეს"
          value={tracker.speedMps !== null ? '—' : '—'}
          sub="მონაცემები მზადდება"
        />
        <Stat
          label="სიჩქარე"
          value={tracker.speedMps !== null ? `${Math.round(tracker.speedMps * 3.6)} კმ/ს` : '—'}
          sub={tracker.speedMps === 0 ? 'სტაციონარული' : ''}
        />
      </div>

      <div className="flex items-center gap-3.5 border-t border-[var(--color-border)] px-4 py-3.5">
        <BatteryDonut percent={tracker.batteryPercent} />
        <div className="flex flex-1 flex-col gap-1 text-[11px]">
          <Row
            label="სიგნალი"
            value={
              tracker.accuracyM !== null && tracker.accuracyM <= 10
                ? 'კარგი'
                : tracker.accuracyM !== null
                  ? 'საშუალო'
                  : 'უცნობია'
            }
          />
          <Row
            label="სიზუსტე"
            value={tracker.accuracyM !== null ? `±${Math.round(tracker.accuracyM)} მ` : '—'}
          />
          <Row label="მოწყობილობა" value="—" />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden border-t border-[var(--color-border)] px-4 py-3.5">
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">
          დღევანდელი მოძრაობა
        </h3>
        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          {timeline.length === 0 ? (
            <p className="py-4 text-[12px] text-[var(--color-text-tertiary)]">
              დღეს მოვლენა ჯერ არ ყოფილა.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {timeline.map((event, i) => (
                <li key={event.id} className="relative flex gap-2.5">
                  {i < timeline.length - 1 && (
                    <span className="absolute left-[5px] top-3.5 bottom-[-14px] w-[1.5px] bg-[var(--color-border)]" />
                  )}
                  <span
                    className="z-10 mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-white"
                    style={{
                      backgroundColor:
                        event.kind === 'enter' ? 'var(--color-success)' : 'var(--color-warning)',
                      boxShadow: `0 0 0 1.5px ${event.kind === 'enter' ? 'var(--color-success)' : 'var(--color-warning)'}`,
                    }}
                  />
                  <div className="min-w-0 flex-1 text-[12px]">
                    <p className="text-[var(--color-text-primary)]">
                      <strong className="font-semibold">
                        {event.kind === 'enter' ? 'შემოვიდა' : 'გავიდა'}
                      </strong>
                      {event.locationName && <> · {event.locationName}</>}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {relativeLabel(event.occurredAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-[var(--color-border)] px-3 py-3">
        <button
          type="button"
          disabled
          className="flex flex-1 items-center justify-center gap-1.5 rounded bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-semibold text-white opacity-60"
        >
          <Phone className="h-3.5 w-3.5" />
          დაუკავშირდი
        </button>
        <button
          type="button"
          disabled
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-primary)] opacity-60 hover:bg-[var(--color-surface)]"
        >
          <History className="h-3.5 w-3.5" />
          ისტორია
        </button>
      </div>
    </aside>
  )
}

function Stat({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string
  value: string
  valueColor?: string
  sub?: string
}) {
  return (
    <div className="rounded-md bg-[var(--color-surface)] p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p
        className="mt-0.5 text-[14px] font-bold tabular-nums"
        style={{ color: valueColor ?? 'var(--color-text-primary)' }}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">{sub}</p>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <span className="font-semibold text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function BatteryDonut({ percent }: { percent: number | null }) {
  const value = percent ?? 0
  const dashLength = (value / 100) * 91
  const stroke =
    value >= 50
      ? 'var(--color-success)'
      : value >= 20
        ? 'var(--color-warning)'
        : 'var(--color-error)'

  return (
    <svg className="h-[70px] w-[70px] shrink-0" viewBox="0 0 36 36" aria-label="ბატარეა">
      <circle
        cx="18"
        cy="18"
        r="14.5"
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth="3"
      />
      {percent !== null && (
        <circle
          cx="18"
          cy="18"
          r="14.5"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeDasharray={`${dashLength} 91`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      )}
      <text
        x="18"
        y="17"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="var(--color-text-primary)"
      >
        {percent !== null ? `${Math.round(percent)}%` : '—'}
      </text>
      <text x="18" y="23" textAnchor="middle" fontSize="2.5" fill="var(--color-text-tertiary)">
        ბატარეა
      </text>
    </svg>
  )
}
