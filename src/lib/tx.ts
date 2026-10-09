import { toast } from 'sonner'

/** jeda simulasi proses on-chain */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** toast standar untuk aksi asinkus berjalan */
export const runTx = async (label: string, steps: number, fn: () => void) => {
  const id = toast.loading(`${label} 0/${steps}`, { duration: Infinity })
  for (let i = 1; i <= steps; i++) {
    await sleep(700)
    toast.loading(`${label} ${i}/${steps}`, { id })
  }
  fn()
}
