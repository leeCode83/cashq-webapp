/**
 * Alamat kontrak CashQ di Base Sepolia (chainId 84532).
 *
 * ISI DI SINI — satu-satunya file alamat yang perlu diubah.
 * Salin dari `cashq-sc/exports/addresses.json` (repo kontrak), lalu simpan.
 */

/** RPC publik untuk transaksi wallet owner (mint faucet & sweep). */
export const OWNER_RPC_URL = 'https://sepolia.base.org'

export const ADDRESSES = {
  /** Mock stablecoin rupiah, 6 desimal. */
  idrx: '0x',
  /** Registri nullifier anti didanai-ganda (baca-only dari frontend). */
  registry: '0x',
  /** Vault ERC-4626: pool LP + advance + autodebet. */
  vault: '0x',
} satisfies Record<string, `0x${string}`>
