/**
 * Fungsi baca kontrak CashQ — semua gratis (view), hasil mentah bigint
 * unit kontrak. Konversi ke rupiah lewat `idr()` di lapisan UI.
 */
import type { Address } from 'viem'
import { idrxAbi, registryAbi, vaultAbi } from './abis'
import { publicClient } from './chain'
import { ADDRESSES } from './contracts'
import { monthLabel } from './format'
import type { Advance } from './mock'
import { idr } from './units'

/** Saldo IDRX wallet (unit mentah). */
export function idrxBalance(alamat: string) {
  return publicClient.readContract({
    address: ADDRESSES.idrx,
    abi: idrxAbi,
    functionName: 'balanceOf',
    args: [alamat as Address],
  })
}

/** True bila payout (nullifier uHash zkTLS) sudah pernah didanai. */
export function isUsed(nullifier: string) {
  return publicClient.readContract({
    address: ADDRESSES.registry,
    abi: registryAbi,
    functionName: 'isUsed',
    args: [nullifier as `0x${string}`],
  })
}

export interface VaultStats {
  totalAssets: bigint
  outstanding: bigint
  /** totalAssets − outstanding = likuiditas bebas. */
  freeLiquidity: bigint
}

/** TVL pool + utang berjalan + likuiditas bebas. */
export async function vaultStats(): Promise<VaultStats> {
  const [totalAssets, outstanding] = await Promise.all([
    publicClient.readContract({ address: ADDRESSES.vault, abi: vaultAbi, functionName: 'totalAssets' }),
    publicClient.readContract({ address: ADDRESSES.vault, abi: vaultAbi, functionName: 'outstanding' }),
  ])
  return { totalAssets, outstanding, freeLiquidity: totalAssets - outstanding }
}

/** Posisi LP dalam IDRX (share → aset lewat convertToAssets). */
export async function lpPositionOf(alamat: string): Promise<bigint> {
  const shares = await publicClient.readContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: [alamat as Address],
  })
  return publicClient.readContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'convertToAssets',
    args: [shares],
  })
}

/** Advance versi kontrak — raw; peta ke tipe UI di lapisan pemakai. */
export interface OnchainAdvance {
  id: number
  creator: Address
  nullifier: `0x${string}`
  principal: bigint
  fee: bigint
  /** Detik epoch jatuh tempo payout (informatif). */
  dueAt: bigint
  swept: boolean
}

/** Semua advance milik satu kreator (aktif + lunas). */
// ponytail: loop N+1 readContract — multicall kalau jumlah advance membengkak
export async function advancesOf(who: string): Promise<OnchainAdvance[]> {
  const ids = await publicClient.readContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'advanceIdsOf',
    args: [who as Address],
  })
  return Promise.all(
    ids.map(async (id) => {
      const [creator, nullifier, principal, fee, dueAt, swept] = await publicClient.readContract({
        address: ADDRESSES.vault,
        abi: vaultAbi,
        functionName: 'advances',
        args: [id],
      })
      return { id: Number(id), creator, nullifier, principal, fee, dueAt, swept }
    }),
  )
}

/** Rapor kredit: riwayat pelunasan (advanceId, jumlah, waktu). */
export function creditOf(who: string) {
  return publicClient.readContract({
    address: ADDRESSES.vault,
    abi: vaultAbi,
    functionName: 'getCredit',
    args: [who as Address],
  })
}

/** Baris rapor pelunasan — diakses posisi (nama komponen tak dijamin parser). */
export interface BarisRapor {
  advanceId: bigint
  amount: bigint
  at: bigint
}

/**
 * Peta advance on-chain → record UI. `saldoFinal`/`pajakEst` tidak ada di
 * kontrak (milik bukti zkTLS) → nol untuk record yang tidak lewat wizard.
 * earningsMonth diambil dari dueAt: payout tgl 21 = penghasilan bulan sebelumnya.
 */
export function toUiAdvance(a: OnchainAdvance, rapor: readonly BarisRapor[]): Advance {
  const lunas = rapor.find((r) => Number(r.advanceId) === a.id)
  const payout = new Date(Number(a.dueAt) * 1000)
  const bulanSebelum = new Date(payout.getFullYear(), payout.getMonth() - 1, 1).toISOString()
  return {
    id: `ADV-${String(a.id).padStart(2, '0')}`,
    onchainId: a.id,
    earningsMonth: monthLabel(bulanSebelum),
    saldoFinal: 0,
    pajakEst: 0,
    principal: idr(a.principal),
    fee: idr(a.fee),
    sweptAt: (lunas ? new Date(Number(lunas.at) * 1000) : payout).toISOString(),
    requestedAt: payout.toISOString(),
    nullifier: a.nullifier,
    onTime: Boolean(lunas),
    status: a.swept ? 'LUNAS' : 'AKTIF',
  }
}
