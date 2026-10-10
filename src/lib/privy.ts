import { toViemAccount, usePrivy, useSendTransaction, useWallets } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { createWalletClient, custom, toHex, type Address, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { publicClient, type Signer } from './chain'

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

/** Provider EIP-1193 minimal (MetaMask asli maupun shim buatan kita). */
type Provider1193 = {
  request: (args: { method: string; params?: readonly unknown[] | object }) => Promise<unknown>
}

/** Prioritas fee tipuan untuk tx embedded — Base Sepolia murah, 0,1 gwei lebih dari cukup. */
const PRIORITAS_TIPI = 100_000_000n

/**
 * WalletClient viem dari wallet aktif Privy — signer user untuk
 * approve/deposit/withdraw/requestAdvance. `null` sebelum wallet siap.
 *
 * Dua jalur, karena proxy wallet-API Privy menolak format EIP-1193 mentah
 * dari viem (error validasi `params.transaction.calls is required`):
 * - Wallet eksternal (MetaMask dkk.) → provider aslinya (`window.ethereum`),
 *   format standar viem langsung diterima.
 * - Wallet embedded (`privy`) → shim RPC kecil yang memetakan
 *   `eth_sendTransaction` ke hook resmi `useSendTransaction`; estimasi gas
 *   & harga gas dijawab dari publicClient supaya viem tetap happy.
 */
export function useSignerClient(): Signer | null {
  const { wallets } = useWallets()
  const { sendTransaction } = useSendTransaction()
  const wallet = wallets[0]
  const [client, setClient] = useState<Signer | null>(null)

  useEffect(() => {
    let hidup = true
    const ambil = async (): Promise<Signer | null> => {
      if (!wallet) return null
      const akun = await toViemAccount({ wallet })

      if (wallet.walletClientType !== 'privy') {
        const metamask = (window as { ethereum?: Provider1193 }).ethereum
        if (!metamask) throw new Error('Provider wallet eksternal tidak ditemukan di halaman ini')
        return createWalletClient({ account: akun, chain: baseSepolia, transport: custom(metamask) })
      }

      const shim: Provider1193 = {
        request: async (args) => {
          const p = (Array.isArray(args.params) ? args.params[0] : undefined) as
            | { from?: string; to?: string; data?: Hex; value?: bigint }
            | undefined
          switch (args.method) {
            case 'eth_chainId':
              return toHex(baseSepolia.id)
            case 'eth_gasPrice':
              return toHex(await publicClient.getGasPrice())
            case 'eth_maxPriorityFeePerGas':
              return toHex(PRIORITAS_TIPI)
            case 'eth_getTransactionCount': {
              // nonce dibaca dari node publik, 'pending' supaya tx beruntun tak tabrakan
              const alamat = (p?.from as string | undefined) ?? akun.address
              return toHex(await publicClient.getTransactionCount({ address: alamat as Address, blockTag: 'pending' }))
            }
            case 'eth_getBalance':
              return toHex(await publicClient.getBalance({ address: ((p?.from ?? akun.address) as Address) }))
            case 'eth_blockNumber':
              return toHex(await publicClient.getBlockNumber())
            case 'eth_estimateGas':
              return toHex(
                await publicClient.estimateGas({
                  account: (p?.from as Address | undefined) ?? akun,
                  to: p?.to as Address | undefined,
                  data: p?.data,
                  value: p?.value,
                }),
              )
            case 'eth_sendTransaction': {
              const { hash } = await sendTransaction({
                to: p!.to as string,
                data: p?.data as string | undefined,
                value: p?.value !== undefined ? toHex(p.value) : undefined,
                chainId: baseSepolia.id,
              })
              return hash
            }
            default:
              throw new Error(`Metode ${args.method} tidak didukung untuk wallet embedded`)
          }
        },
      }
      return createWalletClient({ account: akun, chain: baseSepolia, transport: custom(shim) })
    }

    void ambil()
      .then((c) => {
        if (!hidup) return
        // guard anti-loop: hook sendTransaction bisa ganti identitas tiap render —
        // ganti client hanya bila alamat wallet benar-benar berubah
        setClient((lama) => (lama && c && lama.account.address === c.account.address ? lama : c))
      })
      .catch((e) => {
        console.error('[privy] gagal menyiapkan signer:', e)
      })
    return () => {
      hidup = false
    }
  }, [wallet, sendTransaction])

  return client
}
