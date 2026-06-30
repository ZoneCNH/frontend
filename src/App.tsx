import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { getActiveModules } from './modules/registry'

// Lazy-load all module pages
import { BinanceDashboard } from './modules/binance/pages/Dashboard'
import { BinanceMarket } from './modules/binance/pages/Market'
import { BinanceHealth } from './modules/binance/pages/Health'
import { BinanceAlerts } from './modules/binance/pages/Alerts'
import { BinanceAdmin } from './modules/binance/pages/Admin'

export default function App() {
  const modules = getActiveModules()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout modules={modules} />}>
          {/* Root redirects to first active module */}
          <Route index element={<Navigate to="/binance" replace />} />

          {/* Binance module */}
          <Route path="binance" element={<BinanceDashboard />} />
          <Route path="binance/market" element={<BinanceMarket />} />
          <Route path="binance/health" element={<BinanceHealth />} />
          <Route path="binance/alerts" element={<BinanceAlerts />} />
          <Route path="binance/admin" element={<BinanceAdmin />} />

          {/* Future modules go here */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
