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
  idrx: '0x1f8FdF17cB2c59a1298b123bC025E8a380Fb63c4',
  /** Registri nullifier anti didanai-ganda (baca-only dari frontend). */
  registry: '0xb1F61d9a936662d997948Fc6d150c8a49bD37CE5',
  /** Vault ERC-4626: pool LP + advance + autodebet. */
  vault: '0x74766BbF7960d61A455e45ffeA789d50E7Fe6823',
} satisfies Record<string, `0x${string}`>
