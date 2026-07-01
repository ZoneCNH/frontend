import { Server, Wifi } from 'lucide-react'
import { useServerHealth, useClientHealth, INFRA_SERVICES } from '../../../hooks/useHealth'
import { useMetrics } from '../../../hooks/useMetrics'

export function BinanceHealth() {
  const { data: server } = useServerHealth()
  const { data: client } = useClientHealth()
  const { data: metrics } = useMetrics()
  const hasMetrics = !!metrics && (metrics.ingestAccepted + metrics.ingestRejected) > 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">System Health</h1>
      <div className="grid grid-cols-2 gap-4">
        <ProcCard name="binance-server" port={8090} mem="4G" used="2.1G" uptime={server?.health?.uptime ?? '—'} ver={server?.health?.version ?? 'v0.8.0'} status={server?.status ?? 'healthy'} eps={[{ l: 'API', p: 8090 }, { l: 'Admin', p: 8081 }]} />
        <ProcCard name="binance-client" port={8082} mem="512M" used="287M" uptime={client?.health?.uptime ?? '—'} ver="v0.8.0" status={client?.status ?? 'healthy'} eps={[{ l: 'Admin', p: 8082 }]} />
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">Metrics Overview</h2>
          <span className="text-xs text-text-muted">{metrics?.activeStreams ?? 0} streams active</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border text-left text-text-muted"><th className="py-2 pr-4 font-normal">Metric</th><th className="py-2 pr-4 text-right font-normal">Value</th><th className="py-2 text-right font-normal">Status</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/50 hover:bg-bg-elevated"><td className="py-2 pr-4 text-text-primary">Ingest Accepted</td><td className="py-2 pr-4 text-right font-mono text-accent-green">{metrics?.ingestAccepted?.toLocaleString() ?? '—'}</td><td className="py-2 text-right"><Dot c="green" /></td></tr>
            <tr className="border-b border-border/50 hover:bg-bg-elevated"><td className="py-2 pr-4 text-text-primary">Ingest Rejected</td><td className="py-2 pr-4 text-right font-mono text-accent-red">{metrics?.ingestRejected?.toLocaleString() ?? '—'}</td><td className="py-2 text-right"><Dot c={(metrics?.rejectRate ?? 0) < 5 ? 'green' : 'red'} /></td></tr>
            <tr className="border-b border-border/50 hover:bg-bg-elevated"><td className="py-2 pr-4 text-text-primary">Gaps Detected</td><td className="py-2 pr-4 text-right font-mono text-text-secondary">{metrics?.gapsDetected?.toLocaleString() ?? '—'}</td><td className="py-2 text-right"><Dot c={metrics?.gapsDetected === 0 ? 'green' : 'amber'} /></td></tr>
            <tr className="border-b border-border/50 hover:bg-bg-elevated"><td className="py-2 pr-4 text-text-primary">Deadletter</td><td className="py-2 pr-4 text-right font-mono text-text-secondary">{metrics?.deadletterCount ?? 0}</td><td className="py-2 text-right"><Dot c={metrics?.deadletterCount === 0 ? 'green' : 'red'} /></td></tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-text-secondary">Infrastructure</h2>
        <div className="grid grid-cols-4 gap-3">
          {INFRA_SERVICES.map(svc => (
            <div key={svc.key} className={`flex items-center gap-2 rounded border p-3 ${hasMetrics ? 'border-accent-green/30 bg-bg-elevated' : 'border-border bg-bg-surface'}`}>
              <Wifi size={14} className={hasMetrics ? 'text-accent-green' : 'text-text-muted'} />
              <div><p className="text-xs font-medium text-text-primary">{svc.name}</p><p className="text-[10px] text-text-muted">{svc.port ? `:${svc.port}` : 'S3'}</p></div>
              <span className={`ml-auto inline-block h-2 w-2 rounded-full ${hasMetrics ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Dot({ c }: { c: 'green' | 'red' | 'amber' }) {
  const cls = { green: 'bg-accent-green shadow-[0_0_4px_#00E676]', red: 'bg-accent-red shadow-[0_0_4px_#FF5252]', amber: 'bg-accent-amber shadow-[0_0_4px_#FFB74D]' }[c]
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />
}

type ProcProps = { name: string; port: number; mem: string; used: string; uptime: string; ver: string; status: 'healthy' | 'warning' | 'critical'; eps: { l: string; p: number }[] }

function ProcCard({ name, mem, used, uptime, ver, status, eps }: ProcProps) {
  const sc = { healthy: { dot: 'bg-accent-green shadow-[0_0_8px_#00E676]', l: 'Running' }, warning: { dot: 'bg-accent-amber shadow-[0_0_8px_#FFB74D]', l: 'Degraded' }, critical: { dot: 'bg-accent-red shadow-[0_0_8px_#FF5252]', l: 'Down' } }[status]
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Server size={16} className="text-accent-blue" /><span className="font-mono text-sm font-medium text-text-primary">{name}</span></div>
        <span className={`inline-flex items-center gap-1.5 text-xs ${status === 'healthy' ? 'text-accent-green' : status === 'warning' ? 'text-accent-amber' : 'text-accent-red'}`}><span className={`inline-block h-2 w-2 rounded-full ${sc.dot}`} />{sc.l}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-text-muted">Version</span><span className="font-mono text-text-primary text-right">{ver}</span>
        <span className="text-text-muted">Uptime</span><span className="font-mono text-text-primary text-right">{uptime}</span>
        <span className="text-text-muted">Memory</span><span className="font-mono text-text-primary text-right">{used} / {mem}</span>
      </div>
      <div className="mt-3 flex gap-1.5">{eps.map(ep => <span key={ep.l} className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">{ep.l} :{ep.p}</span>)}</div>
    </div>
  )
}
