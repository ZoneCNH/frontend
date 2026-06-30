import { Server, Wifi } from 'lucide-react'
import { useServerHealth, useClientHealth, INFRA_SERVICES } from '../../../hooks/useHealth'
import { useMetrics } from '../../../hooks/useMetrics'

export function BinanceHealth() {
  const { data: server } = useServerHealth()
  const { data: client } = useClientHealth()
  const { data: metrics } = useMetrics()

  // Derive infra status from metrics — if streams show activity, infra is reachable
  const hasMetrics = !!metrics && metrics.productLines.some(pl => pl.events > 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">System Health</h1>

      {/* Process cards */}
      <div className="grid grid-cols-2 gap-4">
        <ProcessCard
          name="binance-server"
          port={8090}
          memoryMax="4G"
          memoryUsed="2.1G"
          uptime={server?.health?.uptime ?? '—'}
          version={server?.health?.version ?? 'v0.8.0'}
          status={server?.status ?? 'healthy'}
          endpoints={[
            { label: 'GIN API', port: 8090 },
            { label: 'Admin', port: 8081 },
          ]}
        />
        <ProcessCard
          name="binance-client"
          port={8082}
          memoryMax="512M"
          memoryUsed="287M"
          uptime={client?.health?.uptime ?? '—'}
          version="v0.8.0"
          status={client?.status ?? 'healthy'}
          endpoints={[
            { label: 'Admin', port: 8082 },
          ]}
        />
      </div>

      {/* Stream Status */}
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">Stream Status</h2>
          <span className="text-xs text-text-muted">
            {metrics?.productLines.filter(pl => pl.streamsActive > 0).length ?? 0}/4 product lines active
          </span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="py-2 pr-4 font-normal">Stream</th>
              <th className="py-2 pr-4 font-normal">Status</th>
              <th className="py-2 pr-4 text-right font-normal">Events/h</th>
              <th className="py-2 pr-4 text-right font-normal">Rejected</th>
              <th className="py-2 text-right font-normal">Stale</th>
            </tr>
          </thead>
          <tbody>
            {metrics?.productLines.map(pl => {
              const isActive = pl.streamsActive > 0
              const rejectPct = pl.events > 0 ? ((pl.rejected / (pl.events + pl.rejected)) * 100).toFixed(1) : '0.0'
              return (
                <tr key={pl.productLine} className="border-b border-border/50 transition-colors hover:bg-bg-elevated">
                  <td className="py-2 pr-4 font-mono text-text-primary">{pl.productLine}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-flex items-center gap-1.5 ${isActive ? 'text-accent-green' : 'text-text-muted'}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'}`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-text-primary">{pl.events.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right font-mono text-text-secondary">{pl.rejected} ({rejectPct}%)</td>
                  <td className="py-2 text-right font-mono text-text-secondary">{pl.stale}</td>
                </tr>
              )
            })}
            {(!metrics || metrics.productLines.length === 0) && (
              <tr><td colSpan={5} className="py-8 text-center text-text-muted">No stream data available</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Infrastructure */}
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-secondary">Infrastructure</h2>
        <div className="grid grid-cols-4 gap-3">
          {INFRA_SERVICES.map(svc => (
            <InfraCard
              key={svc.key}
              name={svc.name}
              port={svc.port}
              healthy={hasMetrics}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// -- Sub-components --

type ProcessProps = {
  name: string
  port: number
  memoryMax: string
  memoryUsed: string
  uptime: string
  version: string
  status: 'healthy' | 'warning' | 'critical'
  endpoints: { label: string; port: number }[]
}

function ProcessCard({ name, memoryMax, memoryUsed, uptime, version, status, endpoints }: ProcessProps) {
  const statusConfig = {
    healthy: { dot: 'bg-accent-green shadow-[0_0_8px_#00E676]', label: 'Running' },
    warning: { dot: 'bg-accent-amber shadow-[0_0_8px_#FFB74D]', label: 'Degraded' },
    critical: { dot: 'bg-accent-red shadow-[0_0_8px_#FF5252]', label: 'Down' },
  }[status]

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-accent-blue" />
          <span className="font-mono text-sm font-medium text-text-primary">{name}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs ${status === 'healthy' ? 'text-accent-green' : status === 'warning' ? 'text-accent-amber' : 'text-accent-red'}`}>
          <span className={`inline-block h-2 w-2 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-text-muted">Version</span>
        <span className="font-mono text-text-primary text-right">{version}</span>
        <span className="text-text-muted">Uptime</span>
        <span className="font-mono text-text-primary text-right">{uptime}</span>
        <span className="text-text-muted">Memory</span>
        <span className="font-mono text-text-primary text-right">{memoryUsed} / {memoryMax}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {endpoints.map(ep => (
          <span key={ep.label} className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
            {ep.label} :{ep.port}
          </span>
        ))}
      </div>
    </div>
  )
}

function InfraCard({ name, port, healthy }: { name: string; port: number | null; healthy: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded border p-3 transition-colors ${healthy ? 'border-accent-green/30 bg-bg-elevated' : 'border-border bg-bg-surface'}`}>
      <Wifi size={14} className={healthy ? 'text-accent-green' : 'text-text-muted'} />
      <div>
        <p className="text-xs font-medium text-text-primary">{name}</p>
        <p className="text-[10px] text-text-muted">{port ? `:${port}` : 'S3'}</p>
      </div>
      <span className={`ml-auto inline-block h-2 w-2 rounded-full ${healthy ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'}`} />
    </div>
  )
}
