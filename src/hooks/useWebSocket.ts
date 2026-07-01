import { useEffect, useRef, useCallback, useState } from 'react'
import { parseMetricsText, aggregateMetrics, type ParsedMetrics } from '../lib/prometheus'

const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = `${proto}//${window.location.host}/ws`

interface WsUpdate { type: string; ts: string; metrics: string | null; health: string | null }

export function useMetricsWs(): { data: ParsedMetrics | undefined; isConnected: boolean; latency: number } {
  const [data, setData] = useState<ParsedMetrics>()
  const [isConnected, setIsConnected] = useState(false)
  const [latency, setLatency] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)
    ws.onmessage = (event) => {
      try {
        const update: WsUpdate = JSON.parse(event.data)
        if (update.metrics) {
          setData(aggregateMetrics(parseMetricsText(update.metrics)))
        }
        setLatency(Date.now() - new Date(update.ts).getTime())
      } catch { /* skip */ }
    }
    ws.onclose = () => { setIsConnected(false); reconnectRef.current = setTimeout(connect, 3000) }
    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => { connect(); return () => { clearTimeout(reconnectRef.current); wsRef.current?.close() } }, [connect])

  return { data, isConnected, latency }
}
