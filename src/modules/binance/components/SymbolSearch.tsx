import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

const POPULAR_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin / USDT', line: 'spot' },
  { symbol: 'ETHUSDT', name: 'Ethereum / USDT', line: 'spot' },
  { symbol: 'BTCUSDT', name: 'Bitcoin USDⓈ-M Perp', line: 'um_perp' },
  { symbol: 'ETHUSDT', name: 'Ethereum USDⓈ-M Perp', line: 'um_perp' },
  { symbol: 'BTCUSD_PERP', name: 'Bitcoin COIN-M Perp', line: 'cm_perp' },
  { symbol: 'BNBUSDT', name: 'BNB / USDT', line: 'spot' },
  { symbol: 'SOLUSDT', name: 'Solana / USDT', line: 'spot' },
  { symbol: 'XRPUSDT', name: 'XRP / USDT', line: 'spot' },
] as const

export interface SymbolEntry {
  symbol: string
  name: string
  line: string
}

type Props = {
  onSelect: (entry: SymbolEntry) => void
  selectedSymbol?: string
}

export function SymbolSearch({ onSelect, selectedSymbol }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const filtered = query
    ? POPULAR_SYMBOLS.filter(
        s =>
          s.symbol.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase()),
      )
    : POPULAR_SYMBOLS

  const lineLabel = (line: string) =>
    ({ spot: 'Spot', um_perp: 'USDⓈ-M', cm_perp: 'COIN-M', options: 'Options' })[line] ?? line

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
      >
        <Search size={14} />
        <span className="min-w-[120px] text-left">{selectedSymbol ?? 'Search symbol...'}</span>
        <kbd className="ml-2 rounded border border-border px-1.5 text-[10px] text-text-muted">⌘K</kbd>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full rounded bg-bg-primary px-2.5 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {filtered.map(entry => {
              const key = `${entry.symbol}:${entry.line}`
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onSelect(entry); setIsOpen(false); setQuery('') }}
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                    selectedSymbol === entry.symbol
                      ? 'bg-bg-elevated text-accent-blue'
                      : 'text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <span className="font-mono font-medium">{entry.symbol}</span>
                  <span className="text-xs text-text-muted">{entry.name}</span>
                  <span className="ml-auto rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                    {lineLabel(entry.line)}
                  </span>
                </button>
              )
            })}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-text-muted">No symbols found.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
