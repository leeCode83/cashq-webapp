import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { mintIdrx, pesanError } from '../lib/contract-writes'
import { useIdrxBalance } from '../lib/use-idrx-balance'
import { useWalletAddress } from '../lib/privy'
import { useStore } from '../lib/store-ctx'
import { idr, raw } from '../lib/units'
import { Modal } from './Modal'
import { Btn } from './ui'

/** Nominal faucet per mint (IDRX). */
export const FAUCET_IDRX = 50_000_000
const FAUCET_RAW = raw(FAUCET_IDRX)

/**
 * Popup faucet: wallet login tanpa IDRX → tawarkan mint 50 juta IDRX
 * (tx ditandatangani wallet owner). Dipasang sekali per halaman di dalam
 * StoreProvider; saldo juga disinkron ke store untuk tampilan header.
 */
export function FaucetGate() {
  const alamat = useWalletAddress()
  const { saldo, refresh } = useIdrxBalance(alamat)
  const { setWalletBalance } = useStore()
  // tunda per wallet, bukan global — ganti wallet = popup muncul lagi
  const [tundaAlamat, setTundaAlamat] = useState<string | null>(null)
  const [jalan, setJalan] = useState(false)

  // sinkron saldo store ← chain (header & kartu wallet membaca store)
  useEffect(() => {
    if (saldo !== null) setWalletBalance(idr(saldo))
  }, [saldo, setWalletBalance])

  const mint = async () => {
    if (!alamat) return
    setJalan(true)
    try {
      await mintIdrx(alamat, FAUCET_RAW)
      await refresh()
      toast.success(`${FAUCET_IDRX.toLocaleString('id-ID')} IDRX masuk`, {
        description: 'Faucet demo — uang mainan untuk mencoba CashQ.',
      })
    } catch (e) {
      toast.error(pesanError(e))
    } finally {
      setJalan(false)
    }
  }

  const terbuka = saldo === 0n && tundaAlamat !== alamat
  return (
    <Modal open={terbuka} onClose={() => setTundaAlamat(alamat ?? null)} title="Wallet kosong">
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        Wallet ini belum punya IDRX. Cetak dana demo lewat faucet — uang mainan untuk
        mencoba pool, advance, dan autodebet CashQ tanpa risiko.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <Btn variant="ghost" onClick={() => setTundaAlamat(alamat ?? null)}>
          Nanti saja
        </Btn>
        <Btn variant="accent" onClick={mint} disabled={jalan}>
          {jalan ? 'Mencetak…' : `Mint ${FAUCET_IDRX.toLocaleString('id-ID')} IDRX`}
        </Btn>
      </div>
    </Modal>
  )
}
