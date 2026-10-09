import { createContext, useContext } from 'react'
import type { Advance, LpTx, Notif } from './mock'

export interface Proof {
  schemaId: string
  proofHash: string
  nullifier: string
  sealedAt: string
  saldoFinal: number
  pajakEst: number
  limit: number
}

export interface Store {
  walletBalance: number
  advances: Advance[]
  activeAdvance: Advance | null
  proof: Proof | null
  notifs: Notif[]
  vaultTvl: number
  vaultOutstanding: number
  lpPosition: number
  lpTxs: LpTx[]
  saveProof: (p: Proof) => void
  submitAdvance: (principal: number) => Advance
  /** maju ke 21 Okt: payout masuk, autodebet berjalan, rapor tercatat */
  runPayoutSweep: (id: string) => void
  lpDeposit: (amount: number) => void
  lpWithdraw: (amount: number) => { queued: boolean }
  markAllRead: () => void
}

export const Ctx = createContext<Store | null>(null)

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore di luar StoreProvider')
  return s
}
