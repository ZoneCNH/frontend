import { useQuery } from '@tanstack/react-query'

// Types matching binance-server REST API responses

export interface Tick {
  symbol: string
  price: number
  volume: number
  timestamp: string
  product_line: string
}

export interface Bar {
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: string
  interval: string
}

export interface DepthLevel {
  price: number
  quantity: number
}

export interface Depth {
  symbol: string
  bids: DepthLevel[]
  asks: DepthLevel[]
  timestamp: string
}

export interface Trade {
  id: string
  symbol: string
  price: number
  quantity: number
  side: 'buy' | 'sell'
  timestamp: string
}

export interface FundingRate {
  symbol: string
  rate: number
  markPrice: number
  indexPrice: number
  timestamp: string
}

export interface MarkPrice {
  symbol: string
  markPrice: number
  indexPrice: number
  timestamp: string
}

type TimeRange = { from?: string; to?: string }

function toParams(range?: TimeRange): string {
  const params = new URLSearchParams()
  if (range?.from) params.set('from', range.from)
  if (range?.to) params.set('to', range.to)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// --- Hooks ---

export function useTicks(symbol: string, range?: TimeRange) {
  return useQuery({
    queryKey: ['ticks', symbol, range],
    queryFn: async (): Promise<Tick[]> => {
      const res = await fetch(`/api/v1/market/ticks/${symbol}${toParams(range)}`)
      if (!res.ok) throw new Error(`ticks: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 5_000,
    placeholderData: prev => prev,
  })
}

export function useBars(symbol: string, range?: TimeRange) {
  return useQuery({
    queryKey: ['bars', symbol, range],
    queryFn: async (): Promise<Bar[]> => {
      const res = await fetch(`/api/v1/market/bars/${symbol}${toParams(range)}`)
      if (!res.ok) throw new Error(`bars: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 15_000,
    placeholderData: prev => prev,
  })
}

export function useDepth(symbol: string) {
  return useQuery({
    queryKey: ['depth', symbol],
    queryFn: async (): Promise<Depth> => {
      const res = await fetch(`/api/v1/market/depth/${symbol}`)
      if (!res.ok) throw new Error(`depth: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 5_000,
    placeholderData: prev => prev,
  })
}

export function useTrades(symbol: string) {
  return useQuery({
    queryKey: ['trades', symbol],
    queryFn: async (): Promise<Trade[]> => {
      const res = await fetch(`/api/v1/market/trades/${symbol}`)
      if (!res.ok) throw new Error(`trades: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 3_000,
    placeholderData: prev => prev,
  })
}

export function useFundingRate(symbol: string) {
  return useQuery({
    queryKey: ['funding-rate', symbol],
    queryFn: async (): Promise<FundingRate[]> => {
      const res = await fetch(`/api/v1/market/funding-rate/${symbol}`)
      if (!res.ok) throw new Error(`funding-rate: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 30_000,
    placeholderData: prev => prev,
  })
}

export function useMarkPrice(symbol: string) {
  return useQuery({
    queryKey: ['mark-price', symbol],
    queryFn: async (): Promise<MarkPrice[]> => {
      const res = await fetch(`/api/v1/market/mark-price/${symbol}`)
      if (!res.ok) throw new Error(`mark-price: ${res.status}`)
      return res.json()
    },
    enabled: !!symbol,
    refetchInterval: 30_000,
    placeholderData: prev => prev,
  })
}
