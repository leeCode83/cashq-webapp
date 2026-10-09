import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Landing from './pages/Landing'
import KreatorApp from './pages/kreator/KreatorApp'
import LpApp from './pages/lp/LpApp'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/kreator" element={<KreatorApp />} />
        <Route path="/vault" element={<LpApp />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      {/* toast bergaya kertas: siku, hairline, tanpa glif */}
      <Toaster
        position="bottom-right"
        icons={{ success: null, error: null, info: null, warning: null, loading: null }}
        toastOptions={{
          style: {
            background: 'var(--color-paper)',
            border: '1px solid var(--color-rule)',
            borderRadius: 0,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            boxShadow: '4px 4px 0 rgb(23 25 30 / 0.12)',
          },
        }}
      />
    </BrowserRouter>
  )
}
