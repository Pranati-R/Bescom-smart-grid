import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Thermometer, Activity, AlertTriangle, X, RefreshCw } from 'lucide-react'
import { gridApi, mlApi } from '../services/api'
import { CyberCard, GlowBadge, RadialGauge, MetricCard, PageHeader, FilterPills, MLModelBadge } from '../components/ui/Components'
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts'

const FILTER_OPTS = ['all', 'critical', 'warning', 'overload']

function TransformerCard({ txr, onClick }) {
  const borderColors = {
    critical: 'border-rose-500/40',
    warning:  'border-orange-500/30',
    normal:   'border-emerald-500/15',
  }
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(txr)}
      className={`cyber-card p-4 cursor-pointer border rounded-xl ${borderColors[txr.status] || 'border-cyan-500/15'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-cyan-400 font-semibold truncate">{txr.code}</span>
        <GlowBadge severity={txr.status === 'critical' ? 'critical' : txr.status === 'warning' ? 'high' : 'success'}>
          {txr.status}
        </GlowBadge>
      </div>

      <div className="flex justify-around mb-3">
        <RadialGauge
          value={txr.health_score || 0} max={100} label="Health"
          color="#00ff88" size={68}
        />
        <RadialGauge
          value={txr.load_pct || 0} max={100} label="Load %"
          color={(txr.load_pct || 0) > 80 ? '#ff2d55' : (txr.load_pct || 0) > 60 ? '#ff6b35' : '#00d4ff'}
          size={68}
        />
      </div>

      <div className="space-y-1.5">
        {[
          { icon: Thermometer, label: 'Temp',         value: `${(txr.temperature_c   || 0).toFixed(0)}°C`, hot: (txr.temperature_c   || 0) > 70 },
          { icon: Zap,         label: 'Capacity',     value: `${txr.capacity_kva} kVA`                                                          },
          { icon: Activity,    label: 'Overload Risk',value: `${((txr.overload_probability || 0)*100).toFixed(0)}%`, hot: (txr.overload_probability||0) > 0.5 },
        ].map(({ icon: Icon, label, value, hot }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-500"><Icon className="w-3 h-3 flex-shrink-0" />{label}</div>
            <span className={`font-mono flex-shrink-0 ${hot ? 'text-rose-400' : 'text-slate-300'}`}>{value}</span>
          </div>
        ))}
      </div>

      {(txr.overload_probability || 0) > 0.7 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Overload risk — Inspect immediately</span>
        </div>
      )}
    </motion.div>
  )
}

export default function TransformerPage() {
  const [transformers, setTransformers] = useState([])
  const [selected,     setSelected]     = useState(null)
  const [detail,       setDetail]       = useState(null)
  const [mlPred,       setMlPred]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [filter,       setFilter]       = useState('all')

  const load = useCallback((showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    gridApi.transformers()
      .then(setTransformers)
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selected) { setDetail(null); setMlPred(null); return }
    setDetail(null); setMlPred(null)
    gridApi.transformerDetail(selected.id).then(setDetail).catch(() => {})
    // ML overload prediction
    const loadPct = (selected.current_load_kw || 0) / Math.max((selected.capacity_kva || 1) * 0.8, 1) * 100
    mlApi.predictOverload({
      transformer_id: selected.id,
      load_pct:        loadPct,
      temperature_c:   selected.temperature_celsius || selected.temperature_c || 55,
      oil_level:       selected.oil_level || 90,
      vibration:       selected.vibration_level || 0.3,
    }).then(setMlPred).catch(() => {})
  }, [selected])

  const filtered = transformers.filter((t) => {
    if (filter === 'critical') return t.status === 'critical'
    if (filter === 'warning')  return t.status === 'warning'
    if (filter === 'overload') return (t.overload_probability || 0) > 0.5
    return true
  })

  const criticalCount = transformers.filter((t) => t.status === 'critical').length
  const warningCount  = transformers.filter((t) => t.status === 'warning').length
  const avgHealth     = transformers.reduce((s, t) => s + (t.health_score || 0), 0) / Math.max(transformers.length, 1)
  const overloadCount = transformers.filter((t) => (t.overload_probability || 0) > 0.5).length

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Transformer Digital Twin" subtitle="Real-time health monitoring with AI predictive failure analysis">
        <FilterPills
          options={FILTER_OPTS.map((f) => ({ label: f.charAt(0).toUpperCase() + f.slice(1), value: f }))}
          value={filter}
          onChange={setFilter}
        />
        <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost text-xs py-1.5 px-3">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </PageHeader>

      <div className="kpi-grid">
        <MetricCard title="Total Transformers" value={transformers.length}                    icon={Zap}          color="blue" />
        <MetricCard title="Critical Status"     value={criticalCount}                         icon={AlertTriangle} color="red" />
        <MetricCard title="Warning Status"      value={warningCount}                          icon={Activity}      color="orange" />
        <MetricCard title="Avg Health"          value={`${avgHealth.toFixed(0)}%`}            icon={Thermometer}   color="green" />
        <MetricCard title="Overload Risk"       value={overloadCount}                         icon={Zap}          color="gold" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Grid */}
        <div className={`${selected ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">{filtered.length} transformers shown</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.slice(0, 21).map((txr, i) => (
                  <motion.div
                    key={txr.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <TransformerCard txr={txr} onClick={setSelected} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="xl:col-span-1"
            >
              <CyberCard className="p-4 sm:p-5 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-mono text-sm text-cyan-400 font-bold">{selected.code}</div>
                    <div className="text-xs text-slate-500">Digital Twin View</div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close detail panel"
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Animated visualization */}
                <div className="h-28 mb-4 rounded-xl border border-cyan-500/10 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 flex items-center justify-center relative overflow-hidden">
                  <div className="text-3xl z-10">⚡</div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 border-2 border-cyan-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute w-14 h-14 border-2 border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    <div className="absolute w-8  h-8  border   border-cyan-500/15 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                  </div>
                </div>

                {/* ML Overload Prediction */}
                {mlPred && (
                  <div className={`mb-4 p-3 rounded-xl border ${(mlPred.overload_probability || 0) > 0.5 ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">AI Overload Prediction</span>
                      <MLModelBadge source={mlPred.model_source} />
                    </div>
                    <div className={`text-xl font-bold font-orbitron ${(mlPred.overload_probability || 0) > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {((mlPred.overload_probability || 0) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{mlPred.recommended_action}</div>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-2">
                  {[
                    { label: 'Health Score',     value: `${(selected.health_score || 0).toFixed(0)}%`,                            color: 'text-emerald-400' },
                    { label: 'Load',             value: `${(selected.load_pct || 0).toFixed(0)}%`,                                 color: (selected.load_pct||0) > 80 ? 'text-rose-400' : 'text-cyan-400' },
                    { label: 'Temperature',      value: `${(selected.temperature_c || selected.temperature_celsius || 0).toFixed(0)}°C`, color: (selected.temperature_c||selected.temperature_celsius||0) > 70 ? 'text-rose-400' : 'text-orange-400' },
                    { label: 'Oil Level',        value: `${(selected.oil_level || 0).toFixed(0)}%`,                                color: 'text-blue-400' },
                    { label: 'Failure Risk',     value: `${((selected.failure_risk || 0)*100).toFixed(0)}%`,                      color: (selected.failure_risk||0) > 0.4 ? 'text-rose-400' : 'text-emerald-400' },
                    { label: 'Meters Connected', value: detail?.meter_count ?? '…',                                               color: 'text-slate-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-mono font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* 48H Load mini-chart */}
                {detail?.history_48h && (
                  <div className="mt-4">
                    <div className="text-xs text-slate-500 mb-2">48H Load History</div>
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detail.history_48h.slice(-24)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Line type="monotone" dataKey="load_pct" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
                          <Tooltip
                            contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, fontSize: 10 }}
                            formatter={(v) => [`${v?.toFixed(1)}%`, 'Load']}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
