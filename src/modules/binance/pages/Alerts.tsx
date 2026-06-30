import { useState } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { useMetrics } from '../../../hooks/useMetrics'

interface Alert {
  id: string
  metric: string
  condition: string
  severity: 'critical' | 'warning'
  threshold: number
  currentValue: number
  triggeredAt: string
  duration: string
  status: 'active' | 'resolved'
}

const ALERT_RULES = [
  { metric: 'ingest_events_total', condition: '5min no growth', threshold: 0, severity: 'critical' as const },
  { metric: 'rejected_total', condition: 'rate > 5%', threshold: 5, severity: 'warning' as const },
  { metric: 'dispatch_latency_seconds', condition: 'P99 > 1s', threshold: 1, severity: 'warning' as const },
  { metric: 'storage_write_latency_seconds', condition: 'P99 > 500ms', threshold: 0.5, severity: 'warning' as const },
  { metric: 'deadletter_total', condition: '> 0 in 5min', threshold: 0, severity: 'critical' as const },
  { metric: 'consumer_lag', condition: '> 1000', threshold: 1000, severity: 'critical' as const },
  { metric: 'stream_active', condition: 'sudden drop', threshold: 0, severity: 'critical' as const },
  { metric: 'event_stale_total', condition: 'rate > 1%', threshold: 1, severity: 'warning' as const },
  { metric: 'idempotency_hits_total', condition: 'spike > 3σ', threshold: 0, severity: 'warning' as const },
]

export function BinanceAlerts() {
  const { data: metrics } = useMetrics()
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all')

  // Derive alerts from current metrics vs thresholds
  const alerts: Alert[] = metrics ? [
    {
      id: 'a1', metric: 'consumer_lag', condition: '> 1000',
      severity: (metrics.consumerLag > 1000) ? 'critical' : 'warning',
      threshold: 1000, currentValue: metrics.consumerLag,
      triggeredAt: new Date().toISOString(), duration: '—',
      status: metrics.consumerLag > 1000 ? 'active' : 'resolved',
    },
    {
      id: 'a2', metric: 'rejected_total', condition: 'rate > 5%',
      severity: (metrics.rejectRate > 5) ? 'warning' : 'warning',
      threshold: 5, currentValue: metrics.rejectRate,
      triggeredAt: new Date().toISOString(), duration: '—',
      status: metrics.rejectRate > 5 ? 'active' : 'resolved',
    },
    {
      id: 'a3', metric: 'deadletter_total', condition: '> 0 in 5min',
      severity: (metrics.deadletterCount > 0) ? 'critical' : 'critical',
      threshold: 0, currentValue: metrics.deadletterCount,
      triggeredAt: new Date().toISOString(), duration: '—',
      status: metrics.deadletterCount > 0 ? 'active' : 'resolved',
    },
  ] : []

  const filtered = alerts
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => severityFilter === 'all' || a.severity === severityFilter)

  const activeCount = alerts.filter(a => a.status === 'active').length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Alert Management</h1>
          <p className="mt-0.5 text-xs text-text-muted">
            {activeCount} active · {criticalCount} critical
          </p>
        </div>
      </div>

      {/* Alert Rule Configuration */}
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-secondary">Alert Rules</h2>
        <div className="grid grid-cols-3 gap-2">
          {ALERT_RULES.map(rule => (
            <div key={rule.metric} className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-3 py-2">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${rule.severity === 'critical' ? 'bg-accent-red' : 'bg-accent-amber'}`} />
              <div className="min-w-0">
                <p className="truncate text-xs font-mono text-text-primary">{rule.metric}</p>
                <p className="text-[10px] text-text-muted">{rule.condition}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="rounded-lg border border-border bg-bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          {(['all', 'active', 'resolved'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-bg-elevated text-accent-blue' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {(['all', 'critical', 'warning'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverityFilter(s)}
                className={`rounded px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                  severityFilter === s ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {filtered.map(alert => {
            const isActive = alert.status === 'active'
            const SeverityIcon = alert.severity === 'critical' ? AlertCircle : AlertTriangle
            return (
              <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated ${isActive ? 'border-l-2 border-l-accent-red' : ''}`}>
                <SeverityIcon size={18} className={alert.severity === 'critical' ? 'text-accent-red' : 'text-accent-amber'} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{alert.metric}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      alert.severity === 'critical' ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-amber/15 text-accent-amber'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                      isActive ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'
                    }`}>
                      {isActive ? 'ACTIVE' : 'RESOLVED'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {alert.condition} · Current: {typeof alert.currentValue === 'number' ? alert.currentValue.toFixed(1) : alert.currentValue} · Threshold: {alert.threshold}
                  </p>
                </div>
                <span className="text-[10px] text-text-muted">{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString() : '—'}</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <CheckCircle size={24} className="text-accent-green" />
              <p className="text-sm text-text-secondary">No alerts {filter !== 'all' ? filter : ''}</p>
              <p className="text-xs text-text-muted">All {ALERT_RULES.length} alert rules are within thresholds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
