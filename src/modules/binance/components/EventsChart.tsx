import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface ChartDataPoint {
  time: string
  [key: string]: string | number
}

type Props = {
  data: ChartDataPoint[]
  productLines: string[]
}

const COLORS = ['#4FC3F7', '#00E676', '#FFB74D', '#CE93D8']

export function EventsChart({ data, productLines }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-muted">
        Waiting for data...
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
        />
        <Tooltip
          contentStyle={{
            background: '#1A2330',
            border: '1px solid #30363D',
            borderRadius: '6px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#8B949E' }}
        />
        {productLines.map((pl, i) => (
          <Area
            key={pl}
            type="monotone"
            dataKey={pl}
            stackId="1"
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
