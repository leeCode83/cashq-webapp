import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import NumberFlow from '@number-flow/react'
import { Badge, Btn, Logo, Money, Rule } from '../../components/ui'
import { FaucetGate } from '../../components/FaucetGate'
import { Pagination } from '../../components/Pagination'
import { Sparkline } from '../../components/Sparkline'
import { StoreProvider } from '../../lib/store'
import { useStore } from '../../lib/store-ctx'
import { useWalletAddress } from '../../lib/privy'
import { advancesOf, creditOf, toUiAdvance } from '../../lib/contract-reads'
import { bureau, creator, rapor, sepEarnings } from '../../lib/mock'
import { fmtDate, pseudoHash, shortHash } from '../../lib/format'
import AdvanceFlow from './AdvanceFlow'

const PAGE_SIZE = 8

export default function KreatorApp() {
  return (
    <StoreProvider>
      <KreatorShell />
    </StoreProvider>
  )
}

type Tab = 'ringkasan' | 'advance' | 'riwayat' | 'rapor'

const TABS: [Tab, string][] = [
  ['ringkasan', 'Ringkasan'],
  ['advance', 'Ajukan advance'],
  ['riwayat', 'Riwayat'],
  ['rapor', 'Rapor kredit'],
]

function KreatorShell() {
  const [tab, setTab] = useState<Tab>('ringkasan')
  const { walletBalance, notifs, markAllRead, syncAdvances } = useStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const { ready, authenticated, logout } = usePrivy()
  const { login } = useLogin()
  const addr = useWalletAddress()
  const unread = notifs.filter((n) => !n.read).length

  // langganan riwayat advance & rapor dari chain saat wallet siap
  useEffect(() => {
    if (!addr) return
    let hidup = true
    Promise.all([advancesOf(addr), creditOf(addr).catch(() => [])])
      .then(([onchain, rapor]) => {
        if (hidup) syncAdvances(onchain.map((a) => toUiAdvance(a, rapor)))
      })
      .catch(() => {
        /* alamat kontrak placeholder atau RPC gangguan — biarkan data saat ini */
      })
    return () => {
      hidup = false
    }
  }, [addr, syncAdvances])

  return (
    <div className="min-h-[100dvh]">
      <FaucetGate />
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-5">
            <Link to="/" className="text-[18px] text-ink" aria-label="CashQ, ke beranda">
              <Logo />
            </Link>
            <span className="hidden truncate text-[13px] text-ink-2 sm:block">
              {creator.channel} · {creator.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {ready && !authenticated && (
              <Btn variant="ghost" onClick={login}>
                Masuk
              </Btn>
            )}
            {ready && authenticated && (
              <div className="flex items-center gap-3">
                <span
                  className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 sm:block"
                  title={addr}
                >
                  {addr ? shortHash(addr) : 'Menyiapkan wallet…'}
                </span>
                <Btn variant="ghost" onClick={logout}>
                  Keluar
                </Btn>
              </div>
            )}
            <div className="relative">
              <button
                className="border border-rule px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:bg-paper-2"
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((v) => !v)
                  if (!notifOpen && unread > 0) markAllRead()
                }}
              >
                Notifikasi{unread > 0 ? ` (${unread})` : ''}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(92vw,380px)] border border-rule bg-paper shadow-[6px_6px_0_rgb(23_25_30/0.10)]">
                  <p className="border-b border-hairline px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">
                    Notifikasi terbaru
                  </p>
                  <ul className="max-h-80 divide-y divide-hairline overflow-y-auto">
                    {notifs.slice(0, 8).map((n) => (
                      <li key={n.id} className="px-4 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[13px] font-semibold leading-snug">{n.title}</p>
                          <span className="shrink-0 font-mono text-[10px] text-ink-3">
                            {fmtDate(n.at)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-snug text-ink-2">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="hidden text-right md:block">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-3">
                Saldo wallet {addr ? shortHash(addr) : creator.wallet}
              </p>
              <NumberFlow
                value={walletBalance}
                locales="id-ID"
                prefix="IDRX "
                className="tnum font-mono text-[16px] font-semibold"
              />
            </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5" aria-label="bagian aplikasi">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-[13.5px] transition-colors ${
                tab === id ? 'border-b-green font-bold text-ink' : 'border-b-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {tab === 'ringkasan' && <Ringkasan onGoAdvance={() => setTab('advance')} />}
        {tab === 'advance' && <AdvanceFlow />}
        {tab === 'riwayat' && <Riwayat />}
        {tab === 'rapor' && <RaporTab />}
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <span className="text-[15px] text-ink-2">
            <Logo />
          </span>
          <p className="font-mono text-[10.5px] text-ink-3">
            Angka bersumber dari bukti zkTLS dan kontrak on-chain · IDRX, stablecoin Rupiah
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ---------- ringkasan ---------- */

function Ringkasan({ onGoAdvance }: { onGoAdvance: () => void }) {
  const { proof, activeAdvance, advances } = useStore()
  const addr = useWalletAddress()
  const paidCount = advances.filter((a) => a.status === 'LUNAS').length
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <section className="border border-rule bg-paper p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
                Penghasilan {sepEarnings.month} · diposting {fmtDate(sepEarnings.postedAt)}
              </p>
              <p className="tnum mt-2 font-mono text-[clamp(1.7rem,3vw,2.3rem)] font-semibold tracking-[-0.02em]">
                IDRX {sepEarnings.saldoFinal.toLocaleString('id-ID')}
              </p>
              <p className="mt-2 text-[13px] text-ink-2">
                Pajak AS 20% ({`IDRX ${sepEarnings.pajakEst.toLocaleString('id-ID')}`}) · payout Google {fmtDate(sepEarnings.payoutAt)}
              </p>
            </div>
            {proof ? (
              <Badge tone="ok">Tersegel zkTLS</Badge>
            ) : (
              <Badge tone="calm">Menunggu segel</Badge>
            )}
          </div>
          <Rule className="my-5" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13.5px] text-ink-2">
              Batas advance Anda <Money value={sepEarnings.limit} className="font-semibold text-ink" /> · jendela
              terbuka sampai 20 Okt.
            </p>
            <Btn variant="accent" onClick={onGoAdvance}>
              {activeAdvance ? 'Lihat advance aktif' : 'Ajukan advance'}
            </Btn>
          </div>
        </section>

        <section className="border border-rule bg-paper p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-bold">Sinyal bureau</h2>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">Histori OAuth Analytics</p>
          </div>
          <Rule className="my-5" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">Pendapatan 6 bulan</p>
              <Sparkline values={bureau.trend} labels={bureau.trendMonths} className="mt-3" />
            </div>
            <dl className="space-y-3 text-[13.5px]">
              {[
                ['Arah tren', `Naik ${bureau.streakNaik} bulan beruntun`],
                ['Volatilitas bulanan', `±${bureau.volatility.toLocaleString('id-ID')}%`],
                ['Konsistensi upload', `${bureau.uploadConsistency} (${bureau.uploadPct.toLocaleString('id-ID')}%)`],
                ['Invalid traffic', `${bureau.invalidTraffic.toLocaleString('id-ID')}% · sehat`],
                ['Decay niche', bureau.nicheDecay],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-hairline pb-2.5">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <div className="space-y-8 lg:col-span-4">
        <section className="border border-ink bg-ink p-6 text-paper">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-paper/60">
            Wallet {addr ? shortHash(addr) : creator.wallet}
          </p>
          <WalletBalance />
          <p className="mt-3 font-mono text-[10.5px] text-paper/50">Siap ditarik kapan pun</p>
        </section>

        <section className="border border-rule bg-paper p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">Rapor kredit</h2>
            <Badge tone="ok">Perluasan 90%</Badge>
          </div>
          <p className="tnum mt-4 font-mono text-[34px] font-semibold leading-none">{rapor.score}</p>
          <p className="mt-2 text-[12.5px] leading-snug text-ink-2">
            {paidCount} pelunasan tepat waktu, {rapor.late} terlambat, {rapor.default} macet, sejak {rapor.since}.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Tercatat on-chain · milik kreator
          </p>
        </section>

        {activeAdvance && (
          <section className="border border-green bg-green-tint p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold">{activeAdvance.id}</h2>
              <Badge tone="ink">Aktif</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-2">Diterima</dt>
                <dd><Money value={activeAdvance.principal} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-2">Autodebet {fmtDate(activeAdvance.sweptAt)}</dt>
                <dd><Money value={activeAdvance.principal + activeAdvance.fee} /></dd>
              </div>
            </dl>
            <Btn variant="primary" className="mt-5 w-full" onClick={onGoAdvance}>
              Lihat status pelunasan
            </Btn>
          </section>
        )}
      </div>
    </div>
  )
}

function WalletBalance() {
  const { walletBalance } = useStore()
  return (
    <NumberFlow
      value={walletBalance}
      locales="id-ID"
      prefix="IDRX "
      className="tnum mt-2 font-mono text-[26px] font-semibold"
    />
  )
}

/* ---------- riwayat ---------- */

function Riwayat() {
  const { advances } = useStore()
  const [page, setPage] = useState(1)
  const rows = useMemo(
    () => advances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [advances, page],
  )

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">Riwayat advance</h2>
        <p className="font-mono text-[11px] text-ink-3">{advances.length} entri sejak Feb 2025</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-rule text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
              <th className="py-3 pr-4 font-medium">ID</th>
              <th className="py-3 pr-4 font-medium">Bulan penghasilan</th>
              <th className="py-3 pr-4 text-right font-medium">Diterima</th>
              <th className="py-3 pr-4 text-right font-medium">Fee 2,75%</th>
              <th className="py-3 pr-4 text-right font-medium">Autodebet</th>
              <th className="py-3 pr-4 font-medium">Debet</th>
              <th className="py-3 pr-4 font-medium">Nullifier</th>
              <th className="py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-hairline hover:bg-paper-2/60">
                <td className="tnum py-3.5 pr-4 font-mono">{a.id}</td>
                <td className="py-3.5 pr-4">{a.earningsMonth}</td>
                <td className="py-3.5 pr-4 text-right"><Money value={a.principal} /></td>
                <td className="py-3.5 pr-4 text-right"><Money value={a.fee} className="text-ink-2" /></td>
                <td className="py-3.5 pr-4 text-right"><Money value={a.principal + a.fee} /></td>
                <td className="tnum py-3.5 pr-4 font-mono text-ink-2">{fmtDate(a.sweptAt)}</td>
                <td className="tnum py-3.5 pr-4 font-mono text-ink-3">{shortHash(pseudoHash(a.nullifier, 20))}</td>
                <td className="py-3.5 text-right">
                  <Badge tone={a.status === 'LUNAS' ? 'calm' : 'ok'}>{a.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={advances.length} onChange={setPage} />
    </section>
  )
}

/* ---------- rapor ---------- */

function RaporTab() {
  const { advances } = useStore()
  const paid = advances.filter((a) => a.status === 'LUNAS')
  return (
    <section>
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">Rapor kredit on-chain</h2>
      <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-2">
        Setiap pelunasan tercatat permanen di registri. Rekam jejak ini milik Anda dan bisa
        dibawa ke lender mana pun, meski Anda berhenti memakai CashQ.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-px border border-rule bg-hairline sm:grid-cols-4">
        {[
          [String(rapor.score), 'skor kepercayaan'],
          [String(paid.length), 'tepat waktu'],
          [String(rapor.late), 'terlambat'],
          ['0', 'macet'],
        ].map(([n, l]) => (
          <div key={l} className="bg-paper p-5">
            <p className="tnum font-mono text-[26px] font-semibold">{n}</p>
            <p className="mt-1 text-[12px] text-ink-2">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-rule text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
              <th className="py-3 pr-4 font-medium">Tanggal</th>
              <th className="py-3 pr-4 font-medium">Catatan registri</th>
              <th className="py-3 text-right font-medium">Hash</th>
            </tr>
          </thead>
          <tbody>
            {paid.slice(0, 8).map((a) => (
              <tr key={a.id} className="border-b border-hairline">
                <td className="tnum py-3.5 pr-4 font-mono">{fmtDate(a.sweptAt)}</td>
                <td className="py-3.5 pr-4">Pelunasan {a.id} tepat waktu</td>
                <td className="tnum py-3.5 text-right font-mono text-ink-3">{shortHash(pseudoHash(a.nullifier, 20))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
