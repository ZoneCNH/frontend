import type { Trade } from '../../../hooks/useMarketData'
import { format } from 'date-fns'

type Props = { trades?: Trade[]; isLoading: boolean }

export function TradesTable({ trades, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4">
            <div className="h-3 w-16 rounded bg-bg-elevated" />
            <div className="h-3 w-20 rounded bg-bg-elevated" />
            <div className="h-3 w-14 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    )
  }
  if (!trades || trades.length === 0) {
    return <div className="py-8 text-center text-sm text-text-muted">Waiting for trade data...</div>
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-secondary">Recent Trades ({trades.length})</h3>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="py-1.5 pr-2 font-normal">Time</th>
              <th className="py-1.5 pr-2 text-right font-normal">Price</th>
              <th className="py-1.5 pr-2 text-right font-normal">Qty</th>
              <th className="py-1.5 text-right font-normal">Side</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(trade => (
              <tr key={trade.id} className="border-b border-border/50 transition-colors hover:bg-bg-elevated">
                <td className="py-1 pr-2 font-mono text-text-muted">{format(new Date(trade.timestamp), 'HH:mm:ss')}</td>
                <td className={`py-1 pr-2 text-right font-mono ${trade.side === 'buy' ? 'text-accent-green' : 'text-accent-red'}`}>{trade.price.toLocaleString()}</td>
                <td className="py-1 pr-2 text-right font-mono text-text-secondary">{trade.quantity.toFixed(4)}</td>
                <td className={`py-1 text-right font-medium ${trade.side === 'buy' ? 'text-accent-green' : 'text-accent-red'}`}>{trade.side.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
