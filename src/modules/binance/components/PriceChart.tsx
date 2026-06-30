import { lazy, Suspense } from 'react'
import type { Bar } from '../../../hooks/useMarketData'

const CandlestickChart = lazy(() =>
  import('./CandlestickChart').then(m => ({ default: m.CandlestickChart })),
)

type Props = { bars?: Bar[]; isLoading: boolean }

export function PriceChart({ bars, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-80 animate-pulse items-center justify-center rounded bg-bg-elevated">
        <span className="text-sm text-text-muted">Loading chart...</span>
      </div>
    )
  }
  if (!bars || bars.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded border border-dashed border-border-active">
        <span className="text-sm text-text-muted">Select a symbol to view price chart</span>
      </div>
    )
  }
  return (
    <Suspense fallback={<div className="flex h-80 items-center justify-center rounded bg-bg-elevated"><span className="text-sm text-text-muted">Loading chart...</span></div>}>
      <CandlestickChart data={bars} />
    </Suspense>
  )
}
