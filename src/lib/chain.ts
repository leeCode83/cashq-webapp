/**
 * Transport kontrak: satu publicClient untuk semua baca + walletClient
 * owner (dari `VITE_OWNER_PRIVATE_KEY`) untuk mint faucet & sweep.
 * Aman testnet — jangan pernah isi wallet beraset sungguhan.
 */
import { createPublicClient, createWalletClient, http } from 'viem'
import type { Account, Chain, Transport, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { OWNER_RPC_URL } from './contracts'

/** Client baca-only Base Sepolia. */
export const publicClient = createPublicClient({ chain: baseSepolia, transport: http(OWNER_RPC_URL) })

/** WalletClient yang sudah terikat akun — signer user (Privy) maupun owner. */
export type Signer = WalletClient<Transport, Chain, Account>

/** WalletClient owner — error jelas bila kunci belum diisi di .env. */
export function ownerClient() {
  const kunci = import.meta.env.VITE_OWNER_PRIVATE_KEY as `0x${string}` | ''
  if (!kunci) throw new Error('VITE_OWNER_PRIVATE_KEY kosong — isi .env dulu (lihat .env.example)')
  return createWalletClient({ account: privateKeyToAccount(kunci), chain: baseSepolia, transport: http(OWNER_RPC_URL) })
}
