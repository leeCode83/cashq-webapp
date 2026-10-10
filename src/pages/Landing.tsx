import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import { Link } from 'react-router-dom'
import { Badge, Btn, Logo, Money, Rule } from '../components/ui'
import { Stamp } from '../components/Stamp'
import { sepEarnings } from '../lib/mock'

/* ---------- motion ---------- */

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- slip advance (pratinjau komponen asli, bukan tangkapan palsu) ---------- */

function AdvanceSlip() {
  const diterima = sepEarnings.limit
  const fee = Math.round(diterima * 0.0275)
  const rows: [string, React.ReactNode, string?][] = [
    ['Saldo final Sep 2026', <Money value={sepEarnings.saldoFinal} />],
    ['Pajak AS 20%', <span className="text-red">− <Money value={sepEarnings.pajakEst} /></span>],
    ['Fee CashQ 2,75%', <span className="text-red">− <Money value={fee} /></span>],
    ['Cair hari ini', <span className="font-semibold"><Money value={diterima - fee} /></span>, 'strong'],
    ['Autodebet', <span>21 Okt, saat payout Google</span>],
  ]
  return (
    <div className="relative border border-rule bg-paper p-6 shadow-[6px_6px_0_rgb(23_25_30/0.10)]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">Slip advance</p>
          <p className="mt-1 text-[15px] font-bold">Bagas Pradiyo · Dapur Bagas</p>
        </div>
        <Stamp title="Tersegel" sub="zkTLS · AdSense" className="mt-1 shrink-0" />
      </div>
      <Rule className="my-4" strong />
      <dl className="space-y-2.5 text-[13px]">
        {rows.map(([k, v, strong]) => (
          <div key={k} className={`flex items-baseline justify-between gap-4 ${strong ? 'border-t border-hairline pt-2.5' : ''}`}>
            <dt className="text-ink-2">{k}</dt>
            <dd className={strong ? 'text-[15px]' : ''}>{v}</dd>
          </div>
        ))}
      </dl>
      <Rule className="my-4" />
      <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
        Nullifier 0x9f21…c8d2 · satu payout sekali danai
      </p>
    </div>
  )
}

/* ---------- halaman ---------- */

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-[100dvh]">
      {/* ---------- navigasi ---------- */}
      <header className="border-b border-rule">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="text-[19px] text-ink" aria-label="CashQ, ke beranda">
            <Logo />
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <a href="#cara-kerja" className="text-[13.5px] text-ink-2 hover:text-ink">Cara kerja</a>
            <a href="#biaya" className="text-[13.5px] text-ink-2 hover:text-ink">Biaya</a>
            <a href="#vault" className="text-[13.5px] text-ink-2 hover:text-ink">Untuk penyedia dana</a>
            <Btn to="/vault" variant="ghost">Masuk vault</Btn>
            <Btn to="/kreator" variant="accent">Cairkan sekarang</Btn>
          </div>
          <button
            className="border border-rule px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] md:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
        </nav>
        {menuOpen && (
          <div className="border-t border-hairline px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#cara-kerja" onClick={() => setMenuOpen(false)} className="text-[14px]">Cara kerja</a>
              <a href="#biaya" onClick={() => setMenuOpen(false)} className="text-[14px]">Biaya</a>
              <a href="#vault" onClick={() => setMenuOpen(false)} className="text-[14px]">Untuk penyedia dana</a>
              <Btn to="/vault" variant="ghost" className="w-full">Masuk vault</Btn>
              <Btn to="/kreator" variant="accent" className="w-full">Cairkan sekarang</Btn>
            </div>
          </div>
        )}
      </header>

      <main className="overflow-x-hidden">
        {/* ---------- hero ---------- */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pb-20 pt-14 md:pt-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-2">
                <span className="h-px w-8 bg-rule" aria-hidden="true" />
                Uang maju untuk kreator YouTube
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-5 max-w-[13ch] text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
                Uang maju dari penghasilan YouTube-mu.
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink-2">
                Saldo AdSense yang sudah final bisa cair hari ini, bukan tanggal 21.
                Fee 2,75% sekali jalan, pelunasan otomatis saat payout Google tiba.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Btn to="/kreator" variant="accent">Cairkan sekarang</Btn>
                <Btn to="/vault" variant="ghost">Untuk penyedia dana</Btn>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
                Tanpa bunga · Tanpa agunan · Tanpa tebakan
              </p>
            </Reveal>
          </div>
          <div className="flex items-end lg:col-span-5">
            <Reveal delay={0.2} className="w-full">
              <AdvanceSlip />
            </Reveal>
          </div>
        </section>

        {/* ---------- cara kerja: baris buku besar, bukan kartu ---------- */}
        <section id="cara-kerja" className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <Reveal>
              <h2 className="max-w-[20ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
                Lima baris di buku besar, dari segel sampai rapor.
              </h2>
            </Reveal>
            <div className="mt-10 border-t border-rule">
              {[
                ['01', 'Segel', 'Anda login ke halaman Pembayaran AdSense sendiri. zkTLS menyegel angkanya; bukti menempel ke Anda, tidak ke CashQ.'],
                ['02', 'Batas', 'Hanya saldo final tanggal 3 yang sudah ditetapkan Google, dikurangi pajak. Maksimum 90% untuk rapor bersih. Nol prediksi.'],
                ['03', 'Cair', 'Dana masuk wallet Anda hari ini juga. Fee satu kali 2,75% terlihat di depan sebelum Anda setuju.'],
                ['04', 'Autodebet', 'Tanggal 21 payout Google masuk, advance ditambah fee terpotong otomatis. Sisa payout utuh milik Anda.'],
                ['05', 'Rapor', 'Setiap pelunasan tepat waktu tercatat on-chain. Rekam jejak itu milik Anda, bukan milik CashQ.'],
              ].map(([no, title, body], i) => (
                <Reveal key={no} delay={i * 0.05}>
                  <div className="grid grid-cols-1 gap-2 border-b border-hairline py-6 md:grid-cols-12 md:gap-6">
                    <span className="tnum font-mono text-[13px] text-ink-3 md:col-span-1">{no}</span>
                    <h3 className="text-[17px] font-bold tracking-[-0.01em] md:col-span-3">{title}</h3>
                    <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2 md:col-span-8">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- biaya: tabel perbandingan ---------- */}
        <section id="biaya" className="border-t border-rule bg-paper-2">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <Reveal>
              <h2 className="max-w-[24ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
                Biaya sekali jalan, bukan mengendap per hari.
              </h2>
              <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
                Untuk advance IDRX 10.000.000 selama 18 hari menunggu payout.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <table className="mt-10 w-full border-collapse text-[14px]">
                <thead>
                  <tr className="border-y border-rule text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">
                    <th className="py-3 pr-4 font-medium">Jalur</th>
                    <th className="py-3 pr-4 font-medium">Struktur biaya</th>
                    <th className="py-3 text-right font-medium">Biaya 18 hari</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-hairline bg-paper">
                    <td className="py-4 pr-4 font-bold">CashQ</td>
                    <td className="py-4 pr-4 text-ink-2">2,75% sekali, di depan</td>
                    <td className="py-4 text-right font-mono font-semibold text-green-deep">IDRX 275.000</td>
                  </tr>
                  <tr className="border-b border-hairline">
                    <td className="py-4 pr-4">Pinjaman online</td>
                    <td className="py-4 pr-4 text-ink-2">0,3% per hari</td>
                    <td className="py-4 text-right font-mono text-red">IDRX 540.000</td>
                  </tr>
                  <tr className="border-b border-hairline">
                    <td className="py-4 pr-4">Bank</td>
                    <td className="py-4 pr-4 text-ink-2">Perlu agunan dan slip gaji</td>
                    <td className="py-4 text-right font-mono text-ink-3">Biasanya ditolak</td>
                  </tr>
                </tbody>
              </table>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 font-mono text-[11px] leading-relaxed text-ink-3">
                Hitungan pinjaman online memakai tarif umum 0,3% per hari. Tidak ada bunga, denda, atau biaya tersembunyi di CashQ.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------- angka pasar: strip statistik bernomor kaki ---------- */}
        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <Reveal>
              <h2 className="max-w-[26ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
                Pasarnya sudah terbukti, pipanya masih tertutup.
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 border-y border-rule sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: 70, prefix: '$', suffix: ' M+', label: 'dibayarkan YouTube Partner Program dalam 3 tahun', note: '1' },
                { n: 151, suffix: ' juta', label: 'pengguna YouTube di Indonesia, peringkat 4 dunia', note: '1' },
                { n: 17.6, prefix: '$', suffix: ' jt', label: 'sudah di-advance MilX ke 5.000+ kreator di 44 negara', note: '2' },
                { n: 940, prefix: '$', suffix: ' jt', label: 'tersalurkan Spotter ke 735+ channel', note: '2' },
              ].map((s, i) => (
                <Reveal key={s.label} delay={i * 0.06} className="border-b border-hairline p-6 last:border-b-0 sm:[&:nth-last-child(-n+1)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                  <p className="tnum font-mono text-[clamp(1.9rem,3vw,2.5rem)] font-semibold tracking-[-0.02em]">
                    <NumberFlow value={s.n} locales="id-ID" prefix={s.prefix} suffix={s.suffix} format={{ maximumFractionDigits: 1 }} />
                    <sup className="ml-1 align-super font-sans text-[11px] text-green">{s.note}</sup>
                  </p>
                  <p className="mt-2 max-w-[24ch] text-[13px] leading-snug text-ink-2">{s.label}</p>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-ink-3">
              1 Laporan resmi YouTube dan data pasar Indonesia. 2 Statistik publik MilX dan Spotter. Semua pemain ada di web2 tertutup; CashQ membuka poolnya di on-chain.
            </p>
          </div>
        </section>

        {/* ---------- vault LP ---------- */}
        <section id="vault" className="border-t border-rule">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-20 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Reveal>
                <h2 className="max-w-[16ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
                  Vault terbuka, aturannya kode.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-5 max-w-[54ch] text-[15.5px] leading-relaxed text-ink-2">
                  Dana penyedia masuk ke vault ERC-4626. Yield datang dari fee advance,
                  dibagikan lewat waterfall sweep setiap tanggal 21. Registri nullifier
                  di on-chain memastikan satu payout tidak pernah didanai dua kali,
                  oleh CashQ maupun oleh lender lain.
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <div className="mt-8">
                  <Btn to="/vault" variant="primary">Buka vault</Btn>
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal delay={0.1}>
                <div className="border border-rule bg-green-tint p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">Dana terkelola</p>
                      <p className="tnum mt-2 font-mono text-[20px] font-semibold">IDRX 11,85 M</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">Yield annualized</p>
                      <p className="tnum mt-2 font-mono text-[20px] font-semibold text-green-deep">14,2%</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">Utilization</p>
                      <p className="tnum mt-2 font-mono text-[20px] font-semibold">71,3%</p>
                    </div>
                  </div>
                  <Rule className="my-5" />
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-2">
                      Arus waterfall · sweep terbaru
                    </p>
                    <Badge tone="ok">Berjalan</Badge>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- kenapa on-chain ---------- */}
        <section className="border-t border-rule bg-paper-2">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
            <Reveal>
              <h2 className="max-w-[22ch] text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold tracking-[-0.03em]">
                Satu payout, satu kebenaran.
              </h2>
              <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
                EWA biasa cukup satu database. CashQ memakai banyak lender berbagi satu
                registri yang tidak dimiliki siapa pun, karena kompetitor tidak mau
                menaruh data di database pesaingnya. Di on-chain, semua bisa membaca,
                tidak ada yang bisa mengubah diam-diam.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <table className="mt-10 w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-y border-rule text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2">
                    <th className="py-3 pr-4 font-medium">Payout</th>
                    <th className="py-3 pr-4 font-medium">Nullifier</th>
                    <th className="py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['ADS-2026-09 · Dapur Bagas', '0x9f21e4a7…c8d2', 'LUNAS'],
                    ['ADS-2026-09 · OtoReview ID', '0x4c88d1f3…9e07', 'LUNAS'],
                    ['ADS-2026-09 · Kirana Beauty', '0x77b2e0d5…41fa', 'DIDANAI'],
                  ].map(([a, b, st]) => (
                    <tr key={a} className="border-b border-hairline">
                      <td className="py-3.5 pr-4">{a}</td>
                      <td className="tnum py-3.5 pr-4 font-mono text-ink-2">{b}</td>
                      <td className="py-3.5 text-right">
                        <Badge tone={st === 'LUNAS' ? 'calm' : 'ok'}>{st}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 font-mono text-[10.5px] text-ink-3">
                Lender mana pun bisa memeriksa registri ini sebelum mendanai. Itu inti anti didanai ganda.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ---------- CTA final + kaki ---------- */}
        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <Reveal>
              <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold tracking-[-0.03em]">
                Biarkan tanggal 21 menunggu Anda.
              </h2>
              <p className="mt-4 max-w-[50ch] text-[15px] leading-relaxed text-paper/70">
                Segel saldo hari ini, uangnya jalan hari ini. Pelunasan berjalan sendiri saat payout tiba.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Btn to="/kreator" variant="accent">Cairkan sekarang</Btn>
                <Btn to="/vault" variant="ghost" className="border-paper/40 text-paper hover:bg-paper/10">
                  Untuk penyedia dana
                </Btn>
              </div>
            </Reveal>
            <div className="mt-16 flex flex-col gap-4 border-t border-paper/20 pt-6 md:flex-row md:items-center md:justify-between">
              <span className="text-[17px] text-paper">
                <Logo />
              </span>
              <nav className="flex flex-wrap gap-5 font-mono text-[11px] uppercase tracking-[0.1em] text-paper/60">
                <a href="#cara-kerja" className="hover:text-paper">Cara kerja</a>
                <a href="#biaya" className="hover:text-paper">Biaya</a>
                <a href="#vault" className="hover:text-paper">Vault</a>
                <Link to="/kreator" className="hover:text-paper">Kreator</Link>
              </nav>
              <p className="font-mono text-[10.5px] text-paper/40">CashQ · Buku besar penghasilan kreator</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
