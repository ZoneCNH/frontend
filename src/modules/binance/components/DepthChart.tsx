import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { DepthLevel } from '../../../hooks/useMarketData'
import { useMemo } from 'react'

type Props = { bids: DepthLevel[]; asks: DepthLevel[]; isLoading: boolean }

export function DepthChart({ bids, asks, isLoading }: Props) {
  const chartData = useMemo(() => {
    const levels = new Map<number, { bidQty: number; askQty: number }>()
    for (const b of bids) {
      const l = levels.get(b.price) ?? { bidQty: 0, askQty: 0 }
      l.bidQty += b.quantity; levels.set(b.price, l)
    }
    for (const a of asks) {
      const l = levels.get(a.price) ?? { bidQty: 0, askQty: 0 }
      l.askQty += a.quantity; levels.set(a.price, l)
    }
    return Array.from(levels.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(-40)
      .map(([price, l]) => ({ price, bidQty: l.bidQty, askQty: -l.askQty, label: price.toFixed(2) }))
  }, [bids, asks])

  if (isLoading) {
    return <div className="flex h-64 animate-pulse items-center justify-center rounded bg-bg-elevated"><span className="text-sm text-text-muted">Loading depth...</span></div>
  }
  if (chartData.length === 0) {
    return <div className="flex h-64 items-center justify-center rounded border border-dashed border-border-active"><span className="text-sm text-text-muted">Waiting for order book data...</span></div>
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-secondary">Order Book Depth</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} tickFormatter={v => Math.abs(v).toString()} />
          <Tooltip contentStyle={{ background: '#1A2330', border: '1px solid #30363D', borderRadius: '6px', fontSize: '12px' }} labelStyle={{ color: '#8B949E' }} />
          <Bar dataKey="bidQty" stackId="depth" fill="#00E676" fillOpacity={0.6} name="Bids" />
          <Bar dataKey="askQty" stackId="depth" fill="#FF5252" fillOpacity={0.6} name="Asks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
