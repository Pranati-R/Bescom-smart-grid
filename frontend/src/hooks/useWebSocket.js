import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'

// Use Vite proxy in dev so ws:// works without CORS issues.
// In production, set VITE_WS_URL = 'wss://your-domain.com'
const WS_BASE = import.meta.env.VITE_WS_URL || ''

function buildWsUrl(path) {
  if (WS_BASE) return `${WS_BASE}${path}`
  // Auto-derive from current location (works through Vite proxy)
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}${path}`
}

export function useWebSocket() {
  const { setMetrics, addStreamEvent, addAlert, setWsConnected } = useAppStore()

  const metricsWs  = useRef(null)
  const streamWs   = useRef(null)
  const alertsWs   = useRef(null)

  const metricsRetry = useRef(null)
  const streamRetry  = useRef(null)
  const alertsRetry  = useRef(null)

  const unmounted = useRef(false)

  // ── Metrics WS ───────────────────────────────────────────────────────────
  const connectMetrics = useCallback(() => {
    if (unmounted.current) return
    try {
      const ws = new WebSocket(buildWsUrl('/ws/metrics'))
      metricsWs.current = ws

      ws.onopen = () => {
        if (!unmounted.current) setWsConnected(true)
      }
      ws.onmessage = (e) => {
        if (unmounted.current) return
        try { setMetrics(JSON.parse(e.data)) } catch {}
      }
      ws.onclose = () => {
        setWsConnected(false)
        if (!unmounted.current) {
          metricsRetry.current = setTimeout(connectMetrics, 4000)
        }
      }
      ws.onerror = () => ws.close()
    } catch {}
  }, [setMetrics, setWsConnected])

  // ── Stream WS ─────────────────────────────────────────────────────────────
  const connectStream = useCallback(() => {
    if (unmounted.current) return
    try {
      const ws = new WebSocket(buildWsUrl('/ws/stream'))
      streamWs.current = ws

      ws.onmessage = (e) => {
        if (unmounted.current) return
        try { addStreamEvent(JSON.parse(e.data)) } catch {}
      }
      ws.onclose = () => {
        if (!unmounted.current) {
          streamRetry.current = setTimeout(connectStream, 4000)
        }
      }
      ws.onerror = () => ws.close()
    } catch {}
  }, [addStreamEvent])

  // ── Alerts WS ─────────────────────────────────────────────────────────────
  const connectAlerts = useCallback(() => {
    if (unmounted.current) return
    try {
      const ws = new WebSocket(buildWsUrl('/ws/alerts'))
      alertsWs.current = ws

      ws.onmessage = (e) => {
        if (unmounted.current) return
        try {
          const alert = JSON.parse(e.data)
          addAlert(alert)
        } catch {}
      }
      ws.onclose = () => {
        if (!unmounted.current) {
          alertsRetry.current = setTimeout(connectAlerts, 6000)
        }
      }
      ws.onerror = () => ws.close()
    } catch {}
  }, [addAlert])

  useEffect(() => {
    unmounted.current = false
    connectMetrics()
    connectStream()
    connectAlerts()

    return () => {
      unmounted.current = true
      clearTimeout(metricsRetry.current)
      clearTimeout(streamRetry.current)
      clearTimeout(alertsRetry.current)
      metricsWs.current?.close()
      streamWs.current?.close()
      alertsWs.current?.close()
    }
  }, [connectMetrics, connectStream, connectAlerts])
}
