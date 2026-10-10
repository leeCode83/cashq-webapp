import { useEffect } from 'react'
import clsx from 'clsx'

/**
 * Modal kertas gaya ledger: overlay redup + kartu bergaris dengan bayangan
 * offset. Tutup dengan Escape atau klik area luar; klik kartu tidak menutup.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx('w-full max-w-md border border-rule bg-paper', 'shadow-[8px_8px_0_rgb(23_25_30/0.22)]')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-rule px-6 py-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-2">{title}</p>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
