import { useQuery } from '@tanstack/react-query'
import { parseMetricsText, aggregateMetrics, type ParsedMetrics } from '../lib/prometheus'

const REFETCH_INTERVAL = 5_000

async function fetchMetrics(): Promise<ParsedMetrics> {
  const res = await fetch('/metrics')
  if (!res.ok) throw new Error(`/metrics returned ${res.status}`)
  const text = await res.text()
  const samples = parseMetricsText(text)
  return aggregateMetrics(samples)
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: prev => prev,
  })
}
