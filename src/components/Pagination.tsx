import clsx from 'clsx'
import { fmtNum } from '../lib/format'

/** Paginasi gaya buku besar: rentang baris + nomor halaman, tombol teks. */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const nums: number[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p)
    else if (nums[nums.length - 1] !== -1) nums.push(-1)
  }

  const btn =
    'min-w-8 border border-hairline px-2 py-1 font-mono text-[12px] transition-colors hover:bg-paper-2 disabled:opacity-35 disabled:hover:bg-transparent'

  return (
    <nav className="flex items-center justify-between gap-3 pt-3" aria-label="paginasi">
      <span className="tnum font-mono text-[11.5px] text-ink-2">
        Baris {fmtNum(start)}-{fmtNum(end)} dari {fmtNum(total)}
      </span>
      <span className="flex items-center gap-1">
        <button className={btn} disabled={page === 1} onClick={() => onChange(page - 1)}>
          Sebelumnya
        </button>
        {nums.map((p, i) =>
          p === -1 ? (
            <span key={`gap${i}`} className="px-1 font-mono text-[12px] text-ink-3">
              …
            </span>
          ) : (
            <button
              key={p}
              aria-current={p === page ? 'page' : undefined}
              className={clsx(btn, p === page && 'border-ink bg-ink text-paper hover:bg-ink')}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button className={btn} disabled={page === pages} onClick={() => onChange(page + 1)}>
          Berikutnya
        </button>
      </span>
    </nav>
  )
}
