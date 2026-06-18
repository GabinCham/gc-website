import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const STANDALONE_PAGES = {
  '/brasserie': lazy(() =>
    import('./pages/BrasseriePage.tsx').then((m) => ({ default: m.BrasseriePage })),
  ),
  '/quedesnumeros10': lazy(() =>
    import('./pages/QueDesNumeros10Page.tsx').then((m) => ({
      default: m.QueDesNumeros10Page,
    })),
  ),
} as const

const pathname = window.location.pathname.replace(/\/$/, '') || '/'
const StandalonePage =
  STANDALONE_PAGES[pathname as keyof typeof STANDALONE_PAGES]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {StandalonePage ? (
      <Suspense fallback={null}>
        <StandalonePage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
