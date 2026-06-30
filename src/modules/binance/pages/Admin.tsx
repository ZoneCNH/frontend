import { useState } from 'react'
import { Server, RefreshCw, FileJson, Trash2, Download } from 'lucide-react'
import { useMetrics } from '../../../hooks/useMetrics'

interface DeadletterEntry {
  id: string
  timestamp: string
  reason: string
  subject: string
}

// Config from SPEC.md + CONFIG-SCHEMA.md
const CLIENT_CONFIG = [
  { key: 'BINANCE_PRODUCT_LINES', value: 'spot,um_perp,cm_perp,options', required: true },
  { key: 'BINANCE_SYMBOLS', value: 'BTCUSDT,ETHUSDT,...', required: true },
  { key: 'BINANCE_WS_BASE_URL', value: 'wss://stream.binance.com:9443', required: true },
  { key: 'BINANCE_RECONNECT_MIN_BACKOFF', value: '1s', required: false },
  { key: 'BINANCE_RECONNECT_MAX_BACKOFF', value: '30s', required: false },
]

const SERVER_CONFIG = [
  { key: 'BINANCE_HTTP_ADDR', value: ':8090', required: false },
  { key: 'BINANCE_CONSUMER_DURABLE', value: 'binance-server', required: false },
  { key: 'BINANCE_QUERY_LIMIT_DEFAULT', value: '1000', required: false },
  { key: 'BINANCE_QUERY_LIMIT_MAX', value: '10000', required: false },
  { key: 'BINANCE_CLICKHOUSE_DSN', value: 'clickhouse://...', required: true },
  { key: 'BINANCE_ENABLE_INGEST_SMOKE', value: 'false', required: false },
]

const SECURITY_CONFIG = [
  { key: 'BINANCE_ADMIN_AUTH_ENABLED', value: 'true', required: true },
  { key: 'BINANCE_MTLS_ENABLED', value: 'true', required: true },
  { key: 'BINANCE_SECRET_PROVIDER', value: '(configured)', required: true },
]

export function BinanceAdmin() {
  const { data: metrics } = useMetrics()
  const [activeTab, setActiveTab] = useState<'deadletter' | 'config'>('deadletter')

  const deadletterCount = metrics?.deadletterCount ?? 0
  const deadletters: DeadletterEntry[] = deadletterCount > 0
    ? [{ id: 'dl-001', timestamp: new Date().toISOString(), reason: 'storage_write_timeout', subject: 'binance.market.spot.tick.v1' }]
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Administration</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-2">
        {([
          { key: 'deadletter', label: 'Deadletter', count: deadletterCount },
          { key: 'config', label: 'Configuration' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent-blue text-bg-primary'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span className="rounded bg-accent-red px-1 py-0.5 text-[10px] text-white">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Deadletter tab */}
      {activeTab === 'deadletter' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-bg-surface p-4">
            <div>
              <div className="flex items-center gap-2">
                <FileJson size={18} className="text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Dead-letter Queue</span>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">
                Failed messages that exceeded MaxDeliver=5 retries
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={deadletters.length === 0}
                className="inline-flex items-center gap-1.5 rounded bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30">
                <RefreshCw size={12} /> Replay All
              </button>
              <button type="button" disabled={deadletters.length === 0}
                className="inline-flex items-center gap-1.5 rounded bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30">
                <Trash2 size={12} /> Drain
              </button>
              <button type="button" disabled={deadletters.length === 0}
                className="inline-flex items-center gap-1.5 rounded bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          {deadletters.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-active py-16">
              <Server size={24} className="text-accent-green" />
              <p className="text-sm font-medium text-text-primary">Deadletter Queue Empty</p>
              <p className="text-xs text-text-muted">All messages processed successfully</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-text-muted">
                  <th className="py-2 pr-4 font-normal">ID</th>
                  <th className="py-2 pr-4 font-normal">Timestamp</th>
                  <th className="py-2 pr-4 font-normal">Reason</th>
                  <th className="py-2 pr-4 font-normal">Subject</th>
                  <th className="py-2 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deadletters.map(dl => (
                  <tr key={dl.id} className="border-b border-border/50 hover:bg-bg-elevated">
                    <td className="py-2 pr-4 font-mono text-text-primary">{dl.id}</td>
                    <td className="py-2 pr-4 font-mono text-text-secondary">{new Date(dl.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-4 text-accent-red">{dl.reason}</td>
                    <td className="py-2 pr-4 font-mono text-text-secondary">{dl.subject}</td>
                    <td className="py-2 text-right">
                      <button type="button" className="rounded bg-bg-elevated px-2 py-1 text-[10px] text-text-secondary hover:text-text-primary">Replay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Config tab */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <ConfigSection title="Client" configs={CLIENT_CONFIG} />
          <ConfigSection title="Server" configs={SERVER_CONFIG} />
          <ConfigSection title="Security" configs={SECURITY_CONFIG} />
          <div className="flex justify-end">
            <button type="button"
              className="inline-flex items-center gap-1.5 rounded bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary">
              <RefreshCw size={12} /> Hot Reload
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigSection({ title, configs }: { title: string; configs: { key: string; value: string; required: boolean }[] }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <h3 className="mb-3 text-sm font-medium text-text-secondary">{title}</h3>
      <div className="space-y-1.5">
        {configs.map(cfg => (
          <div key={cfg.key} className="flex items-center justify-between rounded bg-bg-elevated px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-text-primary">{cfg.key}</span>
              {cfg.required && <span className="rounded bg-accent-amber/15 px-1 py-0.5 text-[10px] text-accent-amber">required</span>}
            </div>
            <span className="font-mono text-text-secondary">{cfg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
