/** Grafik garis hairline di atas kertas; nilai langsung dilabeli, tanpa legenda. */
export function Sparkline({
  values,
  labels,
  className,
  height = 96,
}: {
  values: number[]
  labels?: string[]
  className?: string
  height?: number
}) {
  const w = 320
  const h = height
  const pad = 6
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return [x, y] as const
  })
  const path = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="tren enam bulan">
        {/* garis dasar hairline */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--color-hairline)" strokeWidth="1" />
        <polyline points={path} fill="none" stroke="var(--color-green)" strokeWidth="2" />
        <circle cx={lx} cy={ly} r="3.5" fill="var(--color-green)" />
      </svg>
      {labels && (
        <figcaption className="mt-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </figcaption>
      )}
    </figure>
  )
}
