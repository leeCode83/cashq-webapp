# CashQ — Uang Maju dari Penghasilan YouTube-mu

## 1. Nama project

CashQ (dari "cash" — uang yang sudah pasti milikmu, tinggal menunggu tanggal cair).

## 2. One line pitch

Kreator YouTube yang penghasilannya sudah jadi tapi baru cair tanggal 21 bisa langsung mengambil sebagian uangnya hari ini — dengan biaya kecil sekali, tanpa bunga, tanpa pinjaman.

## 3. Problem statement + data

Kreator YouTube yang sudah stabil menghasilkan uang dari iklan menghadapi masalah yang sama: uangnya datang terlambat, pintu pinjaman yang ada semuanya tidak cocok.

Data yang membuktikan masalahnya nyata:

- Uang jalan duluan, masuk belakangan: pendapatan tercatat setiap hari, tapi baru dibayarkan Google tanggal 21–26 bulan berikutnya — biaya produksi jalan tiap minggu.
- Bank menolak (tanpa agunan, tanpa slip gaji); aplikasi gajian maju hanya untuk pegawai yang punya atasan; pinjaman online memungut 0,3% per hari.
- Layanan pinjaman kreator yang ada (Spotter, Bump) hanya melayani kreator besar, dan tidak ada yang mencegah satu payout yang sama didanai berkali-kali oleh aplikasi berbeda.
- **YouTube Partner Program membayar $70 miliar+ dalam 3 tahun**; Indonesia peringkat 4 dunia dengan 151 juta pengguna dan ~3.000 channel 1M+ subscriber.
- Preseden Spotter: $600 juta sudah tersalurkan = permintaan terbukti; jatuhnya (konsentrasi ke segelintir bintang + pergeseran ke Shorts) = pelajaran desain kami.

**Pasar sudah terbukti ada pemain serupa untuk YouTube — semuanya hidup dan melayani kreator, tapi semuanya modal tertutup dan tanpa Asia Tenggara:**

- **MilX** (dukungan AIR Media-Tech, resmi YouTube Partner): punya produk dua tingkat persis desain kami — *Advance Funds* (uang yang sudah dihasilkan tapi belum dibayar Google) dan *Active Funds* (proyeksi masa depan hingga 6 bulan), repay otomatis pas payout tiba. Status: **$500 juta+ pendapatan kreator diproses, 5.000+ kreator di 44 negara, $17,6 juta sudah di-advance** — bukti paling kuat bahwa demand-nya nyata, sekaligus bukti modal yang dibutuhkan untuk membuktikan model ini kecil.
- **CreatorAdvance** (US/Kanada/UK/Australia): OAuth resmi read-only ke YouTube, advance 50–80% penghasilan bulanan, fee flat 4–10% per umur channel, repay otomatis — rentang fee dan rasio advance-nya mirip model kami (2,5–3%, ≤70% estimasi). Masih berjalan, tapi tidak masuk Indonesia.
- **Fundmates** ($50 juta+ tersalur ke 250+ channel) dan **Spotter** ($940 juta ke 735+ channel): melayani kreator menengah-besar dengan dana tertutup dari investor (Spotter: $200 juta Series D dari SoftBank) — pasar berjalan dengan model "kamar tertutup": uangnya dari satu meja, keputusan underwriting hitam-box, posisinya tidak bisa diverifikasi siapa pun.

Kesimpulan pasar: model advance penghasilan YouTube **sudah terbukti menghidupi bisnis nyata**, tapi semua pemain membangunnya sebagai neraca pribadi di web2 — belum ada yang pool terbuka on-chain, nullifier anti didanai-ganda, dan utamakan kreator Asia Tenggara. Celah itu posisi CashQ.

## 4. Penjelasan projek

CashQ memajukan sebagian penghasilan AdSense yang **sudah final** — angka yang Google sendiri sudah tetapkan dan akan dibayar tanggal 21–26 — bukan uang hasil tebakan. Kreator login sendiri ke akun AdSense-nya, sistem menyegel bukti angka itu secara kriptografis, uang cair, lalu saat payout Google masuk, sistem otomatis memotong kembali; biayanya satu kali dan terlihat jelas di depan.

## 5. Fitur / mekanisme inti

Alur intinya: verifikasi → penilaian → cair → pelunasan otomatis, dengan tujuh mekanisme:

- **Verifikasi dua jalur**: utama = zkTLS (kreator login sendiri, sesi browser-nya disegel kriptografis — bukti menempel ke kreator); kedua = API resmi YouTube Analytics sebagai data pendukung dan cadangan (kalau dipakai sebagai bukti pengganti, batas cair lebih kecil demi keamanan). **Cakupan zkTLS dibatasi satu halaman: halaman Pembayaran AdSense milik kreator, membaca cuma saldo final tanggal 3** (angka yang akan cair tanggal 21–26) — histori transaksi payout TIDAK masuk bukti zkTLS; histori itu domain bureau system yang mengambilnya lewat jalur data terpisah (OAuth Analytics). Prinsipnya: bukti minimal untuk klaim "uang ini akan cair", sisanya bukan urusan proof.
- **Bureau system (rule-based)**: penilai otomatis berbasis aturan — bukan model AI — yang menentukan berapa persen saldo boleh dicairkan dari 6 sinyal kuantitatif historis channel: decay niche, arah tren, volatilitas bulanan, konsistensi upload, anomali traffic palsu, dan rasio buffer invalid traffic. Inputnya hampir semua angka, jadi aturan eksplisit cukup: transparan (tiap poin skor bisa dijelaskan ke kreator dan juri), deterministik (satu channel selalu dapat satu jawaban), dan bisa diaudit on-chain — tanpa kotak hitam.
- **Advance tanpa tebakan**: hanya atas saldo final yang Google posting ke halaman Pembayaran sekitar tanggal 3 (siap dicairkan sampai tanggal 20) — uang yang sudah pasti milik kreator, nol prediksi; batas cairnya setelah pajak (maks 90% histori baik, 70% kreator baru — rincian di seksi 9); advance di jendela tanpa saldo final (21–3) jadi fitur lanjutan yang di-underwrite bureau.
- **Pelunasan otomatis (rail debit)**: via open finance berlisensi BI (Ayoconnect) — kreator bind rekening sekali seperti langganan Google Play, lalu uang kembali otomatis saat payout mendarat; opsi kedua = rekening virtual ber-nama sebagai tujuan payout (pelunasan terkuat, tapi verifikasinya berhari-hari).
- **Anti didanai dua kali**: satu payout punya "capai" unik onchain — lender mana pun bisa cek payout itu sudah diambil atau belum, jadi tidak bisa dimajukan dua kali oleh aplikasi berbeda.
- **Pool 3 lapis**: dana dari investor tersusun jadi lapis aman (senior), penyangga rugi (junior), dan cadangan — kalau ada advance macet, junior yang menanggung duluan, senior terakhir kena, cadangan menutup kalau macet lebih banyak dari perkiraan.
- **Rapor kredit**: setiap pelunasan tepat waktu tercatat onchain jadi riwayat permanen milik kreator — bisa dibawa ke lender mana pun, jadi reputasi tidak terikat ke CashQ (kalau CashQ tutup atau naik biaya, rekam jejak bersih tetap jadi aset).

*Setelah hackathon: advance prediktif di jendela gelap (21–3), naik ke rekening virtual ber-nama untuk ratio penuh, isi pool lewat LP provider (vault sebagai pipa, provider sebagai airnya), growth note untuk pendanaan produksi.*

## 6. Tech stack

- **On-chain**: Foundry/Anvil; kontrak ERC-4626 (vault 3 lapis), registri nullifier, waterfall sweep; smart account (ERC-4337) untuk rail sweep; warp waktu ke tanggal 21 di demo.
- **zkTLS**: zkPass TransGate (3P-TLS via ekstensi Chrome, SDK `@zkpass/transgate-js-sdk` — bukan Reclaim yang sedang error) — satu schema custom saja: intercept API halaman mock Pembayaran AdSense; klaim yang keluar cuma saldo final tanggal 3 (nominal yang akan cair tanggal 21–26) dengan nullifier schema diambil dari `payment_id` — tanpa histori transaksi payout; setup: mock AdSense = satu API GET JSON → schema JSON di zkPass Dev Center (gratis) divalidasi pakai ekstensi Schema Validator → deploy → `TransgateConnect(appid).launch(schemaId, walletAddress)`.
- **Data**: OAuth YouTube Analytics API (scope `yt-analytics-monetary.readonly`) untuk histori estimasi; open finance API (mock Ayoconnect) untuk debit.
- **Bureau system**: mesin aturan (rule engine) murni — if-then atas angka histori pendapatan yang diambilnya lewat jalur data sendiri (OAuth Analytics API), BUKAN dari bukti zkTLS (bukti zkTLS cuma saldo final); tabel bobot skor bisa ditaruh on-chain jadi tidak bisa diubah diam-diam.
- **Demo**: mock YouTube Studio/AdSense + halaman pembayaran + "lender nakal" — yang hidup onchain: nullifier, waterfall, pool (yang dinilai juri).

## 7. Model bisnis

- **Fee tetap 2,5–3% per advance**, terlihat di depan, tanpa bunga tanpa tip — dikontraskan dengan pinjol 0,3%/hari.
- **Take rate pool** dari hasil fee yang mengalir ke penyedia dana.
- *Masa depan*: API anti-stacking berbayar untuk lender web2 (produk dari registri nullifier), lisensi bureau, dan growth note via mitra berizin OJK untuk kreator dengan rapor bersih.

## 8. Kenapa harus onchain

Masalah yang diselesaikan blockchain: **"satu payout didanai dua kali"** — solusinya satu registri bersama yang dipercaya semua lender, dan itu tidak mungkin dimiliki satu perusahaan: kalau milik CashQ, lender pesaing tidak mau menaruh data di database kompetitornya sendiri. Di onchain, registri nullifier milik tidak seorang pun tapi bisa dibaca semua orang — plus aturan pool dan rapor kredit ditaruh sekali sebagai kode yang tidak bisa diubah diam-diam, jadi kepercayaan pindah dari "percaya founder" ke "percaya matematika".

Kalimat satu: **EWA biasa = satu bank dan satu nasabah — cukup database. CashQ = banyak lender pesaing berbagi satu kebenaran tentang satu payout — hanya mungkin di tempat yang tidak dimiliki siapa pun.**

## 9. Kalau kreator tidak bayar (skenario debit gagal)

Pertanyaan kunci: bagaimana kalau kreator mengosongkan rekeningnya sebelum autodebet berjalan, sehingga uang advance tidak kembali? Jawabannya berlapis — dan satu yang penting: kasus ini diperlakukan sebagai "kapan", bukan "kalau".

- **Autodebet berulang, bukan sekali coba**: jalur utama pelunasan tetap open finance (Ayoconnect). Debit yang gagal karena saldo kosong otomatis dicoba ulang sampai dana terisi — ini rekening bank, bukan e-wallet yang bisa ditinggalkan: penghasilan berikutnya (brand deal, payout bulan depan, transfer lain) masuk ke rekening yang sama dan langsung tersedot debit. Kreator bisa menunda, tapi sulit mengabaikan selamanya.
- **Batas keras di bawah pajak**: saldo final tanggal 3 belum tentu uang yang mendarat utuh — Google memotong pajak AS di muka (umumnya 10–30% untuk non-AS). Karena itu batas kontrak bukan "advance ≤ saldo final" melainkan **advance ≤ saldo final − estimasi pajak**, dengan estimasi pajak dibaca dari rate withholding yang tampil di akun AdSense kreator (fallback: 20%). Kreator dengan histori baik dan rapor bersih maksimal **90%** dari saldo final setelah pajak — selalu menyisakan bantalan supaya satu payout pasti menutup satu advance.
- **Persentase turun mengikuti kepercayaan**: kreator baru dengan rapor kosong atau skor bureau yang kurang meyakinkan dibatasi maksimal **70%** — kemampuan cair penuh harus dibangun lewat riwayat pelunasan, bukan diberikan sejak awal.
- **Term of service lending**: setiap kreator menandatangani ToS yang menyatakan hak dan kewajiban kedua pihak secara eksplisit — kewajiban menjaga ketersediaan dana untuk debit pelunasan, hak mendapatkan rapor kredit miliknya sendiri, dan konsekuensi wanprestasi (pencatatan macet permanen di registri onchain yang terbaca semua lender, penolakan advance berikutnya). Sisi hukumnya dipoles bersama mitra berizin sebelum skala.
- **Penyangga terakhir ada di pool**: kerugian yang tetap lolos (misal channel diganjar Google sehingga payout batal) diserap lapis junior — yang dihargai lebih mahal persis karena tugasnya ini — dan tidak pernah menyentuh lapis senior.

## 10. Flowchart happy flow user

```
[1. Kreator login Google + zkTLS ke halaman AdSense]
        ↓
[2. Sistem lihat saldo final "akan cair tanggal 21"]
        ↓
[3. Bureau system (rule-based) tentukan berapa boleh dicairkan]
        ↓
[4. Kreator bind rekening (seperti langganan)]
        ↓
[5. Uang maju cair HARI INI, fee tampil di depan]
        ↓
[6. Tanggal 21: payout Google masuk rekening]
        ↓
[7. Debit otomatis: potong advance + fee]
        ↓
[8. Sisa payout utuh untuk kreator
   + rapor "tepat waktu" tercatat onchain]
```

## 11. Penyederhanaan untuk demo hackathon

Untuk memastikan demo 12 jam jalan mulus, beberapa mekanisme di atas sengaja disederhanakan — semuanya scope demo, bukan perubahan desain; versi penuh tetap yang tertulis di seksi-seksi sebelumnya.

- **Advance & pelunasan full onchain**: dana advance dikirim langsung ke wallet kreator, payout YouTube dianggap diterima kreator di wallet-nya, dan autodebet pelunasan ditarik langsung dari wallet itu — mengganti sementara rail open finance/bank yang butuh mitra berizin.
- **Verifikasi zkTLS saja**: hanya jalur zkPass yang dibangun; jalur OAuth YouTube Analytics dicoret dari scope demo.
- **Bureau system jadi penampil data**: rule engine hanya menampilkan data channel di dashboard (tren, volatilitas, konsistensi) — tidak dipakai menentukan persentase advance; persentase dipatok statis untuk demo.
- **Vault satu lapis**: tidak ada senior/junior/cadangan — semua LP menyimpan satu jenis simpanan dan menerima yield yang sama.
- **Rapor kredit = histori transaksi**: log verifikasi, permintaan advance, proses autodebet, dan statusnya (sukses/gagal) tercatat sebagai riwayat kreator yang bisa dilihat — tanpa mekanisme portabilitas antar-lender.
- **Mock stablecoin pakai IDRX** sebagai aset dana di pool dan advance.
