import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint } from './EventsChart'

type Props = {
  title: string
  data: ChartDataPoint[]
  lines: { key: string; label: string; color: string }[]
  unit?: string
}

export function LatencyChart({ title, data, lines, unit = 's' }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-text-muted">
        Waiting for data...
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text-secondary">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#8B949E' }}
            axisLine={{ stroke: '#21262D' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8B949E' }}
            axisLine={{ stroke: '#21262D' }}
            tickLine={false}
            unit={unit}
          />
          <Tooltip
            contentStyle={{
              background: '#1A2330',
              border: '1px solid #30363D',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#8B949E' }}
            formatter={(value: unknown) =>
              typeof value === 'number' ? [`${value.toFixed(3)}${unit}`, ''] : ['—', '']
            }
          />
          {lines.map(line => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={1.5}
              dot={false}
              name={line.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
