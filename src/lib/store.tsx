import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  advanceHistory,
  initialNotifs,
  lpPosition as initialLpPosition,
  lpTxs,
  sepEarnings,
  vault,
  type Advance,
  type LpTx,
  type Notif,
} from './mock'
import { fmtIDRX, pseudoHash } from './format'
import { Ctx, type Proof, type Store } from './store-ctx'

const nowIso = () => new Date().toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [walletBalance, setWallet] = useState(2_113_400)
  const [advances, setAdvances] = useState<Advance[]>(advanceHistory)
  const [proof, setProof] = useState<Proof | null>(null)
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs)
  const [vaultTvl, setTvl] = useState(vault.tvl)
  const [vaultOutstanding, setOutstanding] = useState(vault.outstanding)
  const [lpPosition, setLpPosition] = useState(initialLpPosition)
  const [lpTxsState, setLpTxs] = useState<LpTx[]>(lpTxs)

  const pushNotif = useCallback((n: Omit<Notif, 'id' | 'read'>) => {
    setNotifs((prev) => [{ ...n, id: `N-${42 + prev.length}`, read: false }, ...prev])
  }, [])

  const saveProof = useCallback((p: Proof) => setProof(p), [])

  /**
   * Catat advance baru: tambah record AKTIF, kirim principal ke wallet, jadwalkan autodebet.
   * @param principal nominal yang diterima kreator (IDRX), fee 2,75% dihitung dari sini
   * @param basis saldo final + pajak ter-attest dari bukti zkTLS — sumber angka record
   */
  const submitAdvance = useCallback(
    (principal: number, basis: Pick<Proof, 'saldoFinal' | 'pajakEst'>) => {
      const fee = Math.round(principal * 0.0275)
      const id = `ADV-09-26`
      const record: Advance = {
        id,
        earningsMonth: sepEarnings.month,
        saldoFinal: basis.saldoFinal,
        pajakEst: basis.pajakEst,
        principal,
        fee,
        sweptAt: sepEarnings.payoutAt,
        requestedAt: nowIso(),
        nullifier: pseudoHash(`${id}:${principal}`, 34),
        onTime: false,
        status: 'AKTIF',
      }
      setAdvances((prev) => [record, ...prev])
      setWallet((w) => w + principal)
      setOutstanding((o) => o + principal + fee)
      pushNotif({
        title: `${id} cair ke wallet`,
        body: `${fmtIDRX(principal)} masuk. Autodebet ${fmtIDRX(principal + fee)} dijadwalkan 21 Okt saat payout Google tiba.`,
        at: nowIso(),
        kind: 'sukses',
      })
      return record
    },
    [pushNotif],
  )

  const runPayoutSweep = useCallback(
    (id: string) => {
      const adv = advances.find((a) => a.id === id)
      if (!adv) return
      const payoutNet = adv.saldoFinal - adv.pajakEst
      setAdvances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'LUNAS', onTime: true } : a)),
      )
      setWallet((w) => w + payoutNet - (adv.principal + adv.fee))
      setOutstanding((o) => Math.max(0, o - adv.principal - adv.fee))
      pushNotif({
        title: `Payout Google diterima`,
        body: `${fmtIDRX(payoutNet)} masuk wallet, lalu autodebet ${fmtIDRX(adv.principal + adv.fee)} berjalan otomatis. Sisa payout utuh milik Anda.`,
        at: '2026-10-21T09:58:00+07:00',
        kind: 'debet',
      })
      pushNotif({
        title: `Rapor kredit diperbarui`,
        body: `Pelunasan ${id} tepat waktu tercatat on-chain.`,
        at: '2026-10-21T10:02:00+07:00',
        kind: 'sukses',
      })
    },
    [advances, pushNotif],
  )

  const lpDeposit = useCallback((amount: number) => {
    setLpPosition((p) => p + amount)
    setTvl((t) => t + amount)
    setLpTxs((prev) => [
      { id: `LP-${90 + prev.length}`, kind: 'SETOR', amount, at: nowIso(), status: 'SELESAI' },
      ...prev,
    ])
  }, [])

  const lpWithdraw = useCallback(
    (amount: number) => {
      const free = vaultTvl - vaultOutstanding
      const queued = amount > free
      setLpPosition((p) => p - amount)
      if (!queued) setTvl((t) => t - amount)
      setLpTxs((prev) => [
        { id: `LP-${90 + prev.length}`, kind: 'TARIK', amount, at: nowIso(), status: queued ? 'ANTRE' : 'SELESAI' },
        ...prev,
      ])
      return { queued }
    },
    [vaultTvl, vaultOutstanding],
  )

  const markAllRead = useCallback(
    () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true }))),
    [],
  )

  const setWalletBalance = useCallback((v: number) => setWallet(v), [])

  const value = useMemo<Store>(
    () => ({
      walletBalance,
      advances,
      activeAdvance: advances.find((a) => a.status === 'AKTIF') ?? null,
      proof,
      notifs,
      vaultTvl,
      vaultOutstanding,
      lpPosition,
      lpTxs: lpTxsState,
      saveProof,
      submitAdvance,
      runPayoutSweep,
      lpDeposit,
      lpWithdraw,
      markAllRead,
      setWalletBalance,
    }),
    [walletBalance, advances, proof, notifs, vaultTvl, vaultOutstanding, lpPosition, lpTxsState, saveProof, submitAdvance, runPayoutSweep, lpDeposit, lpWithdraw, markAllRead, setWalletBalance],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
