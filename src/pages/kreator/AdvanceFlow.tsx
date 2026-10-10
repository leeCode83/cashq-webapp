import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AmountInput, Badge, Btn, Field, Money, Rule } from '../../components/ui'
import { Stamp } from '../../components/Stamp'
import { runTx } from '../../lib/tx'
import { useStore } from '../../lib/store-ctx'
import type { Proof } from '../../lib/store-ctx'
import { FEE_RATE, MIN_ADVANCE, sepEarnings, type Advance } from '../../lib/mock'
import { fmtDate, pseudoHash, shortHash } from '../../lib/format'
import { useWalletAddress } from '../../lib/privy'
import {
  TAX_RATE_DEFAULT,
  ZK_SCHEMA_ID,
  decideFromProof,
  failReasonText,
  launchVerification,
  maxAdvance,
  verifyProof,
  type VerifyResult,
  type ZkProof,
} from '../../lib/zktls'

const SEAL_STAGES = ['Membuka TransGate & halaman AdSense', 'Memverifikasi tanda tangan bukti']

/** petakan bukti terverifikasi ke Proof store — angka dari ambang ter-attest, bukan mock */
const toStoreProof = (raw: ZkProof, v: Extract<VerifyResult, { ok: true }>): Proof => ({
  schemaId: ZK_SCHEMA_ID,
  proofHash: raw.taskId,
  nullifier: v.uHash,
  sealedAt: new Date().toISOString(),
  saldoFinal: v.floor,
  pajakEst: Math.round(v.floor * TAX_RATE_DEFAULT),
  limit: maxAdvance(v.floor),
})

export default function AdvanceFlow() {
  const { proof, saveProof, advances, submitAdvance } = useStore()
  const walletAddress = useWalletAddress()
  const [sealStage, setSealStage] = useState(-1)
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<1 | 2 | 3>(proof ? 2 : 1)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  /** bukti mentah untuk gerbang submit — terpisah dari Proof store yang sudah dipetakan */
  const [rawProof, setRawProof] = useState<ZkProof | null>(null)
  /** advance yang sedang dilihat; bertahan setelah lunas agar berita acara tetap tampil */
  const [viewedId, setViewedId] = useState<string | null>(null)

  const active = advances.find((a) => a.status === 'AKTIF') ?? null
  const shown = active ?? (viewedId ? advances.find((a) => a.id === viewedId) ?? null : null)

  const startSeal = async () => {
    setSealStage(0)
    try {
      const raw = await launchVerification(walletAddress)
      setSealStage(1)
      const v = await verifyProof(raw)
      if (!v.ok) {
        setSealStage(-1)
        toast.error('Bukti tidak sah', { description: failReasonText[v.reason] })
        return
      }
      saveProof(toStoreProof(raw, v))
      setRawProof(raw)
      setSealStage(-1)
      toast.success('Saldo final tersegel', {
        description: 'Bukti zkTLS sah dan menempel ke sesi AdSense Anda. Nullifier siap dicatat di registri.',
      })
      setStep(2)
    } catch (e) {
      setSealStage(-1)
      toast.error('Verifikasi gagal', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  /* ---------- advance aktif: status, bukan wizard ---------- */
  if (shown) return <ActiveAdvance advance={shown} />

  /* ---------- langkah 1: verifikasi ---------- */
  if (step === 1) {
    return (
      <section className="mx-auto max-w-2xl">
        <FlowHeading step={1} title="Segel saldo final lewat zkTLS" />
        <div className="border border-rule bg-paper p-6">
          <p className="text-[14px] leading-relaxed text-ink-2">
            Anda login sendiri ke halaman Pembayaran AdSense lewat sesi browser Anda.
            CashQ tidak melihat password, tidak menyimpan cookie, dan tidak membaca
            histori transaksi. Yang disegel hanya satu angka: saldo final {sepEarnings.month}
            yang sudah ditetapkan Google tanggal {fmtDate(sepEarnings.postedAt)}.
          </p>
          <Rule className="my-5" />
          <ul className="space-y-2.5">
            {SEAL_STAGES.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3 text-[13.5px]">
                <span
                  className={`w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] ${
                    sealStage === i ? 'text-green-deep font-semibold' : sealStage > i ? 'text-ink-3' : 'text-ink-3/60'
                  }`}
                >
                  {sealStage > i ? 'Selesai' : sealStage === i ? 'Jalan' : 'Antre'}
                </span>
                <span className={sealStage >= i ? 'text-ink' : 'text-ink-3'}>{s}</span>
              </li>
            ))}
          </ul>
          {sealStage >= 0 && (
            <p className="mt-5 border border-hairline bg-paper-2 px-4 py-3 font-mono text-[11px] text-ink-2">
              TransGate terbuka di tab baru. Jangan tutup sampai segel selesai.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Btn variant="accent" onClick={startSeal} disabled={sealStage >= 0}>
              {sealStage >= 0 ? 'Menyegel…' : proof ? 'Segel ulang' : 'Segel via zkTLS'}
            </Btn>
          </div>
        </div>
      </section>
    )
  }

  /* ---------- langkah 2: nominal ---------- */
  if (step === 2 && proof) {
    return (
      <section className="mx-auto max-w-2xl">
        <FlowHeading step={2} title="Tulis nominal advance" />
        <div className="border border-rule bg-paper p-6">
          <dl className="grid grid-cols-3 gap-4 text-[13px]">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">Saldo final</dt>
              <dd className="tnum mt-1 font-mono font-semibold"><Money value={proof.saldoFinal} /></dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">Pajak AS 20%</dt>
              <dd className="tnum mt-1 font-mono text-red">− <Money value={proof.pajakEst} /></dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">Batas Anda</dt>
              <dd className="tnum mt-1 font-mono font-semibold text-green-deep"><Money value={proof.limit} /></dd>
            </div>
          </dl>
          <Rule className="my-5" />
          <AmountField value={amount} onChange={setAmount} limit={proof.limit} />
        </div>
        <div className="mt-5 flex justify-between gap-3">
          <Btn variant="ghost" onClick={() => setStep(1)}>Kembali</Btn>
          <Btn
            variant="accent"
            onClick={() => setStep(3)}
            disabled={!parseAmount(amount, proof.limit).ok}
          >
            Lanjut ke konfirmasi
          </Btn>
        </div>
      </section>
    )
  }

  /* ---------- langkah 3: konfirmasi ---------- */
  const parsed = parseAmount(amount, proof?.limit ?? sepEarnings.limit)
  const n = parsed.value
  const fee = Math.round(n * FEE_RATE)
  const payoutNet = sepEarnings.saldoFinal - sepEarnings.pajakEst

  return (
    <section className="mx-auto max-w-2xl">
      <FlowHeading step={3} title="Tanda tangan dan cairkan" />
      <div className="border border-rule bg-paper p-6">
        <dl className="space-y-2.5 text-[14px]">
          {[
            ['Nominal advance', <Money value={n} />],
            ['Fee 2,75% sekali', <span className="text-red">− <Money value={fee} /></span>],
            ['Diterima hari ini', <span className="font-semibold"><Money value={n} /></span>],
            ['Autodebet 21 Okt', <Money value={n + fee} />],
          ].map(([k, v], i) => (
            <div
              key={String(k)}
              className={`flex items-baseline justify-between gap-4 ${i === 2 ? 'border-t border-hairline pt-2.5' : ''}`}
            >
              <dt className="text-ink-2">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <Rule className="my-5" />
        <p className="text-[12.5px] leading-relaxed text-ink-2">
          Payout Google diproyeksikan <Money value={payoutNet} /> (setelah pajak). Setelah autodebet,
          sisa <Money value={payoutNet - n - fee} className="font-semibold text-green-deep" /> tetap milik Anda.
          Nullifier <span className="tnum font-mono text-ink">{shortHash(pseudoHash(`ADV-09-26:${n}`, 20))}</span> mencegah
          payout ini didanai dua kali.
        </p>
        <label className="mt-5 flex cursor-pointer items-start gap-3 border border-hairline bg-paper-2 p-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[#1e5c44]"
          />
          <span className="text-[12.5px] leading-relaxed text-ink-2">
            Saya menyetujui syarat layanan: menjaga ketersediaan dana untuk autodebet pelunasan,
            dan memahami kewajiban serta hak saya atas rapor kredit.
          </span>
        </label>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <Btn variant="ghost" onClick={() => setStep(2)} disabled={busy}>Kembali</Btn>
          <Btn
            variant="accent"
            disabled={!agreed || busy}
            onClick={async () => {
              setBusy(true)
              /* gerbang trust boundary: keputusan hanya dari proof yang diverifikasi ulang */
              const d = rawProof ? await decideFromProof(rawProof, n) : null
              if (!d || !d.approved) {
                setBusy(false)
                const why =
                  d?.reason === 'melebihi-batas'
                    ? `Melebihi batas cair. Maksimum IDRX ${d.max.toLocaleString('id-ID')} (90% saldo setelah pajak).`
                    : failReasonText['bentuk-bukti-tidak-valid']
                toast.error('Advance tidak disetujui', { description: why })
                return
              }
              await runTx('Menulis advance on-chain', 3, () => {})
              /* proof pasti ada: langkah 3 hanya dicapai dari langkah 2 yang menuntut proof */
              const rec = submitAdvance(n, proof!)
              setViewedId(rec.id)
              toast.success(`${rec.id} cair ke wallet`, {
                description: 'Saldo wallet Anda sudah diperbarui. Pelunasan otomatis dijadwalkan 21 Okt.',
              })
              setBusy(false)
            }}
          >
            {busy ? 'Memproses…' : 'Tanda tangan dan cairkan'}
          </Btn>
        </div>
      </div>
    </section>
  )
}

/* ---------- input nominal + validasi ---------- */

function parseAmount(raw: string, limit: number): { ok: boolean; value: number; error?: string } {
  const t = raw.replace(/\s|IDRX/gi, '').replace(/\./g, '')
  if (!t) return { ok: false, value: 0, error: '' }
  if (!/^\d+$/.test(t)) return { ok: false, value: 0, error: 'Nominal hanya angka.' }
  const v = Number(t)
  if (v < MIN_ADVANCE) return { ok: false, value: v, error: `Minimal advance IDRX ${MIN_ADVANCE.toLocaleString('id-ID')}.` }
  if (v > limit)
    return { ok: false, value: v, error: `Melebihi batas Anda. Maksimum IDRX ${limit.toLocaleString('id-ID')} (90% saldo setelah pajak).` }
  return { ok: true, value: v }
}

function AmountField({ value, onChange, limit }: { value: string; onChange: (v: string) => void; limit: number }) {
  const parsed = parseAmount(value, limit)
  const setPct = (p: number) => onChange(String(Math.round((limit * p) / 100 / 1000) * 1000))
  return (
    <div>
      <Field
        label="Nominal yang diterima hari ini"
        error={parsed.error || undefined}
        hint="Angka bulat Rupiah. Fee dihitung dari nominal ini."
      >
        <AmountInput
          className="input-line tnum w-full max-w-xs font-mono text-[20px] font-semibold"
          value={value}
          aria-invalid={!parsed.ok && value !== ''}
          onValueChange={onChange}
        />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        {[50, 70, 90].map((p) => (
          <button
            key={p}
            className="border border-hairline px-3 py-1 font-mono text-[11px] hover:bg-paper-2"
            onClick={() => setPct(p)}
          >
            {p}% batas
          </button>
        ))}
      </div>
      {parsed.ok && (
        <dl className="mt-5 space-y-2 border-t border-hairline pt-4 text-[13.5px]">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Fee 2,75% sekali</dt>
            <dd><Money value={Math.round(parsed.value * FEE_RATE)} className="text-red" /></dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Autodebet {fmtDate(sepEarnings.payoutAt)}</dt>
            <dd><Money value={parsed.value + Math.round(parsed.value * FEE_RATE)} /></dd>
          </div>
        </dl>
      )}
    </div>
  )
}

/* ---------- heading alur ---------- */

function FlowHeading({ step, title }: { step: 1 | 2 | 3; title: string }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
        Langkah {step} dari 3 · {['verifikasi', 'nominal', 'konfirmasi'][step - 1]}
      </p>
      <h2 className="mt-2 text-[clamp(1.4rem,2.6vw,1.9rem)] font-extrabold tracking-[-0.025em]">{title}</h2>
      <div className="mt-4 flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((s) => (
          <span key={s} className={`h-[3px] flex-1 ${s <= step ? 'bg-green' : 'bg-hairline'}`} />
        ))}
      </div>
    </div>
  )
}

/* ---------- advance aktif + autodebet ---------- */

function ActiveAdvance({ advance }: { advance: Advance }) {
  const { runPayoutSweep } = useStore()
  const [phase, setPhase] = useState<'menunggu' | 'jalan' | 'lunas'>('menunggu')
  const payoutNet = advance.saldoFinal - advance.pajakEst
  const debit = advance.principal + advance.fee

  const warp = async () => {
    setPhase('jalan')
    await runTx('Payout Google masuk wallet', 2, () => {})
    await runTx('Autodebet pelunasan berjalan', 2, () => {})
    runPayoutSweep(advance.id)
    toast.success('Advance lunas', {
      description: 'Autodebet selesai. Rapor tepat waktu ke-12 tercatat on-chain.',
    })
    setPhase('lunas')
  }

  const stops = useMemo(
    () => [
      { label: 'Dana cair', detail: <Money value={advance.principal} />, done: true },
      { label: 'Menunggu payout Google', detail: fmtDate(advance.sweptAt), done: phase !== 'menunggu' },
      { label: 'Autodebet pelunasan', detail: <Money value={debit} />, done: phase === 'lunas' },
      { label: 'Rapor tepat waktu tercatat', detail: 'on-chain', done: phase === 'lunas' },
    ],
    [advance.principal, advance.sweptAt, debit, phase],
  )

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
            Status advance · {advance.earningsMonth}
          </p>
          <h2 className="mt-1 text-[clamp(1.4rem,2.6vw,1.9rem)] font-extrabold tracking-[-0.025em]">
            {advance.id}
          </h2>
        </div>
        {phase === 'lunas' ? <Badge tone="ok">Lunas</Badge> : <Badge tone="ink">Aktif</Badge>}
      </div>

      <div className="border border-rule bg-paper p-6">
        <ol className="space-y-0">
          {stops.map((s, i) => (
            <li key={s.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1.5 size-2.5 shrink-0 border ${s.done ? 'border-green bg-green' : 'border-rule bg-paper'}`}
                  aria-hidden="true"
                />
                {i < stops.length - 1 && <span className="w-px flex-1 bg-hairline" aria-hidden="true" />}
              </div>
              <div className={`flex flex-1 items-baseline justify-between gap-4 pb-6 ${s.done ? '' : 'opacity-55'}`}>
                <p className="text-[14px] font-semibold">{s.label}</p>
                <p className="tnum font-mono text-[13px] text-ink-2">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {phase === 'menunggu' && (
          <>
            <Rule className="my-2" />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <p className="max-w-[40ch] text-[12.5px] leading-relaxed text-ink-2">
                Autodebet berjalan otomatis saat payout Google mendarat. Tidak ada tindakan
                yang perlu Anda lakukan.
              </p>
              <Btn variant="ghost" onClick={warp}>Lompat ke 21 Okt</Btn>
            </div>
          </>
        )}
      </div>

      {phase === 'lunas' && (
        <div className="relative mt-8 border border-rule bg-paper p-6 shadow-[6px_6px_0_rgb(23_25_30/0.10)]">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
              Berita acara pelunasan
            </p>
            <Stamp title="Lunas" sub="tepat waktu" />
          </div>
          <dl className="mt-4 space-y-2.5 text-[14px]">
            {[
              ['Payout Google diterima', <Money value={payoutNet} />],
              ['Autodebet advance + fee', <span className="text-red">− <Money value={debit} /></span>],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-2">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-hairline pt-2.5">
              <dt className="font-semibold">Sisa payout milik Anda</dt>
              <dd><Money value={payoutNet - debit} className="font-semibold text-green-deep" /></dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  )
}
