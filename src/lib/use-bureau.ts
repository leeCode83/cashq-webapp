import { useCallback, useEffect, useState } from 'react'
import { fetchSnapshot, type Snapshot } from './bureau-api'

type Status = 'idle' | 'loading' | 'error' | 'ok'

/**
 * Snapshot penilaian bureau — HANYA ditarik saat user sudah masuk (Privy).
 * Status diturunkan dari state, bukan di-set di badan effect:
 * `idle` = belum login (tanpa permintaan jaringan), `ulang()` untuk retry.
 */
export function useBureau(authenticated: boolean, lateCount = 0) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [gagal, setGagal] = useState(false)
  const [coba, setCoba] = useState(0)

  useEffect(() => {
    if (!authenticated) return
    let hidup = true
    fetchSnapshot(lateCount)
      .then((s) => {
        if (hidup) {
          setSnapshot(s)
          setGagal(false)
        }
      })
      .catch(() => {
        if (hidup) setGagal(true)
      })
    return () => {
      hidup = false
    }
  }, [authenticated, lateCount, coba])

  const ulang = useCallback(() => {
    setGagal(false)
    setCoba((n) => n + 1)
  }, [])

  const status: Status = !authenticated ? 'idle' : gagal ? 'error' : snapshot ? 'ok' : 'loading'
  return { status, snapshot, ulang }
}
