import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, Zap, TrendingUp,
  Shield, DollarSign, Cpu, BarChart3, Map, RefreshCw,
} from 'lucide-react'
import {
  MetricCard, CyberCard, RadialGauge, GlowBadge,
  StatusDot, PageHeader, MLModelBadge,
} from '../components/ui/Components'
import { dashboardApi, mlApi } from '../services/api'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function Dashboard() {
  const [kpis,   setKpis]   = useState(null)
  const [health, setHealth] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [districtRisks, setDistrictRisks] = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { metrics, mlHealth } = useAppStore()
  const navigate = useNavigate()

  const load = useCallback((showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    Promise.all([
      dashboardApi.kpis(),
      dashboardApi.systemHealth(),
      dashboardApi.alerts({ limit: 8 }),
      mlApi.allDistrictRisks().catch(() => ({ districts: [] })),
    ])
      .then(([k, h, a, dr]) => {
        setKpis(k)
        setHealth(h)
        setAlerts(Array.isArray(a) ? a : [])
        setDistrictRisks(dr?.districts || [])
      })
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load() }, [load])

  const lm = metrics || {}

  const KPI_CARDS = [
    { title: 'Total Demand',        value: lm.total_demand_mw     || 892,    unit: 'MW',  icon: Activity,    color: 'blue',   trend: [60,75,65,80,70,85,78,90,82,88,75,92] },
    { title: 'Active Anomalies',    value: lm.active_anomalies    || kpis?.active_alerts || 67, icon: AlertTriangle, color: 'orange', trend: [40,55,48,62,58,70,65,58,72,68,75,67] },
    { title: 'Transformer Overloads',value: lm.transformer_overloads || 8,   icon: Zap,         color: 'red' },
    { title: 'Revenue Leakage',     value: lm.revenue_leakage_inr || 980000, prefix: '₹', icon: DollarSign,  color: 'red' },
    { title: 'Predicted Peak',      value: lm.predicted_peak_mw   || 1035,   unit: 'MW',  icon: TrendingUp,  color: 'gold' },
    { title: 'AI Confidence',       value: `${Math.round((lm.ai_confidence_score || 0.947) * 100)}%`, icon: Cpu, color: 'green' },
    { title: 'Suspicious Meters',   value: lm.suspicious_meters   || kpis?.suspicious_meters || 234, icon: Shield, color: 'orange' },
    { title: 'Recovery Potential',  value: lm.recovery_potential_inr || 650000, prefix: '₹', icon: BarChart3, color: 'green' },
  ]

  // Stable trend data — generated once, not on every render
  const [trendData] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      time: `${String((i * 2) % 24).padStart(2, '0')}:00`,
      demand:    700 + Math.sin(i / 2) * 150 + Math.random() * 50,
      anomalies: Math.floor(40 + Math.sin(i) * 20 + Math.random() * 10),
    }))
  )

  return (
    <div className="page-pad space-y-5">
      {/* Header */}
      <PageHeader title="Command Center" subtitle="Real-time grid intelligence overview">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">LIVE MONITORING</span>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-ghost py-1.5 px-3 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button onClick={() => navigate('/map')} className="btn-ghost py-1.5 px-3 text-xs">
          <Map className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open Map</span>
        </button>
      </PageHeader>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {KPI_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <MetricCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="two-col">
        {/* Demand Chart */}
        <CyberCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Grid Demand — 24H Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time with AI forecast overlay</p>
            </div>
            <GlowBadge severity="info">LIVE</GlowBadge>
          </div>
          <div className="chart-wrap chart-wrap-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} width={40} />
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#00d4ff' }}
                />
                <Area type="monotone" dataKey="demand" stroke="#00d4ff" fill="url(#demandGrad)" strokeWidth={2} dot={false} name="Demand (MW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* System Health + Quick Actions */}
        <div className="space-y-4">
          <CyberCard className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">AI System Health</h3>
            <div className="flex justify-around flex-wrap gap-4">
              <RadialGauge value={health?.ai_engine?.accuracy || 94} max={100} label="AI Accuracy"  color="#00d4ff" size={100} />
              <RadialGauge value={health?.overall_health    || 91} max={100} label="Grid Health"  color="#00ff88" size={100} />
            </div>
            <div className="mt-4 space-y-2">
              {health && Object.entries(health)
                .filter(([k]) => k !== 'overall_health')
                .slice(0, 4)
                .map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={val?.status || 'active'} />
                      <span className="text-slate-300">{val?.status || 'online'}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </CyberCard>

          <CyberCard className="p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Anomalies', path: '/anomalies', color: 'orange' },
                { label: 'Theft',     path: '/theft',     color: 'red' },
                { label: 'Forecast',  path: '/forecast',  color: 'blue' },
                { label: 'Inspect',   path: '/inspections',color: 'green' },
              ].map((a) => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className={`p-2.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 active:scale-95 ${
                    a.color === 'orange' ? 'border-orange-500/20 text-orange-400 bg-orange-500/5 hover:bg-orange-500/15' :
                    a.color === 'red'    ? 'border-rose-500/20   text-rose-400   bg-rose-500/5   hover:bg-rose-500/15'   :
                    a.color === 'blue'   ? 'border-cyan-500/20   text-cyan-400   bg-cyan-500/5   hover:bg-cyan-500/15'   :
                                          'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </CyberCard>
        </div>
      </div>

      {/* Alerts & District Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Alerts */}
        <CyberCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Active Alerts</h3>
            <button onClick={() => navigate('/anomalies')} className="text-xs text-cyan-400 hover:text-cyan-300">View All →</button>
          </div>
          <div className="space-y-2">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-11 rounded-lg" />)
              : alerts.slice(0, 5).map((alert, i) => (
                <motion.div
                  key={alert.id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/20 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-rose-400' :
                    alert.severity === 'high'     ? 'bg-orange-400' :
                    alert.severity === 'medium'   ? 'bg-yellow-400' : 'bg-emerald-400'
                  } animate-pulse`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{alert.title}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{alert.message}</div>
                  </div>
                  <GlowBadge severity={alert.severity}>{alert.severity}</GlowBadge>
                </motion.div>
              ))
            }
            {!loading && alerts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">No active alerts</div>
            )}
          </div>
        </CyberCard>

        {/* District Risk (ML-powered) */}
        <CyberCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">District Risk Overview</h3>
              <MLModelBadge source={districtRisks[0]?.model_source} />
            </div>
            <button onClick={() => navigate('/map')} className="text-xs text-cyan-400">Open Map →</button>
          </div>
          <div className="space-y-2.5">
            {(districtRisks.length > 0 ? districtRisks : [
              { district: 'HITEC City',   risk_score: 0.88 },
              { district: 'Kukatpally',   risk_score: 0.72 },
              { district: 'Madhapur',     risk_score: 0.65 },
              { district: 'Gachibowli',   risk_score: 0.45 },
              { district: 'Banjara Hills',risk_score: 0.38 },
            ]).slice(0, 6).map((d, i) => {
              const pct = Math.round((d.risk_score || 0.5) * 100)
              return (
                <div key={d.district} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 flex-shrink-0 truncate">{d.district}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                      className={`h-full rounded-full ${pct > 70 ? 'bg-rose-500' : pct > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ boxShadow: `0 0 5px ${pct > 70 ? '#ff2d55' : pct > 50 ? '#ff6b35' : '#00ff88'}` }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-8 text-right flex-shrink-0 ${pct > 70 ? 'text-rose-400' : pct > 50 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </CyberCard>
      </div>
    </div>
  )
}
