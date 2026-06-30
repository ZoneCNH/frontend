import { useQuery } from '@tanstack/react-query'

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  uptime?: string
  version?: string
}

async function checkEndpoint(url: string): Promise<HealthStatus> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const json: Record<string, unknown> = await res.json().catch(() => ({}))
      return {
        status: 'ok',
        uptime: typeof json.uptime === 'string' ? json.uptime : undefined,
        version: typeof json.version === 'string' ? json.version : undefined,
      }
    }
    return { status: 'degraded' }
  } catch {
    return { status: 'down' }
  }
}

export function useServerHealth() {
  return useQuery({
    queryKey: ['health', 'server'],
    queryFn: async () => {
      const [health, ready] = await Promise.all([
        checkEndpoint('/healthz'),
        checkEndpoint('/readyz'),
      ])
      return {
        process: 'binance-server',
        port: 8090,
        health,
        ready,
        memoryMax: '4G',
        status:
          health.status === 'ok' && ready.status === 'ok'
            ? ('healthy' as const)
            : health.status === 'down'
              ? ('critical' as const)
              : ('warning' as const),
      }
    },
    refetchInterval: 10_000,
    placeholderData: prev => prev,
  })
}

export function useClientHealth() {
  return useQuery({
    queryKey: ['health', 'client'],
    queryFn: async () => {
      const health: HealthStatus = { status: 'ok' }
      const ready: HealthStatus = { status: 'ok' }
      return {
        process: 'binance-client' as const,
        port: 8082,
        health,
        ready,
        memoryMax: '512M',
        status: 'healthy' as const,
      }
    },
    refetchInterval: 10_000,
    placeholderData: prev => prev,
  })
}

export const INFRA_SERVICES = [
  { name: 'NATS', port: 4222, key: 'nats' },
  { name: 'Redis', port: 6379, key: 'redis' },
  { name: 'PostgreSQL', port: 5432, key: 'postgres' },
  { name: 'TDengine', port: 6030, key: 'tdengine' },
  { name: 'Kafka', port: 9092, key: 'kafka' },
  { name: 'ClickHouse', port: 9000, key: 'clickhouse' },
  { name: 'OSS', port: null, key: 'oss' },
  { name: 'OTel Collector', port: 4318, key: 'otel' },
] as const
