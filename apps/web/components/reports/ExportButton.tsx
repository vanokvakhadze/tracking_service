'use client'

import { exportShiftsCsv } from '@/app/(app)/reports/export-action'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { useState, useTransition } from 'react'

interface ExportButtonProps {
  fromIso?: string
  toIso?: string
}

export function ExportButton({ fromIso, toIso }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleClick = () => {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const csv = await exportShiftsCsv({ fromIso, toIso })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `trackpro-shifts-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed')
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-end">
      <Button onClick={handleClick} loading={isPending} variant="secondary">
        <Download className="h-3.5 w-3.5" />
        ექსპორტი (CSV)
      </Button>
      {errorMessage && (
        <p className="mt-1 text-[11px] text-[var(--color-error-text)]">{errorMessage}</p>
      )}
    </div>
  )
}
