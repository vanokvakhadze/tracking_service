'use client'

import { clsx } from 'clsx'
import { Grid3X3, List, Map as MapIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type LocationsView = 'grid' | 'list' | 'map'

interface LocationsViewToggleProps {
  view: LocationsView
}

const views: Array<{ value: LocationsView; label: string; icon: typeof Grid3X3 }> = [
  { value: 'grid', label: 'ბადე', icon: Grid3X3 },
  { value: 'list', label: 'სია', icon: List },
  { value: 'map', label: 'რუკა', icon: MapIcon },
]

export function LocationsViewToggle({ view }: LocationsViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setView(nextView: LocationsView) {
    const params = new URLSearchParams(searchParams)
    if (nextView === 'grid') {
      params.delete('view')
    } else {
      params.set('view', nextView)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="inline-flex rounded-[8px] bg-[var(--color-surface-2)] p-1">
      {views.map((item) => {
        const Icon = item.icon
        const active = view === item.value

        return (
          <button
            key={item.value}
            type="button"
            aria-label={item.label}
            title={item.label}
            onClick={() => setView(item.value)}
            className={clsx(
              'inline-flex h-7 w-8 items-center justify-center rounded-[6px] transition-colors',
              active
                ? 'bg-white text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-white',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
