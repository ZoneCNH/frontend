import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Bar as BarData } from '../../../hooks/useMarketData'

type Props = { data: BarData[] }

interface CandlestickItem {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  isUp: boolean
}

function toCandlestick(bars: BarData[]): CandlestickItem[] {
  return bars.map(b => ({
    time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
    isUp: b.close >= b.open,
  }))
}

export function CandlestickChart({ data }: Props) {
  const items = toCandlestick(data)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={items} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#8B949E' }} axisLine={{ stroke: '#21262D' }} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ background: '#1A2330', border: '1px solid #30363D', borderRadius: '6px', fontSize: '12px' }} labelStyle={{ color: '#8B949E' }} />
        <Bar dataKey="high" fill="transparent" stackId="ohlc" barSize={2}>
          {items.map((entry, idx) => (
            <Cell key={idx} fill={entry.isUp ? '#00E676' : '#FF5252'} />
          ))}
        </Bar>
        <Line type="monotone" dataKey="close" stroke="#4FC3F7" strokeWidth={2} dot={false} name="Close" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
