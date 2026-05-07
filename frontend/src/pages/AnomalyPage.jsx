import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, TrendingUp, Eye } from 'lucide-react'
import { analyticsApi } from '../services/api'
import { CyberCard, GlowBadge, DataTable, MetricCard, PageHeader, FilterPills } from '../components/ui/Components'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

const COLORS = ['#ff2d55','#ff6b35','#ffd700','#00d4ff','#9b59b6','#00ff88','#e74c3c','#3498db']
const SEVERITY_OPTS = ['All','critical','high','medium','low']

export default function AnomalyPage() {
  const [stats,    setStats]    = useState(null)
  const [anomalies,setAnomalies]= useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [severity, setSeverity] = useState('All')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      analyticsApi.anomalyStats(),
      analyticsApi.anomalies({ page, limit: 20, severity: severity === 'All' ? undefined : severity }),
    ])
      .then(([s, a]) => {
        setStats(s)
        setAnomalies(a.data || [])
        setTotal(a.total || 0)
      })
      .finally(() => setLoading(false))
  }, [page, severity])

  useEffect(() => { load() }, [load])

  const handleSeverity = (v) => { setSeverity(v); setPage(1) }

  const pieData = stats
    ? Object.entries(stats.type_distribution || {})
        .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
        .filter((d) => d.value > 0)
    : []

  const columns = [
    { key: 'id',               label: '#',          render: (v) => <span className="text-slate-500 font-mono text-xs">#{v}</span> },
    { key: 'type',             label: 'Type',       render: (v) => <span className="text-slate-200 text-xs capitalize">{v?.replace(/_/g, ' ')}</span> },
    { key: 'severity',         label: 'Severity',   render: (v) => <GlowBadge severity={v}>{v}</GlowBadge> },
    { key: 'confidence',       label: 'Confidence', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(v||0) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-300 font-mono">{((v||0)*100).toFixed(0)}%</span>
      </div>
    )},
    { key: 'theft_probability',label: 'Theft Prob', render: (v) => (
      <span className={`font-mono text-xs ${v>0.7?'text-rose-400':v>0.4?'text-orange-400':'text-emerald-400'}`}>
        {((v||0)*100).toFixed(0)}%
      </span>
    )},
    { key: 'revenue_loss_inr', label: 'Rev. Loss',  render: (v) => <span className="text-rose-400 font-mono text-xs">₹{v?.toFixed(0)}</span> },
    { key: 'status',           label: 'Status',     render: (v) => <GlowBadge severity={v==='open'?'high':v==='resolved'?'success':'medium'}>{v}</GlowBadge> },
    { key: 'detected_at',      label: 'Detected',   render: (v) => <span className="text-xs text-slate-500">{v ? new Date(v).toLocaleDateString() : '-'}</span> },
  ]

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Anomaly Detection Center" subtitle="AI-powered anomaly intelligence with SHAP explanations">
        <FilterPills
          options={SEVERITY_OPTS.map((s) => ({ label: s === 'All' ? 'All' : s, value: s }))}
          value={severity}
          onChange={handleSeverity}
        />
      </PageHeader>

      {/* Stats */}
      <div className="kpi-grid">
        <MetricCard title="Total Anomalies"  value={stats?.total}                 icon={AlertTriangle} color="orange" />
        <MetricCard title="Critical"         value={stats?.critical}              icon={Shield}        color="red" />
        <MetricCard title="Revenue at Risk"  value={stats?.total_revenue_at_risk} prefix="₹"           icon={TrendingUp}  color="red" />
        <MetricCard title="Resolution Rate"  value={`${stats?.resolution_rate || 0}%`} icon={Eye}     color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie */}
        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Type Distribution</h3>
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="38%" outerRadius="62%" paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {pieData.slice(0, 6).map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400 truncate capitalize">{d.name}</span>
              </div>
            ))}
          </div>
        </CyberCard>

        {/* Bar */}
        <CyberCard className="p-4 sm:p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Severity Breakdown</h3>
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { severity: 'Critical', count: stats?.critical || 0 },
                  { severity: 'High',     count: stats?.high     || 0 },
                  { severity: 'Medium',   count: stats?.medium   || 0 },
                  { severity: 'Low',      count: stats?.low      || 0 },
                ]}
                margin={{ top: 5, right: 10, bottom: 0, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis dataKey="severity" stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} width={35} />
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(0,212,255,0.05)' }}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {[{fill:'#ff2d55'},{fill:'#ff6b35'},{fill:'#ffd700'},{fill:'#00ff88'}].map((c,i) => (
                    <Cell key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      {/* Table */}
      <CyberCard>
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Anomaly Intelligence Feed</h3>
          <span className="text-xs text-slate-500">{total} records</span>
        </div>
        <DataTable columns={columns} data={anomalies} loading={loading} />
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-800/50">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}       className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(page+1)} disabled={page >= totalPages}           className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </CyberCard>
    </div>
  )
}
