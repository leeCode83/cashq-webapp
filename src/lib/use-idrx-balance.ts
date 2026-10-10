import { useCallback, useEffect, useState } from 'react'
import { idrxBalance } from './contract-reads'

/**
 * Saldo IDRX onchain wallet aktif. `null` = belum terbaca (belum login atau
 * alamat kontrak belum diisi). Panggil `refresh` setelah tx mint/approve —
 * balikannya saldo terbaru supaya pemanggil bisa langsung memakainya.
 */
export function useIdrxBalance(alamat: string | undefined) {
  const [saldo, setSaldo] = useState<bigint | null>(null)

  const refresh = useCallback(async () => {
    if (!alamat) return null
    try {
      const s = await idrxBalance(alamat)
      setSaldo(s)
      return s
    } catch {
      return null // RPC gangguan — biarkan nilai lama
    }
  }, [alamat])

  // langganan saldo awal: setState di dalam callback .then, bukan di badan effect
  useEffect(() => {
    if (!alamat) return
    let hidup = true
    idrxBalance(alamat)
      .then((s) => {
        if (hidup) setSaldo(s)
      })
      .catch(() => {
        /* alamat placeholder '0x' — biarkan null */
      })
    return () => {
      hidup = false
    }
  }, [alamat])

  return { saldo, refresh }
}
