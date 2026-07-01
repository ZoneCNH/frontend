import { NavLink } from 'react-router-dom'
import { BarChart3, Globe, Server, ChevronRight } from 'lucide-react'
import { getActiveModules } from './registry'
import { useServerHealth } from '../hooks/useHealth'
import { useMetrics } from '../hooks/useMetrics'

export function HomePage() {
  const modules = getActiveModules()
  const { data: server } = useServerHealth()
  const { data: metrics } = useMetrics()

  const isConnected = server?.status === 'healthy'
  const totalEvents = metrics?.ingestRate ?? 0

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">ZoneCNH</h1>
        <p className="mt-2 text-sm text-text-secondary">FoundationX 量化交易基础设施 · 统一监控平台</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatusCard label="binance-server" status={isConnected ? 'connected' : 'disconnected'} icon={Server} />
        <StatusCard label="Events Ingested" value={totalEvents > 0 ? totalEvents.toLocaleString() : '—'} icon={BarChart3} />
        <StatusCard label="Active Modules" value={`${modules.length}`} icon={Globe} />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-text-secondary">Modules</h2>
        <div className="grid grid-cols-1 gap-3">
          {modules.map(mod => (
            <NavLink key={mod.id} to={mod.routes[0]?.path ?? `/${mod.id}`}
              className="group flex items-center gap-4 rounded-lg border border-border bg-bg-surface p-5 transition-colors hover:border-border-active hover:bg-bg-elevated no-underline">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated">
                <mod.icon size={20} className="text-accent-blue" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{mod.name}</span>
                  <span className="rounded bg-accent-green/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-green">Active</span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">{mod.description}</p>
                <div className="mt-2 flex gap-2">
                  {mod.routes.map(r => (
                    <span key={r.path} className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">{r.label}</span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-1" />
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusCard({ label, value, status, icon: Icon }: {
  label: string; value?: string; status?: 'connected' | 'disconnected'
  icon: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4 text-center">
      <Icon size={20} className="mx-auto mb-2 text-text-muted" />
      <div className="text-xs text-text-secondary">{label}</div>
      {status ? (
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${status === 'connected' ? 'bg-accent-green shadow-[0_0_6px_#00E676]' : 'bg-text-muted'}`} />
          <span className="text-sm font-medium text-text-primary capitalize">{status}</span>
        </div>
      ) : value ? (
        <div className="mt-1 text-lg font-semibold font-mono text-text-primary">{value}</div>
      ) : null}
    </div>
  )
}
