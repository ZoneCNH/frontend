import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { getActiveModules } from './modules/registry'

// Page-level lazy loading — each page is a separate chunk
const HomePage = lazy(() => import('./modules/Home').then(m => ({ default: m.HomePage })))
const BinanceDashboard = lazy(() => import('./modules/binance/pages/Dashboard').then(m => ({ default: m.BinanceDashboard })))
const BinanceMarket = lazy(() => import('./modules/binance/pages/Market').then(m => ({ default: m.BinanceMarket })))
const BinanceHealth = lazy(() => import('./modules/binance/pages/Health').then(m => ({ default: m.BinanceHealth })))
const BinanceAlerts = lazy(() => import('./modules/binance/pages/Alerts').then(m => ({ default: m.BinanceAlerts })))
const BinanceAdmin = lazy(() => import('./modules/binance/pages/Admin').then(m => ({ default: m.BinanceAdmin })))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-text-muted animate-pulse">Loading...</div>
    </div>
  )
}

export default function App() {
  const modules = getActiveModules()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout modules={modules} />}>
          <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />

          <Route path="binance" element={<Suspense fallback={<PageLoader />}><BinanceDashboard /></Suspense>} />
          <Route path="binance/market" element={<Suspense fallback={<PageLoader />}><BinanceMarket /></Suspense>} />
          <Route path="binance/health" element={<Suspense fallback={<PageLoader />}><BinanceHealth /></Suspense>} />
          <Route path="binance/alerts" element={<Suspense fallback={<PageLoader />}><BinanceAlerts /></Suspense>} />
          <Route path="binance/admin" element={<Suspense fallback={<PageLoader />}><BinanceAdmin /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
