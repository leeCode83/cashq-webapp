import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { createWalletClient, custom, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'
import { type Signer } from './chain'

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

/**
 * WalletClient viem dari wallet aktif Privy — signer user untuk
 * approve/deposit/withdraw/requestAdvance. `null` sebelum wallet siap.
 * Jalur resmi docs v3: getEthereumProvider + custom transport.
 */
export function useSignerClient(): Signer | null {
  const { wallets } = useWallets()
  const wallet = wallets[0]
  const [client, setClient] = useState<Signer | null>(null)

  useEffect(() => {
    let hidup = true
    const ambil = async (): Promise<Signer | null> => {
      if (!wallet) return null
      const provider = await wallet.getEthereumProvider()
      return createWalletClient({
        account: wallet.address as Address,
        chain: baseSepolia,
        transport: custom(provider),
      })
    }

    void ambil()
      .then((c) => {
        if (!hidup) return
        // guard anti-loop: ganti client hanya bila alamat wallet berubah
        setClient((lama) => (lama && c && lama.account.address === c.account.address ? lama : c))
      })
      .catch((e) => {
        console.error('[privy] gagal menyiapkan signer:', e)
      })
    return () => {
      hidup = false
    }
  }, [wallet])

  return client
}
