/**
 * Ticket chat WebSocket client.
 *
 * Backend contract (when live):
 *   VITE_TICKET_WS_URL=wss://api.example.com/ws/tickets
 *
 * Client → server:
 *   { type: 'subscribe', ticketId, orgId }
 *   { type: 'message.send', ticketId, body, internal?, attachmentIds? }
 *   { type: 'typing', ticketId, isTyping }
 *   { type: 'message.read', ticketId, messageId }
 *
 * Server → client:
 *   { type: 'message.new', ticketId, message }
 *   { type: 'message.status', ticketId, messageId, status }
 *   { type: 'typing', ticketId, userName, isTyping }
 *   { type: 'presence', ticketId, userId, status }
 *   { type: 'error', message }
 *
 * Until VITE_TICKET_WS_URL is set, the hook stays idle and callers use REST.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TicketChatMessage } from '@/components/tickets/ticket-chat'

export type TicketWsPresence = 'online' | 'idle' | 'offline'
export type TicketWsDelivery = 'sent' | 'delivered' | 'read' | 'failed'

type ServerEvent =
  | { type: 'message.new'; ticketId: string; message: TicketChatMessage }
  | { type: 'message.status'; ticketId: string; messageId: string; status: TicketWsDelivery }
  | { type: 'typing'; ticketId: string; userName: string; isTyping: boolean }
  | { type: 'presence'; ticketId: string; userId: string; status: TicketWsPresence }
  | { type: 'error'; message: string }

function wsBaseUrl() {
  const raw = import.meta.env.VITE_TICKET_WS_URL as string | undefined
  return raw?.trim() || ''
}

export function useTicketChatSocket(
  ticketId: string | undefined,
  opts: {
    orgId?: string
    enabled?: boolean
    onMessage?: (message: TicketChatMessage) => void
    onStatus?: (messageId: string, status: TicketWsDelivery) => void
    onPresence?: (userId: string, status: TicketWsPresence) => void
    onTyping?: (userName: string, isTyping: boolean) => void
  } = {},
) {
  const { orgId, enabled = true, onMessage, onStatus, onPresence, onTyping } = opts
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const attemptsRef = useRef(0)
  const timerRef = useRef(0)
  const mountedRef = useRef(true)
  const cbs = useRef({ onMessage, onStatus, onPresence, onTyping })
  cbs.current = { onMessage, onStatus, onPresence, onTyping }

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(payload))
    return true
  }, [])

  const disconnect = useCallback(() => {
    window.clearTimeout(timerRef.current)
    wsRef.current?.close()
    wsRef.current = null
    setConnected(false)
  }, [])

  const connect = useCallback(() => {
    const url = wsBaseUrl()
    if (!url || !ticketId || !enabled) {
      setConnected(false)
      return
    }

    disconnect()
    try {
      const qs = new URLSearchParams()
      qs.set('ticketId', ticketId)
      if (orgId) qs.set('orgId', orgId)
      const sep = url.includes('?') ? '&' : '?'
      const ws = new WebSocket(`${url}${sep}${qs.toString()}`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        attemptsRef.current = 0
        setConnected(true)
        setError(null)
        ws.send(JSON.stringify({ type: 'subscribe', ticketId, orgId }))
      }

      ws.onmessage = (ev) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(String(ev.data)) as ServerEvent
          if (data.type === 'message.new') cbs.current.onMessage?.(data.message)
          if (data.type === 'message.status') cbs.current.onStatus?.(data.messageId, data.status)
          if (data.type === 'presence') cbs.current.onPresence?.(data.userId, data.status)
          if (data.type === 'typing') cbs.current.onTyping?.(data.userName, data.isTyping)
          if (data.type === 'error') setError(data.message)
        } catch {
          setError('Invalid chat event from server')
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setError('Chat socket error')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        wsRef.current = null
        if (!enabled || !wsBaseUrl()) return
        const attempt = Math.min(attemptsRef.current + 1, 8)
        attemptsRef.current = attempt
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15000)
        timerRef.current = window.setTimeout(connect, delay)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open chat socket')
      setConnected(false)
    }
  }, [ticketId, orgId, enabled, disconnect])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [connect, disconnect])

  const sendMessage = useCallback(
    (body: string, internal?: boolean, attachmentIds?: string[]) =>
      sendJson({ type: 'message.send', ticketId, body, internal: !!internal, attachmentIds }),
    [sendJson, ticketId],
  )

  const sendTyping = useCallback(
    (isTyping: boolean) => sendJson({ type: 'typing', ticketId, isTyping }),
    [sendJson, ticketId],
  )

  const markRead = useCallback(
    (messageId: string) => sendJson({ type: 'message.read', ticketId, messageId }),
    [sendJson, ticketId],
  )

  return {
    /** True when VITE_TICKET_WS_URL is configured (backend expected). */
    configured: Boolean(wsBaseUrl()),
    connected,
    error,
    reconnect: connect,
    disconnect,
    sendMessage,
    sendTyping,
    markRead,
  }
}
