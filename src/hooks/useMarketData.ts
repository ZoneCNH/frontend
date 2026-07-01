import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

// Actual binance-server API response types (snake_case, string prices)
interface ApiTick {
  ask_price: string; ask_qty: string; bid_price: string; bid_qty: string
  product_line: string; source: string; symbol: string; ts: string; update_id: number
}
interface ApiBar {
  open: string; high: string; low: string; close: string; volume: string
  symbol: string; product_line: string; ts: string; interval: string
}
interface ApiDepth {
  bids: [string, string][]; asks: [string, string][]
  symbol: string; product_line: string; ts: string
}
interface ApiTrade {
  id: string; price: string; qty: string
  side: string; symbol: string; ts: string
}
interface ApiFundingRate {
  rate: string; mark_price: string; index_price: string; symbol: string; ts: string
}
interface ApiMarkPrice {
  mark_price: string; index_price: string; symbol: string; ts: string
}

// Normalized frontend types
export interface Tick { symbol: string; price: number; volume: number; timestamp: string; product_line: string }
export interface Bar { symbol: string; open: number; high: number; low: number; close: number; volume: number; timestamp: string; interval: string }
export interface DepthLevel { price: number; quantity: number }
export interface Depth { symbol: string; bids: DepthLevel[]; asks: DepthLevel[]; timestamp: string }
export interface Trade { id: string; symbol: string; price: number; quantity: number; side: 'buy' | 'sell'; timestamp: string }
export interface FundingRate { symbol: string; rate: number; markPrice: number; indexPrice: number; timestamp: string }
export interface MarkPrice { symbol: string; markPrice: number; indexPrice: number; timestamp: string }

type TimeRange = { from?: string; to?: string }
type ProductLine = string
const pf = (s: string) => parseFloat(s)

function apiParams(range?: TimeRange): string {
  const params = new URLSearchParams()
  params.set('start', range?.from ?? format(Date.now() - 86400000, "yyyy-MM-dd'T'HH:mm:ss'Z'"))
  params.set('end', range?.to ?? format(Date.now(), "yyyy-MM-dd'T'HH:mm:ss'Z'"))
  return `?${params.toString()}`
}

export function useTicks(symbol: string, pl: ProductLine = 'spot', range?: TimeRange) {
  return useQuery({
    queryKey: ['ticks', pl, symbol, range],
    queryFn: async (): Promise<Tick[]> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/ticks/range${apiParams(range)}`)
      if (!res.ok) return []
      const json: ApiTick[] = await res.json()
      return json.map(t => ({ symbol: t.symbol, product_line: t.product_line, timestamp: t.ts, price: pf(t.ask_price), volume: pf(t.ask_qty) }))
    },
    enabled: !!symbol, refetchInterval: 5_000, placeholderData: prev => prev,
  })
}

export function useBars(symbol: string, pl: ProductLine = 'spot', range?: TimeRange) {
  return useQuery({
    queryKey: ['bars', pl, symbol, range],
    queryFn: async (): Promise<Bar[]> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/bars/range${apiParams(range)}`)
      if (!res.ok) return []
      const json: ApiBar[] = await res.json()
      return json.map(b => ({ symbol: b.symbol, timestamp: b.ts, interval: b.interval, open: pf(b.open), high: pf(b.high), low: pf(b.low), close: pf(b.close), volume: pf(b.volume) }))
    },
    enabled: !!symbol, refetchInterval: 15_000, placeholderData: prev => prev,
  })
}

export function useDepth(symbol: string, pl: ProductLine = 'spot') {
  return useQuery({
    queryKey: ['depth', pl, symbol],
    queryFn: async (): Promise<Depth> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/depth/range${apiParams({})}`)
      if (!res.ok) return { symbol, bids: [], asks: [], timestamp: '' }
      const json: ApiDepth[] = await res.json()
      const d = json[json.length - 1] ?? { bids: [], asks: [], ts: '' }
      return { symbol: d.symbol ?? symbol, bids: (d.bids ?? []).map(([p, q]) => ({ price: pf(p), quantity: pf(q) })), asks: (d.asks ?? []).map(([p, q]) => ({ price: pf(p), quantity: pf(q) })), timestamp: d.ts ?? '' }
    },
    enabled: !!symbol, refetchInterval: 5_000, placeholderData: prev => prev,
  })
}

export function useTrades(symbol: string, pl: ProductLine = 'spot') {
  return useQuery({
    queryKey: ['trades', pl, symbol],
    queryFn: async (): Promise<Trade[]> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/trades/range${apiParams({})}`)
      if (!res.ok) return []
      const json: ApiTrade[] = await res.json()
      return json.map(t => ({ id: t.id, symbol: t.symbol, timestamp: t.ts, price: pf(t.price), quantity: pf(t.qty), side: t.side as 'buy' | 'sell' }))
    },
    enabled: !!symbol, refetchInterval: 3_000, placeholderData: prev => prev,
  })
}

export function useFundingRate(symbol: string, pl: ProductLine = 'um_perp') {
  return useQuery({
    queryKey: ['funding-rate', pl, symbol],
    queryFn: async (): Promise<FundingRate[]> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/funding-rate/range${apiParams({})}`)
      if (!res.ok) return []
      const json: ApiFundingRate[] = await res.json()
      return json.map(f => ({ symbol: f.symbol, timestamp: f.ts, rate: pf(f.rate), markPrice: pf(f.mark_price), indexPrice: pf(f.index_price) }))
    },
    enabled: !!symbol, refetchInterval: 30_000, placeholderData: prev => prev,
  })
}

export function useMarkPrice(symbol: string, pl: ProductLine = 'um_perp') {
  return useQuery({
    queryKey: ['mark-price', pl, symbol],
    queryFn: async (): Promise<MarkPrice[]> => {
      const res = await fetch(`/api/v1/market/${pl}/${symbol}/mark-price/range${apiParams({})}`)
      if (!res.ok) return []
      const json: ApiMarkPrice[] = await res.json()
      return json.map(m => ({ symbol: m.symbol, timestamp: m.ts, markPrice: pf(m.mark_price), indexPrice: pf(m.index_price) }))
    },
    enabled: !!symbol, refetchInterval: 30_000, placeholderData: prev => prev,
  })
}
