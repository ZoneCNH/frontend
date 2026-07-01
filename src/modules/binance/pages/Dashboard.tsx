import { useState, useMemo, lazy, Suspense } from 'react'
import { Activity, Radio, Clock, ShieldAlert } from 'lucide-react'
import { useMetrics } from '../../../hooks/useMetrics'
import { useMetricsWs } from '../../../hooks/useWebSocket'
import { ProductLineFilter, type ProductLine } from '../components/ProductLineFilter'

const EventsChart = lazy(() => import('../components/EventsChart').then(m => ({ default: m.EventsChart })))
const LatencyChart = lazy(() => import('../components/LatencyChart').then(m => ({ default: m.LatencyChart })))

export function BinanceDashboard() {
  const { data: metrics, isLoading, isError, error } = useMetrics()
  const { isConnected: wsConnected, latency: wsLatency } = useMetricsWs()
  const [selectedPl, setSelectedPl] = useState<ProductLine | null>(null)

  const chartData = useMemo(() => {
    if (!metrics) return []
    return [{ time: new Date().toLocaleTimeString() }]
  }, [metrics])

  const totalEvents = metrics ? (metrics.ingestAccepted + metrics.ingestRejected) : 0
  const activeStreams = metrics?.activeStreams ?? 0
  const rejectRate = metrics?.rejectRate ?? 0

  const streamStatus: 'healthy' | 'warning' | 'critical' =
    activeStreams === 0 ? 'critical' : activeStreams >= 2 ? 'healthy' : 'warning'
  const rejectStatus: 'healthy' | 'warning' | 'critical' =
    rejectRate > 5 ? 'critical' : rejectRate > 1 ? 'warning' : 'healthy'

  if (isLoading && !metrics) {
    return <div className="flex h-full items-center justify-center"><div className="text-sm text-text-muted">Connecting to binance-server...</div></div>
  }
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-border bg-bg-surface p-8 text-center">
          <ShieldAlert size={32} className="mx-auto mb-3 text-accent-red" />
          <p className="text-sm text-text-secondary">Unable to connect to /metrics</p>
          <p className="mt-1 text-xs text-text-muted">{error instanceof Error ? error.message : 'Unknown'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-text-primary">Binance Dashboard</h1>
          <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${
            wsConnected ? 'bg-accent-green/15 text-accent-green' : 'bg-text-muted/15 text-text-muted'
          }`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
              wsConnected ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'
            }`} />
            {wsConnected ? `WS ${wsLatency}ms` : 'polling'}
          </span>
        </div>
        <ProductLineFilter lines={[]} selected={selectedPl} onChange={setSelectedPl} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="Events" value={totalEvents > 0 ? totalEvents.toLocaleString() : '—'} icon={Activity} status="healthy" />
        <KpiCard title="Streams" value={`${activeStreams}`} icon={Radio} status={streamStatus} />
        <KpiCard title="Clock Skew" value={metrics?.clockSkew ? metrics.clockSkew.toFixed(3) + 's' : '—'} icon={Clock} status="healthy" />
        <KpiCard title="Reject" value={rejectRate > 0 ? rejectRate.toFixed(1) + '%' : '—'} icon={ShieldAlert} status={rejectStatus} />
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <h3 className="mb-3 text-sm font-medium text-text-secondary">Ingest Events</h3>
            <EventsChart data={chartData} productLines={['accepted', 'rejected']} />
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <LatencyChart title="Stream Lag" data={chartData}
              lines={[{ key: 'lag', label: 'Lag', color: '#4FC3F7' }]} unit="s" />
          </div>
        </div>
      </Suspense>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Deadletter" value={metrics?.deadletterCount?.toString() ?? '—'} subtitle={`Rate: ${(metrics?.deadletterRate ?? 0).toFixed(2)}%`} />
        <StatCard title="Idempotency" value={metrics?.idempotencyAccepted?.toLocaleString() ?? '—'} subtitle="Accepted events" />
        <SloCard slos={metrics?.slos ?? []} />
      </div>
    </div>
  )
}

type KpiProps = { title: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }>; status: 'healthy' | 'warning' | 'critical' }

function KpiCard({ title, value, icon: Icon, status }: KpiProps) {
  const d = { healthy: 'bg-accent-green shadow-[0_0_8px_#00E676]', warning: 'bg-accent-amber shadow-[0_0_8px_#FFB74D]', critical: 'bg-accent-red shadow-[0_0_8px_#FF5252]' }[status]
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between"><span className="text-xs font-medium text-text-secondary">{title}</span><Icon size={16} className="text-text-muted" /></div>
      <div className="mt-2"><span className="text-2xl font-semibold font-mono text-text-primary">{value}</span></div>
      <div className="mt-2 flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-full ${d}`} /><span className="text-xs text-text-muted capitalize">{status}</span></div>
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

function ChartSkeleton() {
  return <div className="grid grid-cols-2 gap-4"><div className="h-64 animate-pulse rounded-lg border border-border bg-bg-surface p-4" /><div className="h-64 animate-pulse rounded-lg border border-border bg-bg-surface p-4" /></div>
}

type SloProps = { slos: { name: string; value: number; target: number; unit: string; healthy: boolean }[] }

function SloCard({ slos }: SloProps) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <span className="text-xs font-medium text-text-secondary">SLO Status</span>
      <div className="mt-2 space-y-2">
        {slos.map(slo => (
          <div key={slo.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${slo.healthy ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-accent-red shadow-[0_0_4px_#FF5252]'}`} />
              <span className="text-xs text-text-secondary">{slo.name}</span>
            </div>
            <span className="text-xs font-mono text-text-primary">{slo.value.toFixed(slo.unit === '%' ? 2 : 0)}{slo.unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
