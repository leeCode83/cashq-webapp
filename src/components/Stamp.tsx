import clsx from 'clsx'

/** Stempel karet: bukti yang dicap di atas kertas. Varian hijau (sah) / merah (gagal). */
export function Stamp({
  title,
  sub,
  tone = 'ok',
  size = 'md',
  animate = true,
  className,
}: {
  title: string
  sub?: string
  tone?: 'ok' | 'bad'
  size?: 'md' | 'lg'
  animate?: boolean
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-block select-none border-[3px] px-4 py-2 text-center font-mono font-semibold uppercase leading-tight tracking-[0.14em]',
        tone === 'ok' ? 'border-green text-green-deep' : 'border-red text-red',
        size === 'md' ? 'text-[11px]' : 'text-[13px]',
        animate && 'stamp-in',
        className,
      )}
      style={{ borderRadius: 2 }}
      role="img"
      aria-label={`${title}${sub ? `, ${sub}` : ''}`}
    >
      {title}
      {sub && <span className="mt-1 block text-[9.5px] font-medium tracking-[0.1em] opacity-80">{sub}</span>}
    </span>
  )
}
