'use client'

import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { bulkInviteFromCsv } from '@/app/(app)/users/bulk-invite-action'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface BulkResult {
  ok: number
  skipped: number
  errors: { row: number; email: string; reason: string }[]
}

interface BulkInviteDialogProps {
  open: boolean
  onClose: () => void
}

const TEMPLATE = [
  'email,first_name,last_name,role,employee_code',
  'giorgi@example.com,Giorgi,Beridze,user,EMP001',
  'nini@example.com,Nini,Chich,user,EMP002',
].join('\n')

export function BulkInviteDialog({ open, onClose }: BulkInviteDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [fileName, setFileName] = useState<string>('')

  function handleClose() {
    setLoading(false)
    setError(null)
    setResult(null)
    setFileName('')
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'trackpro-bulk-invite-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function submit() {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setError('CSV ფაილი აირჩიე.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const csv = await readFileAsText(file)
      const bulkResult = await bulkInviteFromCsv(csv)
      setResult(bulkResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="CSV-ით მასობრივი მოწვევა"
      description="20-50 თანამშრომელი ერთდროულად დაამატე."
    >
      <div className="space-y-4">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[12px] text-[var(--color-text-secondary)]">
          სქემა: <code>email,first_name,last_name,role,employee_code</code>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="bulk-csv-file"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            CSV ფაილი
          </label>
          <input
            id="bulk-csv-file"
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
            className="block w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] file:mr-3 file:rounded-[6px] file:border file:border-[var(--color-border)] file:bg-[var(--color-surface)] file:px-2 file:py-1 file:text-[12px]"
          />
          {fileName && <p className="text-[11px] text-[var(--color-text-tertiary)]">{fileName}</p>}
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-white p-3">
            <div className="text-[12px] text-[var(--color-text-secondary)]">
              წარმატებული: <b className="text-[var(--color-text-primary)]">{result.ok}</b> ·
              გამოტოვებული: <b className="text-[var(--color-text-primary)]">{result.skipped}</b> ·
              შეცდომა: <b className="text-[var(--color-text-primary)]">{result.errors.length}</b>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                <ul className="divide-y divide-[var(--color-border)]">
                  {result.errors.map((item) => (
                    <li key={`${item.row}-${item.email}`} className="px-3 py-2 text-[12px]">
                      ხაზი {item.row} · {item.email || '—'} · {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            ჩამოტვირთე template
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              დახურვა
            </Button>
            <Button type="button" loading={loading} onClick={submit}>
              <Upload className="h-3.5 w-3.5" />
              იმპორტი
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('CSV ფაილი ვერ წაიკითხა'))
    reader.readAsText(file)
  })
}
