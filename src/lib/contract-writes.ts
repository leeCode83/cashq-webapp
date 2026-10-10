/**
 * Fungsi tulis kontrak CashQ. Tx user terima `WalletClient` (dari hook
 * `useSignerClient`); tx owner (mint & sweep) selalu pakai `ownerClient()`
 * dari dalam — pemanggil tidak perlu tahu detailnya. Semua nominal raw.
 */
import type { Address } from 'viem'
import { parseEventLogs } from 'viem'
import { idrxAbi, vaultAbi } from './abis'
import { ownerClient, publicClient, type Signer } from './chain'
import { ADDRESSES } from './contracts'

/** Kirim transaksi lalu tunggu receipt-nya. */
async function konfirmasi(kirim: () => Promise<`0x${string}`>) {
  const hash = await kirim()
  return publicClient.waitForTransactionReceipt({ hash })
}

/** Faucet: owner mencetak IDRX mock ke sebuah wallet. */
export function mintIdrx(ke: string, jumlah: bigint) {
  const owner = ownerClient()
  return konfirmasi(() =>
    owner.writeContract({
      address: ADDRESSES.idrx,
      abi: idrxAbi,
      functionName: 'mint',
      args: [ke as Address, jumlah],
    }),
  )
}

/** Izinkan vault memotong IDRX (`approve`) — prasyarat deposit/sweep. */
export function approveIdrx(client: Signer, jumlah: bigint) {
  return konfirmasi(() =>
    client.writeContract({
      address: ADDRESSES.idrx,
      abi: idrxAbi,
      functionName: 'approve',
      args: [ADDRESSES.vault, jumlah],
    }),
  )
}

/** LP menyetor IDRX ke vault, share diterima `receiver`. */
export function depositToVault(client: Signer, assets: bigint, receiver: string) {
  return konfirmasi(() =>
    client.writeContract({
      address: ADDRESSES.vault,
      abi: vaultAbi,
      functionName: 'deposit',
      args: [assets, receiver as Address],
    }),
  )
}

/** LP menarik IDRX dari vault — demo selalu tarik ke wallet sendiri. */
export function withdrawFromVault(client: Signer, assets: bigint, alamat: string) {
  return konfirmasi(() =>
    client.writeContract({
      address: ADDRESSES.vault,
      abi: vaultAbi,
      functionName: 'withdraw',
      args: [assets, alamat as Address, alamat as Address],
    }),
  )
}

export interface PermintaanAdvance {
  /** uHash bukti zkTLS — kunci anti didanai-ganda. */
  nullifier: string
  principal: bigint
  /** Detik epoch jatuh tempo payout (informatif di kontrak). */
  dueAt: number
}

/** Kirim requestAdvance; balikannya id advance dari event `Advanced`. */
export async function requestAdvanceTx(client: Signer, m: PermintaanAdvance): Promise<bigint> {
  const receipt = await konfirmasi(() =>
    client.writeContract({
      address: ADDRESSES.vault,
      abi: vaultAbi,
      functionName: 'requestAdvance',
      args: [m.nullifier as `0x${string}`, m.principal, BigInt(m.dueAt)],
    }),
  )
  return advanceIdDariReceipt(receipt)
}

/** Id advance dari event `Advanced` pada receipt. */
export function advanceIdDariReceipt(receipt: { logs: { topics: unknown[]; data: `0x${string}` }[] }): bigint {
  const [event] = parseEventLogs({ abi: vaultAbi, eventName: 'Advanced', logs: receipt.logs as never[] })
  if (!event) throw new Error('Event Advanced tidak ditemukan di receipt')
  return event.args.id
}

/** Autodebet: owner menarik principal+fee dari wallet kreator ke vault. */
export function sweepAdvance(id: bigint | number) {
  const owner = ownerClient()
  return konfirmasi(() =>
    owner.writeContract({
      address: ADDRESSES.vault,
      abi: vaultAbi,
      functionName: 'sweep',
      args: [BigInt(id)],
    }),
  )
}
