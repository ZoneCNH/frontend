import { useState } from 'react'
import { SymbolSearch, type SymbolEntry } from '../components/SymbolSearch'
import { PriceChart } from '../components/PriceChart'
import { DepthChart } from '../components/DepthChart'
import { TradesTable } from '../components/TradesTable'
import { useTicks, useBars, useDepth, useTrades, useFundingRate, useMarkPrice } from '../../../hooks/useMarketData'

type EventTab = 'bars' | 'ticks' | 'depth' | 'trades' | 'funding' | 'mark'

const TABS: { key: EventTab; label: string }[] = [
  { key: 'bars', label: 'Bars' },
  { key: 'ticks', label: 'Ticks' },
  { key: 'depth', label: 'Depth' },
  { key: 'trades', label: 'Trades' },
  { key: 'funding', label: 'Funding' },
  { key: 'mark', label: 'Mark Price' },
]

export function BinanceMarket() {
  const [selected, setSelected] = useState<SymbolEntry | null>(null)
  const [activeTab, setActiveTab] = useState<EventTab>('bars')

  const symbol = selected?.symbol ?? ''
  const { data: ticks, isLoading: ticksLoading } = useTicks(symbol)
  const { data: bars, isLoading: barsLoading } = useBars(symbol)
  const { data: depth, isLoading: depthLoading } = useDepth(symbol)
  const { data: trades, isLoading: tradesLoading } = useTrades(symbol)
  const { data: fundingRates } = useFundingRate(symbol)
  const { data: markPrices } = useMarkPrice(symbol)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Market Data Explorer</h1>
        <SymbolSearch
          onSelect={setSelected}
          selectedSymbol={selected?.symbol}
        />
      </div>

      {/* Selected symbol info */}
      {selected && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-semibold text-text-primary">{selected.symbol}</span>
          <span className="text-text-secondary">{selected.name}</span>
          <span className="rounded bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">{selected.line}</span>
        </div>
      )}

      {/* Event type tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent-blue text-bg-primary'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!selected ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border-active">
          <p className="text-sm text-text-muted">⌘K to search and select a symbol</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Main chart area — spans 2 columns */}
          <div className="col-span-2 rounded-lg border border-border bg-bg-surface p-4">
            {activeTab === 'bars' && <PriceChart bars={bars} isLoading={barsLoading} />}
            {activeTab === 'ticks' && (
              <PriceChart
                bars={ticks?.map(t => ({ symbol: t.symbol, open: t.price, high: t.price, low: t.price, close: t.price, volume: t.volume, timestamp: t.timestamp, interval: 'tick' }))}
                isLoading={ticksLoading}
              />
            )}
            {activeTab === 'depth' && (
              <DepthChart bids={depth?.bids ?? []} asks={depth?.asks ?? []} isLoading={depthLoading} />
            )}
            {activeTab === 'trades' && (
              <TradesTable trades={trades} isLoading={tradesLoading} />
            )}
            {activeTab === 'funding' && fundingRates && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-text-secondary">Funding Rate History</h3>
                <div className="max-h-80 space-y-1 overflow-auto">
                  {fundingRates.map((fr, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-bg-elevated px-3 py-2 text-xs">
                      <span className="font-mono text-text-muted">{new Date(fr.timestamp).toLocaleString()}</span>
                      <span className={`font-mono font-medium ${fr.rate >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {(fr.rate * 100).toFixed(4)}%
                      </span>
                      <span className="font-mono text-text-secondary">Mark: {fr.markPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'mark' && markPrices && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-text-secondary">Mark Price History</h3>
                <div className="max-h-80 space-y-1 overflow-auto">
                  {markPrices.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-bg-elevated px-3 py-2 text-xs">
                      <span className="font-mono text-text-muted">{new Date(mp.timestamp).toLocaleString()}</span>
                      <span className="font-mono font-medium text-text-primary">Mark: {mp.markPrice.toFixed(2)}</span>
                      <span className="font-mono text-text-secondary">Index: {mp.indexPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(activeTab === 'funding' && !fundingRates) && (
              <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading funding rates...</div>
            )}
            {(activeTab === 'mark' && !markPrices) && (
              <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading mark prices...</div>
            )}
          </div>

          {/* Sidebar — order book */}
          <div className="rounded-lg border border-border bg-bg-surface p-4">
            {activeTab !== 'depth' && activeTab !== 'trades' && (
              <DepthChart bids={depth?.bids ?? []} asks={depth?.asks ?? []} isLoading={depthLoading} />
            )}
            {activeTab === 'trades' && (
              <DepthChart bids={depth?.bids ?? []} asks={depth?.asks ?? []} isLoading={depthLoading} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
