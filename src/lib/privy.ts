import { usePrivy, useWallets } from '@privy-io/react-auth'

/**
 * Alamat wallet EVM aktif dari Privy: embedded wallet bila sudah tercipta,
 * lalu akun wallet tertaut. `undefined` sebelum user masuk — pemanggil
 * yang memutuskan fallback tampilannya (umumnya alamat mock).
 */
export function useWalletAddress(): string | undefined {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  return wallets[0]?.address ?? user?.wallet?.address
}
