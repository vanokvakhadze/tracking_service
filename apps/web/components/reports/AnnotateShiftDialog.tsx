'use client'

import { annotateShift } from '@/app/(app)/reports/annotate-action'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PencilLine } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'

interface AnnotateShiftDialogProps {
  shiftId: string
  initialNotes: string | null
}

export function AnnotateShiftDialog({ shiftId, initialNotes }: AnnotateShiftDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const charsLeft = useMemo(() => 500 - notes.length, [notes.length])

  function handleOpen() {
    setNotes(initialNotes ?? '')
    setError(null)
    setOpen(true)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await annotateShift({ shiftId, notes })
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={handleOpen}>
        <PencilLine className="h-3.5 w-3.5" />
        ანოტაცია
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="ცვლის ანოტაცია"
        description="დამატე მოკლე შენიშვნა payroll/QA-სთვის."
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor={`notes-${shiftId}`}
              className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              Notes
            </label>
            <textarea
              id={`notes-${shiftId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={5}
              className="w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
              placeholder="მაგ: GPS ჩავარდა 12:30–13:15; ხელით დადასტურებულია."
            />
            <p className="text-right text-[11px] text-[var(--color-text-tertiary)]">{charsLeft}</p>
          </div>

          {error && (
            <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              გაუქმება
            </Button>
            <Button type="button" onClick={handleSave} loading={isPending}>
              შენახვა
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
