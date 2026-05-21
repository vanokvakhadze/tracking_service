'use client'

import { AlertTriangle, BatteryLow, MapPinOff, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { updateAlertSettings } from '@/app/(app)/settings/update-alert-settings-action'
import { Button } from '@/components/ui/Button'

export type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'

export interface AlertSettingRow {
  alertKind: AlertKind
  pushEnabled: boolean
  emailEnabled: boolean
  emailRecipients: string[]
}

interface Props {
  tenantId: string
  initial: AlertSettingRow[]
}

const KIND_META: Record<AlertKind, { label: string; icon: typeof AlertTriangle; desc: string }> = {
  mock_gps: {
    label: 'Mock GPS — ცრუ ლოკაცია',
    icon: ShieldAlert,
    desc: 'თანამშრომელი იყენებს fake-GPS აპლიკაციას',
  },
  location_disabled: {
    label: 'ლოკაცია გათიშულია',
    icon: MapPinOff,
    desc: 'მოწყობილობაზე GPS გათიშულია — ცვლა ვერ შემოწმდება',
  },
  low_battery: {
    label: 'დაბალი ბატარეა',
    icon: BatteryLow,
    desc: 'ბატარეა 15%-ზე ნაკლები — ცვლა შეიძლება გაითიშოს',
  },
  out_of_zone: {
    label: 'სამუშაო ზონის გარეთ',
    icon: AlertTriangle,
    desc: 'თანამშრომელი ცვლის გარეშე გავიდა boundary ზონიდან',
  },
}

const KIND_ORDER: AlertKind[] = ['mock_gps', 'location_disabled', 'low_battery', 'out_of_zone']

export function AlertSettingsForm({ tenantId, initial }: Props) {
  const initialMap = new Map(initial.map((r) => [r.alertKind, r]))
  const [rows, setRows] = useState<AlertSettingRow[]>(
    KIND_ORDER.map(
      (kind) =>
        initialMap.get(kind) ?? {
          alertKind: kind,
          pushEnabled: true,
          emailEnabled: false,
          emailRecipients: [],
        },
    ),
  )
  const [recipientInput, setRecipientInput] = useState(
    initial[0]?.emailRecipients.join(', ') ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggle(kind: AlertKind, field: 'pushEnabled' | 'emailEnabled') {
    setRows((prev) =>
      prev.map((row) => (row.alertKind === kind ? { ...row, [field]: !row[field] } : row)),
    )
  }

  async function handleSubmit() {
    setError(null)
    setSuccess(false)
    setLoading(true)

    const recipients = recipientInput
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean)

    const invalid = recipients.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    if (invalid) {
      setError(`არასწორი email: ${invalid}`)
      setLoading(false)
      return
    }

    const result = await updateAlertSettings({
      tenantId,
      settings: rows.map((row) => ({
        alertKind: row.alertKind,
        pushEnabled: row.pushEnabled,
        emailEnabled: row.emailEnabled,
        emailRecipients: recipients,
      })),
    })

    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[6px] border border-[var(--color-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]">
                ალერტი
              </th>
              <th className="w-[90px] px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]">
                Push
              </th>
              <th className="w-[90px] px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = KIND_META[row.alertKind]
              const Icon = meta.icon
              return (
                <tr key={row.alertKind} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                          {meta.label}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">{meta.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Toggle
                      checked={row.pushEnabled}
                      onChange={() => toggle(row.alertKind, 'pushEnabled')}
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Toggle
                      checked={row.emailEnabled}
                      onChange={() => toggle(row.alertKind, 'emailEnabled')}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="email-recipients"
          className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
        >
          Email მიმღებები
        </label>
        <textarea
          id="email-recipients"
          rows={2}
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder="admin@trackpro.ge, ops@company.ge"
          className="block w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
        />
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          მძიმეთი გამოყავი მისამართები. Push შეტყობინებები მიდის ცვლის mobile app-ში
          დარეგისტრირებულ ცარა admin-ის device-ზე.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-[12px] text-[var(--color-success-text)]">
          შენახულია ✓
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          Email infrastructure საჭიროებს RESEND_API_KEY env-ი setup-ი (post-launch).
        </p>
        <Button onClick={handleSubmit} loading={loading}>
          შენახვა
        </Button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ' +
        (checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]')
      }
    >
      <span
        className={
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ' +
          (checked ? 'translate-x-[18px]' : 'translate-x-[2px]')
        }
      />
    </button>
  )
}
