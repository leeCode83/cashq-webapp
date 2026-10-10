import './lib/polyfill'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { baseSepolia } from 'viem/chains'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Base Sepolia dipilih karena mock IDRX + registri akan disebarkan di sana;
        ganti ke anvil (viem/chains) kalau demo pindah ke Foundry lokal. */}
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: { theme: 'light', accentColor: '#1e5c44' },
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
)
