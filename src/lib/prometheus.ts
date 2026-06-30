// Prometheus text-format parser for binance metrics
// Parses the /metrics endpoint exposed by binance-server

export interface MetricSample {
  name: string
  labels: Record<string, string>
  value: number
}

export interface ParsedMetrics {
  raw: MetricSample[]
  ingestRate: number
  streamsActive: number
  consumerLag: number
  rejectRate: number
  deadletterCount: number
  deadletterRate: number
  idempotencyHits: number
  staleRate: number
  latency: {
    dispatchP50: number
    dispatchP95: number
    dispatchP99: number
    storageP50: number
    storageP95: number
    storageP99: number
  }
  productLines: ProductLineMetrics[]
  slos: SloStatus[]
}

export interface ProductLineMetrics {
  productLine: string
  events: number
  streamsActive: number
  rejected: number
  stale: number
}

export interface SloStatus {
  name: string
  value: number
  target: number
  unit: string
  healthy: boolean
}

/** Parse Prometheus text format into structured MetricSample[] */
export function parseMetricsText(text: string): MetricSample[] {
  const samples: MetricSample[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^(\w+)\s*(\{[^}]*\})?\s*([\d.e+\-]+(?:\s+\d+)?)/)
    if (!match) continue

    const name = match[1]
    const labelsStr = match[2] ?? '{}'
    const value = parseFloat(match[3])

    const labels: Record<string, string> = {}
    if (labelsStr.length > 2) {
      const inner = labelsStr.slice(1, -1)
      for (const pair of inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)) {
        const eq = pair.indexOf('=')
        if (eq === -1) continue
        const key = pair.slice(0, eq).trim()
        const val = pair.slice(eq + 1).trim().replace(/^"|"$/g, '')
        labels[key] = val
      }
    }

    samples.push({ name, labels, value })
  }

  return samples
}

/** Aggregate raw samples into dashboard-ready ParsedMetrics */
export function aggregateMetrics(samples: MetricSample[]): ParsedMetrics {
  const byName = new Map<string, MetricSample[]>()
  for (const s of samples) {
    const arr = byName.get(s.name) ?? []
    arr.push(s)
    byName.set(s.name, arr)
  }

  const getGauge = (name: string, labels?: Record<string, string>): number => {
    const arr = byName.get(name)
    if (!arr) return 0
    if (!labels) return arr[0]?.value ?? 0
    const found = arr.find(s =>
      Object.entries(labels).every(([k, v]) => s.labels[k] === v),
    )
    return found?.value ?? 0
  }

  const getSum = (name: string): number => {
    const arr = byName.get(name)
    if (!arr) return 0
    return arr.reduce((sum, s) => sum + s.value, 0)
  }

  const getSumLabel = (name: string, label: string, value: string): number => {
    const arr = byName.get(name)
    if (!arr) return 0
    return arr.filter(s => s.labels[label] === value).reduce((sum, s) => sum + s.value, 0)
  }

  const getQuantile = (name: string, q: string): number => {
    const arr = byName.get(name)
    if (!arr) return 0
    const found = arr.find(s => s.labels.quantile === q)
    return found?.value ?? 0
  }

  const totalEvents = getSum('binance_ingest_events_total')
  const totalRejected = getSum('binance_ingest_rejected_total')
  const totalDeadletter = getGauge('binance_deadletter_total')
  const totalStale = getSum('binance_event_stale_total')

  const rejectRate =
    totalEvents + totalRejected > 0
      ? (totalRejected / (totalEvents + totalRejected)) * 100
      : 0
  const deadletterRate = totalEvents > 0 ? (totalDeadletter / totalEvents) * 100 : 0
  const staleRate = totalEvents > 0 ? (totalStale / totalEvents) * 100 : 0

  // Product lines
  const plSet = new Set<string>()
  for (const s of samples) {
    if (s.labels.product_line) plSet.add(s.labels.product_line)
  }

  const productLines: ProductLineMetrics[] = Array.from(plSet).map(pl => ({
    productLine: pl,
    events: getSumLabel('binance_ingest_events_total', 'product_line', pl),
    streamsActive: getGauge('binance_stream_active', { product_line: pl }),
    rejected: getSumLabel('binance_ingest_rejected_total', 'product_line', pl),
    stale: getSumLabel('binance_event_stale_total', 'product_line', pl),
  }))

  // SLOs
  const slos: SloStatus[] = [
    {
      name: 'Availability',
      value:
        totalEvents + totalRejected > 0
          ? (totalEvents / (totalEvents + totalRejected)) * 100
          : 100,
      target: 99.9,
      unit: '%',
      healthy:
        totalEvents + totalRejected > 0
          ? (totalEvents / (totalEvents + totalRejected)) * 100 >= 99.9
          : true,
    },
    {
      name: 'Dispatch P99',
      value: getQuantile('binance_dispatch_latency_seconds', '0.99'),
      target: 1.0,
      unit: 's',
      healthy: getQuantile('binance_dispatch_latency_seconds', '0.99') <= 1.0,
    },
    {
      name: 'Storage P99',
      value: getQuantile('binance_storage_write_latency_seconds', '0.99'),
      target: 0.5,
      unit: 's',
      healthy: getQuantile('binance_storage_write_latency_seconds', '0.99') <= 0.5,
    },
    {
      name: 'Deadletter Rate',
      value: deadletterRate,
      target: 0.1,
      unit: '%',
      healthy: deadletterRate <= 0.1,
    },
  ]

  return {
    raw: samples,
    ingestRate: totalEvents,
    streamsActive: getSum('binance_stream_active'),
    consumerLag: getGauge('binance_natsx_consumer_lag'),
    rejectRate,
    deadletterCount: totalDeadletter,
    deadletterRate,
    idempotencyHits: getSum('binance_idempotency_hits_total'),
    staleRate,
    latency: {
      dispatchP50: getQuantile('binance_dispatch_latency_seconds', '0.5'),
      dispatchP95: getQuantile('binance_dispatch_latency_seconds', '0.95'),
      dispatchP99: getQuantile('binance_dispatch_latency_seconds', '0.99'),
      storageP50: getQuantile('binance_storage_write_latency_seconds', '0.5'),
      storageP95: getQuantile('binance_storage_write_latency_seconds', '0.95'),
      storageP99: getQuantile('binance_storage_write_latency_seconds', '0.99'),
    },
    productLines,
    slos,
  }
}
