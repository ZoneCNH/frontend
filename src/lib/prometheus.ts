// Prometheus text-format parser — matched to real binance-server /metrics from jp1

export interface MetricSample { name: string; labels: Record<string, string>; value: number }

export interface ParsedMetrics {
  raw: MetricSample[]
  ingestAccepted: number
  ingestRejected: number
  rejectRate: number
  dispatchTotal: number
  dispatchRetries: number
  idempotencyAccepted: number
  deadletterCount: number
  deadletterRate: number
  gapsDetected: number
  gapsRepairRequired: number
  streamLag: number
  activeStreams: number
  clockSkew: number
  bandwidthTotal: number
  storageBytes: number
  slos: SloStatus[]
}

export interface SloStatus { name: string; value: number; target: number; unit: string; healthy: boolean }

export function parseMetricsText(text: string): MetricSample[] {
  const samples: MetricSample[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^(\w+)\s*(\{[^}]*\})?\s*([\d.e+\-]+(?:\s+\d+)?)/)
    if (!match) continue
    const labelsStr = match[2] ?? '{}'
    const labels: Record<string, string> = {}
    if (labelsStr.length > 2) {
      for (const pair of labelsStr.slice(1, -1).split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)) {
        const eq = pair.indexOf('=')
        if (eq === -1) continue
        labels[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim().replace(/^"|"$/g, '')
      }
    }
    samples.push({ name: match[1], labels, value: parseFloat(match[3]) })
  }
  return samples
}

export function aggregateMetrics(samples: MetricSample[]): ParsedMetrics {
  const byName = new Map<string, MetricSample[]>()
  for (const s of samples) {
    const arr = byName.get(s.name) ?? []; arr.push(s); byName.set(s.name, arr)
  }

  const getGauge = (name: string): number => byName.get(name)?.[0]?.value ?? 0
  const getSum = (name: string): number => (byName.get(name) ?? []).reduce((s, m) => s + m.value, 0)
  const getBy = (name: string, label: string, val: string): number =>
    (byName.get(name) ?? []).filter(m => m.labels[label] === val).reduce((s, m) => s + m.value, 0)

  const ingestAccepted = getBy('binance_ingest_events_total', 'result', 'accepted')
  const ingestRejected = getBy('binance_ingest_events_total', 'result', 'rejected')
  const totalIngest = ingestAccepted + ingestRejected
  const deadletterCount = getGauge('binance_deadletter_total')
  const gapsDetected = getSum('binance_gap_detected_total')

  return {
    raw: samples,
    ingestAccepted, ingestRejected,
    rejectRate: totalIngest > 0 ? (ingestRejected / totalIngest) * 100 : 0,
    dispatchTotal: getBy('binance_dispatch_total', 'result', 'success'),
    dispatchRetries: getGauge('binance_dispatch_retry_total'),
    idempotencyAccepted: getBy('binance_idempotency_total', 'result', 'accepted'),
    deadletterCount,
    deadletterRate: totalIngest > 0 ? (deadletterCount / totalIngest) * 100 : 0,
    gapsDetected,
    gapsRepairRequired: getSum('binance_gap_repair_required'),
    streamLag: getGauge('binance_stream_lag_seconds'),
    activeStreams: (byName.get('binance_stream_state') ?? []).filter(m => m.labels.state === 'active').length,
    clockSkew: getGauge('binance_clock_skew_seconds'),
    bandwidthTotal: getSum('bandwidth_bytes_total'),
    storageBytes: getSum('storage_bytes_total'),
    slos: [
      { name: 'Availability', value: totalIngest > 0 ? (ingestAccepted / totalIngest) * 100 : 100, target: 99.9, unit: '%', healthy: totalIngest > 0 ? (ingestAccepted / totalIngest) * 100 >= 99.9 : true },
      { name: 'Reject Rate', value: totalIngest > 0 ? (ingestRejected / totalIngest) * 100 : 0, target: 5, unit: '%', healthy: totalIngest > 0 ? (ingestRejected / totalIngest) * 100 <= 5 : true },
      { name: 'Deadletter', value: deadletterCount, target: 0, unit: '', healthy: deadletterCount === 0 },
      { name: 'Gaps', value: gapsDetected, target: 0, unit: '', healthy: gapsDetected === 0 },
    ],
  }
}
