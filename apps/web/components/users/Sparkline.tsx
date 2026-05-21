interface SparklineProps {
  points: number[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({
  points,
  width = 88,
  height = 28,
  color = 'var(--color-accent)',
}: SparklineProps) {
  const values = points.length > 0 ? points : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  const step = values.length > 1 ? width / (values.length - 1) : width
  const coords = values.map((value, index) => ({
    x: index * step,
    y: height - ((value - min) / range) * (height - 6) - 3,
  }))
  const line = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area = `M 0 ${height} L ${coords
    .map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' L ')} L ${width} ${height} Z`

  return (
    <svg
      aria-hidden="true"
      className="block"
      height={height}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <path d={area} fill={color} opacity="0.12" />
      <polyline
        fill="none"
        pathLength={100}
        points={line}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}
