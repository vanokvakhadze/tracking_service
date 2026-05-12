'use client'

import { useState } from 'react'
import { updateTenant } from '@/app/(app)/settings/update-tenant-action'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CompanyProfileFormProps {
  tenantId: string
  name: string
  subdomain: string | null
  timezone: string
  defaultLanguage: string
  defaultGeofenceRadiusM: number
}

export function CompanyProfileForm(props: CompanyProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)
    formData.set('tenantId', props.tenantId)
    const result = await updateTenant(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input id="name" name="name" label="კომპანიის სახელი" defaultValue={props.name} required />

      <div className="space-y-1">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Subdomain
        </label>
        <div className="flex h-8 items-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-text-tertiary)]">
          {props.subdomain ?? '—'}.trackpro.ge
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          Subdomain-ის შეცვლა მოგვიანებით — საფასურის ცვლილებას მოითხოვს
        </p>
      </div>

      <Input
        id="timezone"
        name="timezone"
        label="დროის სარტყელი"
        defaultValue={props.timezone}
        placeholder="Asia/Tbilisi"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="defaultLanguage"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            ნაგულისხმევი ენა
          </label>
          <select
            id="defaultLanguage"
            name="defaultLanguage"
            defaultValue={props.defaultLanguage}
            required
            className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          >
            <option value="ka">ქართული</option>
            <option value="en">English</option>
          </select>
        </div>

        <Input
          id="defaultGeofenceRadiusM"
          name="defaultGeofenceRadiusM"
          label="ნაგულისხმევი რადიუსი (მ)"
          type="number"
          defaultValue={props.defaultGeofenceRadiusM}
          min={50}
          max={5000}
          required
        />
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

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          შენახვა
        </Button>
      </div>
    </form>
  )
}
