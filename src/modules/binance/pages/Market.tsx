import { useState, useMemo, lazy, Suspense } from 'react'
import { format } from 'date-fns'
import { SymbolSearch, type SymbolEntry } from '../components/SymbolSearch'
import { DepthChart } from '../components/DepthChart'
import { TradesTable } from '../components/TradesTable'
import { useTicks, useBars, useDepth, useTrades, useFundingRate, useMarkPrice } from '../../../hooks/useMarketData'
import { useMarketWs } from '../../../hooks/useMarketWs'

const PriceChart = lazy(() => import('../components/PriceChart').then(m => ({ default: m.PriceChart })))
const TickerLine = lazy(() => import('../components/TickerLine').then(m => ({ default: m.TickerLine })))

type EventTab = 'bars' | 'ticks' | 'depth' | 'trades' | 'funding' | 'mark'
const TABS: { key: EventTab; label: string }[] = [
  { key: 'bars', label: 'Bars' }, { key: 'ticks', label: 'Ticks' },
  { key: 'depth', label: 'Depth' }, { key: 'trades', label: 'Trades' },
  { key: 'funding', label: 'Funding' }, { key: 'mark', label: 'Mark Price' },
]

export function BinanceMarket() {
  const [selected, setSelected] = useState<SymbolEntry | null>(null)
  const [activeTab, setActiveTab] = useState<EventTab>('bars')
  const symbol = selected?.symbol ?? ''

  const pl = selected?.line ?? 'spot'
  const { data: ticks, dataUpdatedAt: ta } = useTicks(symbol, pl)
  const { data: bars, isLoading: bl, dataUpdatedAt: ba } = useBars(symbol, pl)
  const { data: depth, isLoading: dl, dataUpdatedAt: da } = useDepth(symbol, pl)
  const { data: trades, isLoading: trl, dataUpdatedAt: tra } = useTrades(symbol, pl)
  const { data: fundingRates } = useFundingRate(symbol, pl)
  const { data: markPrices } = useMarkPrice(symbol, pl)
  const { price: wsPrice, isLive: wsLive } = useMarketWs(pl + ':' + symbol)

  const lastPrice = useMemo(() => {
    if (ticks?.length) return ticks[ticks.length - 1].price
    if (bars?.length) return bars[bars.length - 1].close
    return null
  }, [ticks, bars])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Market Data Explorer</h1>
        <SymbolSearch onSelect={setSelected} selectedSymbol={selected?.symbol} />
      </div>

      {selected && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-bg-surface px-4 py-2">
          <span className="font-mono text-lg font-semibold text-text-primary">{selected.symbol}</span>
          <span className="rounded bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">{selected.line}</span>
          {lastPrice != null && <span className="font-mono text-lg text-accent-blue">${lastPrice.toLocaleString()}</span>}
          {wsPrice != null && (
            <span className={`flex items-center gap-1 text-xs font-mono ${wsLive ? 'text-accent-green' : 'text-text-muted'}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${wsLive ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'}`} />
              WS ${wsPrice.toFixed(2)}
            </span>
          )}
          {ba > 0 && <Freshness at={ba} />}
          {bars?.length ? <span className="ml-auto text-xs text-text-muted">{bars.length} bars</span> : null}
        </div>
      )}

      <div className="flex gap-1 border-b border-border pb-2">
        {TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab.key ? 'bg-accent-blue text-bg-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {!selected ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border-active">
          <p className="text-sm text-text-muted">⌘K to search and select a symbol</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-lg border border-border bg-bg-surface p-4">
            {activeTab === 'bars' && <Suspense fallback={<Loader />}><Hdr title="Candlestick" n={bars?.length} u="bars" at={ba} /><PriceChart bars={bars} isLoading={bl} /></Suspense>}
            {activeTab === 'ticks' && <Suspense fallback={<Loader />}><Hdr title="Real-time Price" n={ticks?.length} u="ticks" at={ta} /><TickerLine ticks={ticks ?? []} /></Suspense>}
            {activeTab === 'depth' && <><Hdr title="Order Book Depth" n={(depth?.bids.length ?? 0) + (depth?.asks.length ?? 0)} u="levels" at={da} /><DepthChart bids={depth?.bids ?? []} asks={depth?.asks ?? []} isLoading={dl} /></>}
            {activeTab === 'trades' && <><Hdr title="Recent Trades" n={trades?.length} u="trades" at={tra} /><TradesTable trades={trades} isLoading={trl} /></>}
            {activeTab === 'funding' && <FundingTable rates={fundingRates ?? []} />}
            {activeTab === 'mark' && <MarkTable prices={markPrices ?? []} />}
          </div>
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            <Hdr title="Depth Snapshot" n={(depth?.bids.length ?? 0) + (depth?.asks.length ?? 0)} u="levels" at={da} />
            <DepthChart bids={depth?.bids ?? []} asks={depth?.asks ?? []} isLoading={dl} />
            {depth && (
              <div className="mt-3 flex justify-between text-[10px]">
                <span className="text-accent-green">Best Bid: {depth.bids[0]?.price.toFixed(2) ?? '—'}</span>
                <span className="text-accent-red">Best Ask: {depth.asks[0]?.price.toFixed(2) ?? '—'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Hdr({ title, n, u, at }: { title: string; n?: number; u: string; at: number }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
      <span className="text-[10px] text-text-muted">
        {n != null ? `${n} ${u}` : '...'}
        {at > 0 ? ` · ${Math.round((Date.now() - at) / 1000)}s ago` : ''}
      </span>
    </div>
  )
}

function Freshness({ at }: { at: number }) {
  const sec = Math.round((Date.now() - at) / 1000)
  const live = sec < 10
  return <span className={`flex items-center gap-1 text-[10px] ${live ? 'text-accent-green' : 'text-text-muted'}`}><span className={`inline-block h-1.5 w-1.5 rounded-full ${live ? 'bg-accent-green shadow-[0_0_4px_#00E676]' : 'bg-text-muted'}`} />{live ? 'LIVE' : `${sec}s`}</span>
}

function Loader() { return <div className="flex h-80 animate-pulse items-center justify-center rounded bg-bg-elevated"><span className="text-sm text-text-muted">Loading chart...</span></div> }

function FundingTable({ rates }: { rates: { symbol: string; rate: number; markPrice: number; indexPrice: number; timestamp: string }[] }) {
  if (rates.length === 0) return <div className="flex h-64 items-center justify-center text-sm text-text-muted">No funding rate data</div>
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-text-secondary">Funding Rate History</h3>
      <div className="max-h-96 space-y-1 overflow-auto">
        {rates.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded bg-bg-elevated px-3 py-2 text-xs">
            <span className="font-mono text-text-muted">{format(new Date(r.timestamp), 'MM-dd HH:mm')}</span>
            <span className={`font-mono font-medium ${r.rate >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{(r.rate * 100).toFixed(4)}%</span>
            <span className="font-mono text-text-secondary">M: {r.markPrice.toFixed(2)}</span>
            <span className="font-mono text-text-muted">I: {r.indexPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarkTable({ prices }: { prices: { symbol: string; markPrice: number; indexPrice: number; timestamp: string }[] }) {
  if (prices.length === 0) return <div className="flex h-64 items-center justify-center text-sm text-text-muted">No mark price data</div>
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-text-secondary">Mark Price History</h3>
      <div className="max-h-96 space-y-1 overflow-auto">
        {prices.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded bg-bg-elevated px-3 py-2 text-xs">
            <span className="font-mono text-text-muted">{format(new Date(p.timestamp), 'MM-dd HH:mm')}</span>
            <span className="font-mono font-medium text-text-primary">M: {p.markPrice.toFixed(2)}</span>
            <span className="font-mono text-text-secondary">I: {p.indexPrice.toFixed(2)}</span>
            <span className="font-mono text-text-muted">Δ {(p.markPrice - p.indexPrice).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
