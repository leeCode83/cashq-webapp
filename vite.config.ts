import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { fetchSnapshot, hashSeed, JUMLAH_PROFIL } from './src/lib/bureau-api.ts'

/**
 * Service CashQ untuk bureau: browser hanya bicara ke rute ini, rute inilah
 * yang memanggil mock YouTube di sisi server lalu menjalankan engine —
 * mencerminkan komunikasi server-to-server produk aslinya.
 *
 * Pemilih profil: counter round-robin + hash `akun` — panggilan beruntun
 * berotasi, dan akun berbeda memulai dari titik berbeda di siklus yang sama.
 */
function bureauSnapshot(): Plugin {
  let counter = 0
  return {
    name: 'bureau-snapshot',
    configureServer(server) {
      server.middlewares.use('/api/bureau/snapshot', async (req, res) => {
        try {
          const q = new URL(req.url ?? '/', 'http://localhost').searchParams
          const akun = q.get('akun') ?? ''
          const lateCount = Number(q.get('lateCount') ?? '0') || 0
          const profil = (counter++ + (hashSeed(akun) % JUMLAH_PROFIL)) % JUMLAH_PROFIL
          const snapshot = await fetchSnapshot(lateCount, profil)
          res.setHeader('Content-Type', 'application/json; charset=UTF-8')
          res.end(JSON.stringify(snapshot))
        } catch (e) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=UTF-8')
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'service bureau gagal' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    bureauSnapshot(),
  ],
})
