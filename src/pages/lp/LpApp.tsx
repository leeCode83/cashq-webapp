import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import NumberFlow from '@number-flow/react'
import { toast } from 'sonner'
import { AmountInput, Badge, Btn, Field, Logo, Money, Rule } from '../../components/ui'
import { Pagination } from '../../components/Pagination'
import { Sparkline } from '../../components/Sparkline'
import { StoreProvider } from '../../lib/store'
import { useStore } from '../../lib/store-ctx'
import { runTx } from '../../lib/tx'
import { lp, sweeps, vault, type LpTx } from '../../lib/mock'
import { fmtDate } from '../../lib/format'

const PAGE_SIZE = 6
const MIN_TX = 1_000_000

export default function LpApp() {
  return (
    <StoreProvider>
      <VaultShell />
    </StoreProvider>
  )
}

function VaultShell() {
  const { vaultTvl, vaultOutstanding, lpPosition } = useStore()
  const utilization = (vaultOutstanding / vaultTvl) * 100
  const freeLiquidity = vaultTvl - vaultOutstanding

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-5">
            <Link to="/" className="text-[18px] text-ink" aria-label="CashQ, ke beranda">
              <Logo />
            </Link>
            <span className="hidden truncate text-[13px] text-ink-2 sm:block">
              Vault IDRX · {lp.name}
            </span>
          </div>
          <Badge tone="ok">ERC-4626 · terbuka</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* strip statistik vault */}
        <section className="grid grid-cols-1 gap-px border border-rule bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Dana terkelola</p>
            <NumberFlow
              value={vaultTvl}
              locales="id-ID"
              prefix="IDRX "
              className="tnum mt-2 font-mono text-[19px] font-semibold"
            />
          </div>
          <div className="bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Sedang beredar</p>
            <NumberFlow
              value={vaultOutstanding}
              locales="id-ID"
              prefix="IDRX "
              className="tnum mt-2 font-mono text-[19px] font-semibold"
            />
          </div>
          <div className="bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Utilization</p>
            <p className="tnum mt-2 font-mono text-[19px] font-semibold">
              {utilization.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
            </p>
          </div>
          <div className="bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Yield annualized</p>
            <p className="tnum mt-2 font-mono text-[19px] font-semibold text-green-deep">
              {vault.apy.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
            </p>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* kolom kiri: posisi + yield + setor/tarik */}
          <div className="space-y-8 lg:col-span-7">
            <section className="border border-ink bg-ink p-6 text-paper">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-paper/60">
                Posisi Anda · {lp.wallet} · sejak {lp.since}
              </p>
              <NumberFlow
                value={lpPosition}
                locales="id-ID"
                prefix="IDRX "
                className="tnum mt-2 font-mono text-[28px] font-semibold"
              />
              <p className="mt-3 text-[12.5px] text-paper/60">
                Bagian fee advance dibayar tiap awal bulan. Likuiditas bebas pool saat ini{' '}
                <span className="tnum font-mono">IDRX {freeLiquidity.toLocaleString('id-ID')}</span>.
              </p>
            </section>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <DepositForm />
              <WithdrawForm position={lpPosition} freeLiquidity={freeLiquidity} />
            </div>

            <section className="border border-rule bg-paper p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[15px] font-bold">Yield 6 bulan</h2>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                  Fee advance, bukan trading
                </p>
              </div>
              <Sparkline
                values={vault.yieldHistory}
                labels={vault.yieldMonths}
                className="mt-4"
                height={80}
              />
            </section>
          </div>

          {/* kolom kanan: arus waterfall */}
          <div className="lg:col-span-5">
            <section className="border border-rule bg-paper p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[15px] font-bold">Arus waterfall</h2>
                <Badge tone="ok">Sweep 21 s/d 26 Okt</Badge>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                Autodebet kreator mengalir balik ke pool setiap payout Google mendarat.
              </p>
              <Rule className="my-4" />
              <ul className="divide-y divide-hairline">
                {sweeps.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{s.creator}</p>
                      <p className="truncate font-mono text-[10.5px] text-ink-3">
                        {s.channel} · {s.earningsMonth} · {fmtDate(s.sweptAt)}
                      </p>
                    </div>
                    <Money value={s.amount} className="shrink-0 text-[12.5px]" />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <RiwayatTx />
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <span className="text-[15px] text-ink-2">
            <Logo />
          </span>
          <p className="font-mono text-[10.5px] text-ink-3">
            Aturan pool adalah kontrak · setiap sweep terbaca publik
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- form setor / tarik ---------- */

function parseAmount(raw: string): { ok: boolean; value: number; error?: string } {
  const t = raw.replace(/\s|IDRX/gi, '').replace(/\./g, '')
  if (!t) return { ok: false, value: 0, error: '' }
  if (!/^\d+$/.test(t)) return { ok: false, value: 0, error: 'Nominal hanya angka.' }
  const v = Number(t)
  if (v < MIN_TX) return { ok: false, value: v, error: `Minimal IDRX ${MIN_TX.toLocaleString('id-ID')}.` }
  return { ok: true, value: v }
}

function DepositForm() {
  const { lpDeposit } = useStore()
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = parseAmount(raw)

  return (
    <section className="border border-rule bg-paper p-6">
      <h2 className="text-[15px] font-bold">Setor ke vault</h2>
      <Rule className="my-4" />
      <Field
        label="Nominal setoran (IDRX)"
        error={parsed.error || undefined}
        hint="Mint share ERC-4626 pada harga pool saat ini."
      >
        <AmountInput
          className="input-line tnum w-full font-mono text-[18px] font-semibold"
          value={raw}
          aria-invalid={!parsed.ok && raw !== ''}
          onValueChange={setRaw}
        />
      </Field>
      <Btn
        variant="accent"
        className="mt-5 w-full"
        disabled={!parsed.ok || busy}
        onClick={async () => {
          setBusy(true)
          await runTx('Menyetor ke vault', 2, () => {})
          lpDeposit(parsed.value)
          toast.success('Setoran tercatat', {
            description: `IDRX ${parsed.value.toLocaleString('id-ID')} masuk vault. Share baru sudah di-mint.`,
          })
          setRaw('')
          setBusy(false)
        }}
      >
        {busy ? 'Memproses…' : 'Setor sekarang'}
      </Btn>
    </section>
  )
}

function WithdrawForm({ position, freeLiquidity }: { position: number; freeLiquidity: number }) {
  const { lpWithdraw } = useStore()
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = parseAmount(raw)
  const overPosition = parsed.ok && parsed.value > position
  const overLiquidity = parsed.ok && !overPosition && parsed.value > freeLiquidity

  const error = overPosition
    ? `Melebihi posisi Anda (IDRX ${position.toLocaleString('id-ID')}).`
    : parsed.error || undefined

  return (
    <section className="border border-rule bg-paper p-6">
      <h2 className="text-[15px] font-bold">Tarik dari vault</h2>
      <Rule className="my-4" />
      <Field
        label="Nominal penarikan (IDRX)"
        error={error}
        hint={
          overLiquidity
            ? undefined
            : `Posisi IDRX ${position.toLocaleString('id-ID')} · likuiditas bebas IDRX ${freeLiquidity.toLocaleString('id-ID')}.`
        }
      >
        <AmountInput
          className="input-line tnum w-full font-mono text-[18px] font-semibold"
          value={raw}
          aria-invalid={(!parsed.ok && raw !== '') || overPosition}
          onValueChange={setRaw}
        />
      </Field>
      {overLiquidity && (
        <p className="mt-2 border border-hairline bg-paper-2 px-3 py-2 text-[12px] leading-snug text-ink-2">
          Melebihi likuiditas bebas pool. Penarikan tetap bisa dilakukan dan akan diproses
          di sweep tanggal 21 Okt berikutnya.
        </p>
      )}
      <Btn
        variant="primary"
        className="mt-5 w-full"
        disabled={!parsed.ok || overPosition || busy}
        onClick={async () => {
          setBusy(true)
          await runTx('Menarik dari vault', 2, () => {})
          const { queued } = lpWithdraw(parsed.value)
          if (queued) {
            toast.info('Penarikan masuk antrean sweep', {
              description: 'Likuiditas pool sedang dipakai advance berjalan. Dana keluar setelah sweep 21 Okt.',
            })
          } else {
            toast.success('Penarikan tercatat', {
              description: `IDRX ${parsed.value.toLocaleString('id-ID')} dikirim ke wallet Anda.`,
            })
          }
          setRaw('')
          setBusy(false)
        }}
      >
        {busy ? 'Memproses…' : 'Tarik sekarang'}
      </Btn>
    </section>
  )
}

/* ---------- riwayat transaksi LP ---------- */

function RiwayatTx() {
  const { lpTxs } = useStore()
  const [page, setPage] = useState(1)
  const rows = useMemo(() => {
    const sorted = [...lpTxs].sort((a, b) => b.at.localeCompare(a.at))
    return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [lpTxs, page])

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">Riwayat transaksi</h2>
        <p className="font-mono text-[11px] text-ink-3">{lpTxs.length} entri sejak Mar 2025</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-rule text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
              <th className="py-3 pr-4 font-medium">ID</th>
              <th className="py-3 pr-4 font-medium">Jenis</th>
              <th className="py-3 pr-4 text-right font-medium">Nominal</th>
              <th className="py-3 pr-4 font-medium">Waktu</th>
              <th className="py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t: LpTx) => (
              <tr key={t.id} className="border-b border-hairline hover:bg-paper-2/60">
                <td className="tnum py-3.5 pr-4 font-mono">{t.id}</td>
                <td className="py-3.5 pr-4">
                  <Badge tone={t.kind === 'YIELD' ? 'ok' : t.kind === 'TARIK' ? 'calm' : 'ink'}>
                    {t.kind}
                  </Badge>
                </td>
                <td className="py-3.5 pr-4 text-right">
                  <Money value={t.amount} signed={t.kind === 'YIELD'} />
                </td>
                <td className="tnum py-3.5 pr-4 font-mono text-ink-2">
                  {fmtDate(t.at)}
                </td>
                <td className="py-3.5 text-right">
                  <Badge tone={t.status === 'ANTRE' ? 'bad' : 'calm'}>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={lpTxs.length} onChange={setPage} />
    </section>
  )
}
