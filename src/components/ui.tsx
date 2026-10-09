import clsx from 'clsx'
import { Link } from 'react-router-dom'

/** Wordmark CashQ: "Cash" grotesk + glyph Q digambar sendiri, ekornya panah lompat antre. */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={clsx('inline-flex items-baseline gap-[0.03em] leading-none', className)}>
      {!markOnly && <span className="font-extrabold tracking-[-0.04em]">Cash</span>}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="inline-block h-[0.92em] w-[0.92em] translate-y-[0.02em]"
      >
        <circle cx="46" cy="46" r="33" fill="none" stroke="currentColor" strokeWidth="16" />
        {/* ekor Q = panah: uang lompat antre */}
        <path d="M58 58 L96 96" stroke="currentColor" strokeWidth="16" strokeLinecap="square" />
        <path d="M74 96 L96 96 L96 74" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="square" />
      </svg>
    </span>
  )
}

/** tautan internal bergaya tombol; konsisten satu sistem */
export function Btn({
  to,
  href,
  variant = 'primary',
  className,
  children,
  ...rest
}: {
  to?: string
  href?: string
  variant?: 'primary' | 'accent' | 'ghost'
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = clsx(
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold tracking-wide',
    'transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green',
    variant === 'primary' && 'bg-ink text-paper hover:bg-ink-2',
    variant === 'accent' && 'bg-green text-paper hover:bg-green-deep',
    variant === 'ghost' && 'border border-rule text-ink hover:bg-paper-2',
    className,
  )
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

/** label status: teks mono kecil di atas tint pucat; merah hanya semantik */
export function Badge({ tone, children }: { tone: 'ok' | 'bad' | 'calm' | 'ink'; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-[3px] font-mono text-[10.5px] font-medium uppercase tracking-[0.08em]',
        tone === 'ok' && 'bg-green-tint text-green-deep',
        tone === 'bad' && 'bg-red-tint text-red',
        tone === 'calm' && 'bg-paper-3 text-ink-2',
        tone === 'ink' && 'bg-ink text-paper',
      )}
    >
      {children}
    </span>
  )
}

/** uang statis di tabel: mono tabular, tanpa animasi (dibaca, bukan ditonton) */
export function Money({ value, className, signed = false }: { value: number; className?: string; signed?: boolean }) {
  return (
    <span className={clsx('tnum font-mono', className)}>
      {signed && (value > 0 ? '+' : value < 0 ? '−' : '')}
      IDRX {Math.abs(Math.round(value)).toLocaleString('id-ID')}
    </span>
  )
}

/** garis struktur: hairline tunggal atau rule tebal gaya koran */
export function Rule({ strong = false, className }: { strong?: boolean; className?: string }) {
  return <div className={clsx(strong ? 'h-px bg-rule' : 'h-px bg-hairline', className)} aria-hidden="true" />
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink-2">
        {label}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-[12.5px] text-red">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[12.5px] text-ink-3">{hint}</span>
      ) : null}
    </label>
  )
}
