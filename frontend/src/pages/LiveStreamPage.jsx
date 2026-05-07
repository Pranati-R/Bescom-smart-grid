import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Filter, Trash2 } from 'lucide-react'
import { CyberCard, GlowBadge, PageHeader, FilterPills } from '../components/ui/Components'
import { useAppStore } from '../store/useAppStore'

const SEVERITY_COLORS = {
  red:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400' },
  orange: { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400' },
  yellow: { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  text: 'text-yellow-400' },
  blue:   { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400' },
  green:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  cyan:   { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400' },
}

const TYPE_ICONS = {
  anomaly: '🔴', overload: '⚡', alert: '⚠️',
  forecast: '📊', recovery: '💚', ai: '🤖',
  security: '🔐', maintenance: '🔧',
}

const EVENT_TYPES = ['all', 'anomaly', 'overload', 'alert', 'forecast', 'recovery', 'security', 'ai']

export default function LiveStreamPage() {
  const { streamEvents, clearStream } = useAppStore()
  const [filter,        setFilter]  = useState('all')
  const [paused,        setPaused]  = useState(false)
  const [displayEvents, setDisplay] = useState([])
  const endRef = useRef(null)

  useEffect(() => {
    if (paused) return
    const filtered = filter === 'all'
      ? streamEvents
      : streamEvents.filter((e) => e.type === filter || e.severity === filter)
    setDisplay(filtered)
  }, [streamEvents, filter, paused])

  useEffect(() => {
    if (!paused) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayEvents, paused])

  const stats = {
    total:    streamEvents.length,
    critical: streamEvents.filter((e) => e.severity === 'critical').length,
    high:     streamEvents.filter((e) => e.severity === 'high').length,
    anomalies:streamEvents.filter((e) => e.type === 'anomaly').length,
  }

  const filterOpts = EVENT_TYPES.map((t) => ({
    label: t === 'all' ? 'All Events' : `${TYPE_ICONS[t] || ''} ${t}`,
    value: t,
  }))

  return (
    <div className="page-pad flex flex-col h-full space-y-4" style={{ minHeight: 0 }}>
      <PageHeader title="Live Intelligence Stream" subtitle="Real-time AI event stream from grid infrastructure">
        <button
          onClick={() => setPaused(!paused)}
          className={`btn-ghost text-xs py-1.5 px-3 ${paused ? 'border-emerald-500/40 text-emerald-400' : 'border-yellow-500/40 text-yellow-400'}`}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={clearStream} className="btn-ghost text-xs py-1.5 px-3 border-rose-500/20 text-rose-400">
          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
          Clear
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Total Events',  value: stats.total,    color: 'text-cyan-400' },
          { label: 'Critical',      value: stats.critical,  color: 'text-rose-400' },
          { label: 'High Priority', value: stats.high,      color: 'text-orange-400' },
          { label: 'Anomalies',     value: stats.anomalies, color: 'text-yellow-400' },
        ].map((s, i) => (
          <CyberCard key={i} className="p-3 text-center">
            <div className={`text-2xl font-bold font-orbitron ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </CyberCard>
        ))}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 overflow-x-auto pb-1">
        <FilterPills options={filterOpts} value={filter} onChange={setFilter} />
      </div>

      {/* Stream terminal */}
      <CyberCard className="flex-1 overflow-hidden flex flex-col min-h-[240px]">
        <div className="p-3 border-b border-slate-800/50 flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-xs text-slate-500 truncate">
            gridshield://stream — {displayEvents.length} events
          </span>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-yellow-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={`font-mono text-xs ${paused ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {paused ? 'PAUSED' : 'STREAMING'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 terminal-stream space-y-1.5">
          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <Activity className="w-8 h-8 mb-3" />
              <div className="text-sm">Waiting for events…</div>
              <div className="text-xs mt-1 text-center px-4">Connect to backend WebSocket to start receiving data</div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayEvents.map((event, i) => {
                const c = SEVERITY_COLORS[event.color] || SEVERITY_COLORS.blue
                return (
                  <motion.div
                    key={event.id || i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border ${c.border} ${c.bg} transition-opacity`}
                  >
                    <span className="text-base flex-shrink-0">{TYPE_ICONS[event.type] || '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{event.type}</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">{event.message}</div>
                    </div>
                    <GlowBadge severity={
                      event.severity === 'critical' ? 'critical' :
                      event.severity === 'high'     ? 'high' :
                      event.severity === 'success'  ? 'success' : 'info'
                    }>
                      {event.severity}
                    </GlowBadge>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
          <div ref={endRef} />
        </div>
      </CyberCard>
    </div>
  )
}
