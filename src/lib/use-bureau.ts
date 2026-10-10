import { useCallback, useEffect, useState } from 'react'
import type { Snapshot } from './bureau-api'

type Status = 'idle' | 'loading' | 'error' | 'ok'

/**
 * Snapshot penilaian bureau — HANYA ditarik saat user sudah masuk (Privy),
 * dan selalu lewat rute service CashQ (`/api/bureau/snapshot`) supaya
 * pemanggilan mock YouTube terjadi di sisi server (server-to-server).
 * `akun` dipakai service memilih titik rotasi profil; `ulang()` untuk retry.
 * Status diturunkan dari state, bukan di-set di badan effect.
 */
export function useBureau(authenticated: boolean, lateCount: number, akun: string | undefined) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [gagal, setGagal] = useState(false)
  const [coba, setCoba] = useState(0)

  useEffect(() => {
    if (!authenticated) return
    let hidup = true
    const q = new URLSearchParams({ akun: akun ?? '', lateCount: String(lateCount) })
    fetch(`/api/bureau/snapshot?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error(`snapshot HTTP ${r.status}`)
        return r.json() as Promise<Snapshot>
      })
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
  }, [authenticated, lateCount, akun, coba])

  const ulang = useCallback(() => {
    setGagal(false)
    setCoba((n) => n + 1)
  }, [])

  const status: Status = !authenticated ? 'idle' : gagal ? 'error' : snapshot ? 'ok' : 'loading'
  return { status, snapshot, ulang }
}
