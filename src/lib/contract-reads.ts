/**
 * Fungsi baca kontrak CashQ — semua gratis (view), hasil mentah bigint
 * unit kontrak. Konversi ke rupiah lewat `idr()` di lapisan UI.
 */
import type { Address } from 'viem'
import { idrxAbi, registryAbi, vaultAbi } from './abis'
import { publicClient } from './chain'
import { ADDRESSES } from './contracts'

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
