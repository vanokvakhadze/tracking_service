'use client'

import { useMemo, useState } from 'react'

export interface HeroSeries {
  name: string
  color: string
  points: number[]
}

interface HeroChartProps {
  series: HeroSeries[]
  labels: string[]
}

export function HeroChart({ series, labels }: HeroChartProps) {
  const [visible, setVisible] = useState(() => new Set(series.map((item) => item.name)))
  const chart = useMemo(() => buildChart(series, visible), [series, visible])

  function toggle(name: string) {
    setVisible((current) => {
      const next = new Set(current)
      if (next.has(name) && next.size > 1) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            ოპერაციების ტრენდი
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            ცვლები · მანძილი · ალერტები
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <button
              className={
                visible.has(item.name)
                  ? 'inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-2.5 text-[11px] font-semibold text-[var(--color-text-primary)]'
                  : 'inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[11px] font-semibold text-[var(--color-text-tertiary)]'
              }
              key={item.name}
              onClick={() => toggle(item.name)}
              type="button"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        <svg className="h-[280px] w-full" role="img" viewBox="0 0 720 280">
          <title>Reports trend chart</title>
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              stroke="var(--color-border)"
              strokeDasharray="4 6"
              x1="36"
              x2="700"
              y1={32 + line * 56}
              y2={32 + line * 56}
            />
          ))}
          {chart.map((item) => (
            <g key={item.name}>
              <path d={item.area} fill={item.color} opacity="0.1" />
              <path
                d={item.path}
                fill="none"
                pathLength={100}
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                className="animate-[dash_900ms_ease-out]"
              />
            </g>
          ))}
          {labels.map((label, index) => {
            const step = labels.length > 1 ? 664 / (labels.length - 1) : 664
            return (
              <text
                fill="var(--color-text-tertiary)"
                fontSize="10"
                key={`label-${label}`}
                textAnchor="middle"
                x={36 + index * step}
                y="266"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

function buildChart(series: HeroSeries[], visible: Set<string>) {
  const active = series.filter((item) => visible.has(item.name))
  const max = Math.max(...active.flatMap((item) => item.points), 1)
  return active.map((item) => {
    const step = item.points.length > 1 ? 664 / (item.points.length - 1) : 664
    const coords = item.points.map((point, index) => ({
      x: 36 + index * step,
      y: 232 - (point / max) * 190,
    }))
    const path = `M ${coords.map((coord) => `${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`).join(' L ')}`
    const area = `${path} L ${coords.at(-1)?.x ?? 700} 236 L 36 236 Z`
    return { ...item, area, path }
  })
}
