import { useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { Bar as BarData } from '../../../hooks/useMarketData'
import { format } from 'date-fns'

type Props = { data: BarData[] }

interface Candle {
  time: string
  open: number; high: number; low: number; close: number
  volume: number; isUp: boolean
}

function toCandles(bars: BarData[]): Candle[] {
  return bars.map(b => ({
    time: format(new Date(b.timestamp), 'HH:mm'),
    open: b.open, high: b.high, low: b.low, close: b.close,
    volume: b.volume, isUp: b.close >= b.open,
  }))
}

export function CandlestickChart({ data }: Props) {
  const candles = useMemo(() => toCandles(data), [data])

  if (candles.length === 0) {
    return <div className="flex h-96 items-center justify-center text-sm text-text-muted">No data available</div>
  }

  const priceDomain = useMemo(() => {
    const all = candles.flatMap(c => [c.high, c.low])
    const min = Math.min(...all), max = Math.max(...all)
    const pad = (max - min) * 0.03
    return [min - pad, max + pad] as [number, number]
  }, [candles])

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={candles} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B949E' }}
            axisLine={{ stroke: '#21262D' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#8B949E' }}
            axisLine={{ stroke: '#21262D' }} tickLine={false} domain={priceDomain} />
          <Tooltip
            contentStyle={{ background: '#1A2330', border: '1px solid #30363D', borderRadius: '6px', fontSize: '12px' }}
            labelStyle={{ color: '#8B949E' }}
            formatter={(v: unknown) => typeof v === 'number' ? [v.toFixed(2), ''] : [String(v), '']}
          />
          {/* OHLC body bar with color per candle */}
          <Bar dataKey="close" barSize={8} radius={[1, 1, 1, 1]}>
            {candles.map((c, i) => (
              <Cell key={i} fill={c.isUp ? '#00E676' : '#FF5252'} />
            ))}
          </Bar>
          {/* Wick: high-low range as transparent bar */}
          <Bar dataKey="high" barSize={1} fill="#8B949E" opacity={0.6} />
          {/* Close line overlay */}
          <Line type="monotone" dataKey="close" stroke="#4FC3F7" strokeWidth={2}
            dot={false} name="Close" />
        </ComposedChart>
      </ResponsiveContainer>
      {/* Volume bars */}
      <ResponsiveContainer width="100%" height={80}>
        <ComposedChart data={candles} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <Bar dataKey="volume" barSize={8} opacity={0.35}>
            {candles.map((c, i) => (
              <Cell key={i} fill={c.isUp ? '#00E676' : '#FF5252'} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
