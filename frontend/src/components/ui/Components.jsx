import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── MetricCard ─────────────────────────────────────────────────────────── */
export function MetricCard({ title, value, unit, icon: Icon, change, color = 'blue', prefix = '', trend, subtitle, onClick }) {
  const [displayVal, setDisplayVal] = useState(0)

  const colors = {
    blue:   { text: 'text-cyan-400',    glow: 'shadow-cyan-500/20',    border: 'border-cyan-500/20',    bg: 'bg-cyan-500/10' },
    green:  { text: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
    red:    { text: 'text-rose-400',    glow: 'shadow-rose-500/20',    border: 'border-rose-500/20',    bg: 'bg-rose-500/10' },
    orange: { text: 'text-orange-400',  glow: 'shadow-orange-500/20',  border: 'border-orange-500/20',  bg: 'bg-orange-500/10' },
    purple: { text: 'text-purple-400',  glow: 'shadow-purple-500/20',  border: 'border-purple-500/20',  bg: 'bg-purple-500/10' },
    gold:   { text: 'text-yellow-400',  glow: 'shadow-yellow-500/20',  border: 'border-yellow-500/20',  bg: 'bg-yellow-500/10' },
  }
  const c = colors[color] || colors.blue

  useEffect(() => {
    if (!value || isNaN(Number(value))) return
    const numVal = Number(value)
    const duration = 1000
    const start = performance.now()
    const anim = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayVal(Math.round(numVal * eased))
      if (p < 1) requestAnimationFrame(anim)
    }
    requestAnimationFrame(anim)
  }, [value])

  const formatNumber = (n) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  const displayValue = isNaN(Number(value))
    ? value
    : typeof value === 'number' && value > 999
    ? formatNumber(displayVal)
    : displayVal

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`metric-card p-4 border ${c.border} shadow-lg ${c.glow} ${onClick ? 'cursor-pointer' : ''} rounded-xl`}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${c.text} opacity-50`} />
      {/* Corner indicator */}
      <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${c.bg} border ${c.border} animate-pulse`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
          {Icon && <Icon className={`w-4 h-4 ${c.text}`} />}
        </div>
        {change !== undefined && (
          <div className={`text-xs px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className={`text-xl md:text-2xl font-bold font-orbitron ${c.text} mb-1 leading-none`} style={{ textShadow: '0 0 16px currentColor' }}>
        {prefix}{displayValue}{unit && <span className="text-xs md:text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </div>

      <div className="text-xs sm:text-sm text-slate-400 font-medium truncate">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-0.5 truncate">{subtitle}</div>}

      {trend && (
        <div className="mt-2 h-7 flex items-end gap-0.5">
          {trend.map((v, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${c.bg} border-t ${c.border}`}
              style={{ height: `${Math.max(10, v)}%`, opacity: 0.4 + (i / trend.length) * 0.6 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── GlowBadge ──────────────────────────────────────────────────────────── */
export function GlowBadge({ children, severity = 'info' }) {
  const classes = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
    info:     'badge-info',
    success:  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes[severity] || classes.info}`}>
      {children}
    </span>
  )
}

/* ─── CyberCard ──────────────────────────────────────────────────────────── */
export function CyberCard({ children, className = '', glow = false, onClick }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      onClick={onClick}
      className={`cyber-card rounded-xl ${glow ? 'border-animated' : ''} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
  )
}

/* ─── LoadingSkeleton ────────────────────────────────────────────────────── */
export function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
      ))}
    </div>
  )
}

/* ─── RadialGauge ────────────────────────────────────────────────────────── */
export function RadialGauge({ value = 0, max = 100, label, color = '#00d4ff', size = 110 }) {
  const pct  = Math.min(value / max, 1)
  const r    = (size - 18) / 2
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const gap  = circ - dash

  const getColor = () => {
    if (pct > 0.8) return '#ff2d55'
    if (pct > 0.6) return '#ff6b35'
    if (pct > 0.4) return '#ffd700'
    return color
  }
  const c = getColor()

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth={7} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={c} strokeWidth={7} strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${gap}` }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 5px ${c})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold font-orbitron" style={{ color: c }}>{Math.round(value)}</span>
          <span className="text-xs text-slate-500">/{max}</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>}
    </div>
  )
}

/* ─── StatusDot ──────────────────────────────────────────────────────────── */
export function StatusDot({ status }) {
  const colors = {
    active: '#00ff88', normal: '#00ff88', online: '#00ff88', healthy: '#00ff88', running: '#00ff88',
    warning: '#ffd700', connected: '#00ff88',
    critical: '#ff2d55', fault: '#ff2d55',
    maintenance: '#9b59b6',
    offline: '#64748b',
  }
  const color = colors[status] || '#64748b'
  return (
    <span className="relative inline-flex">
      <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.35 }} />
    </span>
  )
}

/* ─── DataTable — responsive (cards on mobile, table on desktop) ─────────── */
export function DataTable({ columns, data, onRowClick, loading = false }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-3xl mb-3">🔍</div>
        <div className="text-sm">No data found</div>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile cards (< md) ── */}
      <div className="mobile-cards p-3">
        {data.map((row, i) => (
          <motion.div
            key={row.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onRowClick?.(row)}
            className={`p-3 rounded-lg border border-slate-700/40 bg-slate-800/20 space-y-1.5 ${onRowClick ? 'cursor-pointer hover:border-cyan-500/30' : ''} transition-colors`}
          >
            {columns.slice(0, 5).map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs text-slate-500 uppercase tracking-wider flex-shrink-0">{col.label}</span>
                <span className="text-xs text-right min-w-0 truncate">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* ── Desktop table (≥ md) ── */}
      <div className="desktop-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-500/10">
              {columns.map((col) => (
                <th key={col.key} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence>
              {data.map((row, i) => (
                <motion.tr
                  key={row.id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-cyan-500/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ─── Notification toast ─────────────────────────────────────────────────── */
export function Notification({ type = 'info', message, onClose }) {
  const colors = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    error:   'border-rose-500/40 bg-rose-500/10 text-rose-400',
    warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    info:    'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  }
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`flex items-center gap-3 p-4 rounded-xl border ${colors[type]} backdrop-blur-lg max-w-sm shadow-xl`}
      role="alert"
    >
      <span className="flex-1 text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
      )}
    </motion.div>
  )
}

/* ─── Page Header (reusable) ─────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
      <div className="min-w-0">
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap sm:ml-auto">{children}</div>}
    </div>
  )
}

/* ─── FilterPill set ─────────────────────────────────────────────────────── */
export function FilterPills({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {options.map((opt) => {
        const label = typeof opt === 'string' ? opt : opt.label
        const val   = typeof opt === 'string' ? opt : opt.value
        const active = value === val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              active
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── MLModelBadge — shows whether inference is real or fallback ─────────── */
export function MLModelBadge({ source }) {
  if (!source) return null
  const isReal = source === 'model'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      isReal
        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isReal ? 'bg-purple-400' : 'bg-slate-400'}`} />
      {isReal ? 'ML Model' : 'Fallback'}
    </span>
  )
}
