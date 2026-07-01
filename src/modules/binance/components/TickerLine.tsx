import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Tick } from '../../../hooks/useMarketData'
import { useMemo } from 'react'
import { format } from 'date-fns'

type Props = { ticks: Tick[] }

export function TickerLine({ ticks }: Props) {
  const points = useMemo(() =>
    ticks.map(t => ({
      time: format(new Date(t.timestamp), 'HH:mm:ss'),
      price: t.price,
    })), [ticks])

  if (points.length === 0) {
    return <div className="flex h-80 items-center justify-center text-sm text-text-muted">No tick data</div>
  }

  const prices = points.map(p => p.price)
  const min = Math.min(...prices), max = Math.max(...prices)
  const pad = (max - min) * 0.02 || 0.1

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tickerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4FC3F7" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#4FC3F7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} domain={[min - pad, max + pad]} />
        <Tooltip contentStyle={{ background: '#1A2330', border: '1px solid #30363D', borderRadius: '6px', fontSize: '12px' }} labelStyle={{ color: '#8B949E' }}
          formatter={(v: unknown) => typeof v === 'number' ? [v.toFixed(2), 'Price'] : [String(v), 'Price']} />
        <Area type="monotone" dataKey="price" stroke="#4FC3F7" strokeWidth={2} fill="url(#tickerGrad)" dot={false} name="Price" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
