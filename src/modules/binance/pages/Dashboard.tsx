import { useState, useMemo, lazy, Suspense } from 'react'
import { Activity, Radio, Clock, ShieldAlert } from 'lucide-react'
import { useMetrics } from '../../../hooks/useMetrics'
import { ProductLineFilter, type ProductLine } from '../components/ProductLineFilter'

const EventsChart = lazy(() =>
  import('../components/EventsChart').then(m => ({ default: m.EventsChart })),
)
const LatencyChart = lazy(() =>
  import('../components/LatencyChart').then(m => ({ default: m.LatencyChart })),
)

export function BinanceDashboard() {
  const { data: metrics, isLoading, isError, error } = useMetrics()
  const [selectedPl, setSelectedPl] = useState<ProductLine | null>(null)

  // Build chart data from metrics snapshots — for now use current values
  const chartData = useMemo(() => {
    if (!metrics) return []
    const now = new Date().toLocaleTimeString()
    return [{ time: now }]
  }, [metrics])

  // Derive display values
  const activePls = metrics?.productLines.filter(pl => pl.streamsActive > 0).length ?? 0
  const totalStreams = metrics?.streamsActive ?? 0
  const displayEvents = metrics?.ingestRate?.toLocaleString() ?? '—'
  const displayLag = metrics?.consumerLag?.toLocaleString() ?? '—'
  const displayRejectRate = metrics?.rejectRate?.toFixed(1) ?? '—'

  // Determine status colors
  const streamStatus: 'healthy' | 'warning' | 'critical' =
    totalStreams === 0 ? 'critical' : activePls >= 2 ? 'healthy' : 'warning'

  const lagStatus: 'healthy' | 'warning' | 'critical' =
    (metrics?.consumerLag ?? 0) > 1000 ? 'critical' : (metrics?.consumerLag ?? 0) > 500 ? 'warning' : 'healthy'

  const rejectStatus: 'healthy' | 'warning' | 'critical' =
    (metrics?.rejectRate ?? 0) > 5 ? 'critical' : (metrics?.rejectRate ?? 0) > 1 ? 'warning' : 'healthy'

  // Loading state
  if (isLoading && !metrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-text-muted">Connecting to binance-server...</div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-border bg-bg-surface p-8 text-center">
          <ShieldAlert size={32} className="mx-auto mb-3 text-accent-red" />
          <p className="text-sm text-text-secondary">Unable to connect to /metrics</p>
          <p className="mt-1 text-xs text-text-muted">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Binance Dashboard</h1>
        <ProductLineFilter
          lines={metrics?.productLines ?? []}
          selected={selectedPl}
          onChange={setSelectedPl}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Events (total)"
          value={displayEvents}
          icon={Activity}
          status="healthy"
        />
        <KpiCard
          title="Streams Active"
          value={`${activePls}/4`}
          icon={Radio}
          status={streamStatus}
        />
        <KpiCard
          title="Consumer Lag"
          value={displayLag}
          icon={Clock}
          status={lagStatus}
        />
        <KpiCard
          title="Reject Rate"
          value={`${displayRejectRate}%`}
          icon={ShieldAlert}
          status={rejectStatus}
        />
      </div>

      {/* Charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <h3 className="mb-3 text-sm font-medium text-text-secondary">
              Events by Product Line
            </h3>
            <EventsChart
              data={chartData}
              productLines={metrics?.productLines.map(pl => pl.productLine) ?? []}
            />
          </div>

          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <LatencyChart
              title="Dispatch Latency"
              data={chartData}
              lines={[
                { key: 'dP50', label: 'P50', color: '#4FC3F7' },
                { key: 'dP95', label: 'P95', color: '#FFB74D' },
                { key: 'dP99', label: 'P99', color: '#FF5252' },
              ]}
              unit="s"
            />
          </div>
        </div>
      </Suspense>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Deadletter"
          value={metrics?.deadletterCount?.toString() ?? '—'}
          subtitle={`Rate: ${metrics?.deadletterRate?.toFixed(2) ?? '—'}%`}
        />
        <StatCard
          title="Idempotency Hits"
          value={metrics?.idempotencyHits?.toLocaleString() ?? '—'}
          subtitle="Duplicate events detected"
        />
        <SloCard slos={metrics?.slos ?? []} />
      </div>
    </div>
  )
}

// -- Sub-components --

type KpiProps = {
  title: string
  value: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  status: 'healthy' | 'warning' | 'critical'
}

function KpiCard({ title, value, icon: Icon, status }: KpiProps) {
  const statusConfig = {
    healthy: { dot: 'bg-accent-green shadow-[0_0_8px_#00E676]' },
    warning: { dot: 'bg-accent-amber shadow-[0_0_8px_#FFB74D]' },
    critical: { dot: 'bg-accent-red shadow-[0_0_8px_#FF5252]' },
  }[status]

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
        <Icon size={16} className="text-text-muted" />
      </div>
      <div className="mt-2">
        <span className="text-2xl font-semibold font-mono text-text-primary">{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${statusConfig.dot}`} />
        <span className="text-xs text-text-muted capitalize">{status}</span>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <span className="text-xs font-medium text-text-secondary">{title}</span>
      <div className="mt-1 text-2xl font-semibold font-mono text-text-primary">{value}</div>
      <span className="text-xs text-text-muted">{subtitle}</span>
    </div>
  )
}

type SloProps = { slos: { name: string; value: number; target: number; unit: string; healthy: boolean }[] }

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="h-64 animate-pulse rounded-lg border border-border bg-bg-surface p-4">
        <div className="mb-3 h-4 w-32 rounded bg-bg-elevated" />
        <div className="h-48 rounded bg-bg-elevated" />
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-border bg-bg-surface p-4">
        <div className="mb-3 h-4 w-32 rounded bg-bg-elevated" />
        <div className="h-48 rounded bg-bg-elevated" />
      </div>
    </div>
  )
}

function SloCard({ slos }: SloProps) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <span className="text-xs font-medium text-text-secondary">SLO Status</span>
      <div className="mt-2 space-y-2">
        {slos.map(slo => (
          <div key={slo.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  slo.healthy
                    ? 'bg-accent-green shadow-[0_0_4px_#00E676]'
                    : 'bg-accent-red shadow-[0_0_4px_#FF5252]'
                }`}
              />
              <span className="text-xs text-text-secondary">{slo.name}</span>
            </div>
            <span className="text-xs font-mono text-text-primary">
              {slo.value.toFixed(slo.unit === '%' ? 2 : 3)}
              {slo.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
