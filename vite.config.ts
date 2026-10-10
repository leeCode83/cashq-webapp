import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { fetchSnapshot } from './src/lib/bureau-api.ts'

/**
 * Service CashQ untuk bureau: browser hanya bicara ke rute ini, rute inilah
 * yang memanggil mock YouTube di sisi server lalu menjalankan engine —
 * mencerminkan komunikasi server-to-server produk aslinya.
 */
function bureauSnapshot(): Plugin {
  return {
    name: 'bureau-snapshot',
    configureServer(server) {
      server.middlewares.use('/api/bureau/snapshot', async (_req, res) => {
        try {
          const snapshot = await fetchSnapshot()
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
