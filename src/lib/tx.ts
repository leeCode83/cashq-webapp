import { toast } from 'sonner'

/** jeda antar-tahap agar progres toast terbaca */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Toast loading berjalan selama aksi asinkron (tx kontrak dsb.), ditutup
 * otomatis setelah selesai — sukses maupun gagal. Balikkan hasil `fn`.
 */
export const runTx = async <T,>(label: string, steps: number, fn: () => Promise<T> | T): Promise<T | undefined> => {
  const id = toast.loading(`${label} 0/${steps}`, { duration: Infinity })
  try {
    for (let i = 1; i <= steps; i++) {
      await sleep(500)
      toast.loading(`${label} ${i}/${steps}`, { id })
    }
    return await fn()
  } finally {
    toast.dismiss(id)
  }
}
