import { useEffect, useRef, useCallback, useState } from 'react'

const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = `${proto}//${window.location.host}/ws`

interface WsMsg {
  type: string; ts: string
  ticks?: Record<string, { ask_price: string; bid_price: string; ts: string }>
}

export function useMarketWs(symbol: string): { price: number | null; isLive: boolean } {
  const [price, setPrice] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const key = symbol.includes(':') ? symbol : 'spot:' + symbol

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onopen = () => setIsLive(true)
    ws.onmessage = (event) => {
      try {
        const msg: WsMsg = JSON.parse(event.data)
        if (msg.type === 'market' && msg.ticks?.[key]) {
          setPrice(parseFloat(msg.ticks[key].ask_price))
        }
      } catch { /* skip */ }
    }
    ws.onclose = () => { setIsLive(false); reconnectRef.current = setTimeout(connect, 3000) }
    ws.onerror = () => ws.close()
  }, [key])

  useEffect(() => { connect(); return () => { clearTimeout(reconnectRef.current); wsRef.current?.close() } }, [connect])

  return { price, isLive }
}
