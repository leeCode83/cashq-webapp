import { useLogin } from '@privy-io/react-auth'
import type { ReactNode } from 'react'
import { Btn } from './ui'

/**
 * Pembatas konten privat: saat aktif, konten diburamkan (tidak bisa dibaca,
 * tidak interaktif, tersembunyi dari pembaca layar) dan ditutup kartu
 * "Login dulu" dengan tombol masuk Privy; saat tidak aktif konten apa adanya.
 */
export function BlurGate({ active, children }: { active: boolean; children: ReactNode }) {
  const { login } = useLogin()
  if (!active) return <>{children}</>

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none opacity-70 blur-[5px]">
        {children}
      </div>
      <div className="absolute inset-0 z-10 grid place-items-center bg-paper/60">
        <div className="border border-rule bg-paper px-6 py-5 text-center shadow-[6px_6px_0_rgb(23_25_30/0.10)]">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">Privat</p>
          <p className="mt-1.5 text-[16px] font-extrabold tracking-[-0.02em]">Login dulu</p>
          <p className="mx-auto mt-1.5 max-w-[36ch] text-[12.5px] leading-relaxed text-ink-2">
            Penilaian bureau diambil dari histori channel Anda dan hanya tampil setelah masuk.
          </p>
          <Btn variant="accent" className="mt-4" onClick={login}>
            Masuk
          </Btn>
        </div>
      </div>
    </div>
  )
}
