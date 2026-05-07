import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, TrendingDown, DollarSign, RefreshCw } from 'lucide-react'
import { analyticsApi, mlApi } from '../services/api'
import { CyberCard, GlowBadge, MetricCard, DataTable, PageHeader, MLModelBadge } from '../components/ui/Components'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ZAxis,
} from 'recharts'

export default function TheftDetectionPage() {
  const [ranking,    setRanking]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mlBatch,    setMlBatch]    = useState(null)

  const load = useCallback((showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    analyticsApi.theftRanking({ limit: 50 })
      .then((data) => {
        setRanking(data)
        // Batch ML predictions for top 20 meters
        if (data.length > 0) {
          const ids = data.slice(0, 20).map((m) => m.meter_id).filter(Boolean)
          if (ids.length) {
            mlApi.predictTheftBatch({ meter_ids: ids, limit: 20 })
              .then(setMlBatch)
              .catch(() => {})
          }
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'rank',              label: 'Rank',       render: (v)    => <span className="font-mono text-rose-400 font-bold text-xs">#{v}</span> },
    { key: 'meter_id',         label: 'Meter ID',   render: (v)    => <span className="font-mono text-xs text-cyan-400">{v}</span> },
    { key: 'consumer_name',    label: 'Consumer',   render: (v)    => <span className="text-slate-200 text-xs">{v}</span> },
    { key: 'district',         label: 'District',   render: (v)    => <span className="text-slate-400 text-xs">{v}</span> },
    { key: 'theft_probability',label: 'Risk',        render: (v)    => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${(v || 0) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-rose-400">{((v || 0) * 100).toFixed(0)}%</span>
      </div>
    )},
    { key: 'anomaly_score',    label: 'Anomaly',    render: (v)    => <span className="text-orange-400 font-mono text-xs">{((v||0)*100).toFixed(0)}%</span> },
    { key: 'revenue_loss_inr', label: 'Est. Loss',  render: (v)    => <span className="text-rose-400 font-mono text-xs">₹{v?.toFixed(0)}</span> },
    { key: 'consumer_type',    label: 'Type',        render: (v)    => <GlowBadge severity="info">{v}</GlowBadge> },
  ]

  const totalLoss    = ranking.reduce((s, m) => s + (m.revenue_loss_inr || 0), 0)
  const criticalCount= ranking.filter((m) => (m.theft_probability || 0) > 0.7).length
  const avgProb      = ranking.reduce((s, m) => s + (m.theft_probability || 0), 0) / Math.max(ranking.length, 1)

  const scatterData = ranking.map((m) => ({
    x:    (m.anomaly_score    || 0) * 100,
    y:    (m.theft_probability || 0) * 100,
    z:    (m.revenue_loss_inr || 0) / 1000 + 10,
    loss: m.revenue_loss_inr,
    name: m.meter_id,
  }))

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Theft Detection Intelligence" subtitle="AI-ranked suspicious meters with coordinated fraud detection">
        {mlBatch && <MLModelBadge source={mlBatch.predictions?.[0]?.model_source} />}
        <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost text-xs py-1.5 px-3">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="kpi-grid">
        <MetricCard title="High Risk Meters"  value={criticalCount}            icon={Shield}       color="red" />
        <MetricCard title="Total Suspects"    value={ranking.length}           icon={AlertTriangle} color="orange" />
        <MetricCard title="Estimated Loss"    value={totalLoss} prefix="₹"    icon={TrendingDown}  color="red" />
        <MetricCard title="Avg Theft Prob"    value={`${(avgProb * 100).toFixed(0)}%`} icon={DollarSign} color="gold" />
      </div>

      {/* Scatter + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CyberCard className="p-4 sm:p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Anomaly vs Theft Probability Cluster</h3>
          <p className="text-xs text-slate-500 mb-4">Each point = 1 suspicious meter — upper-right = highest priority</p>
          <div className="chart-wrap chart-wrap-md">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, bottom: 10, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                <XAxis dataKey="x" name="Anomaly Score" unit="%" stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} label={{ value: 'Anomaly %', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#475569' }} />
                <YAxis dataKey="y" name="Theft Prob" unit="%" stroke="#475569"    tick={{ fontSize: 10, fill: '#475569' }} label={{ value: 'Theft %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#475569' }} width={40} />
                <ZAxis dataKey="z" range={[30, 200]} />
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1 }}
                  formatter={(v, name) => [`${parseFloat(v).toFixed(1)}${name.includes('Loss') ? '' : '%'}`, name]}
                />
                <Scatter data={scatterData} fill="#ff2d55" fillOpacity={0.75} stroke="none" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Top 5 Priority Cases</h3>
          <div className="space-y-3">
            {(loading ? Array(5).fill(null) : ranking.slice(0, 5)).map((m, i) => (
              <motion.div
                key={m?.id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-3 rounded-lg border ${loading ? 'border-transparent' : 'border-rose-500/15 bg-rose-500/5'}`}
              >
                {loading ? (
                  <div className="skeleton h-14 rounded" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs text-rose-400 truncate">{m.meter_id}</span>
                      <span className="font-bold text-rose-400 text-sm flex-shrink-0">{((m.theft_probability||0)*100).toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">{m.consumer_name}</div>
                    <div className="text-xs text-slate-600 truncate">{m.district} · ₹{m.revenue_loss_inr?.toFixed(0)}/mo</div>
                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(m.theft_probability||0)*100}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </CyberCard>
      </div>

      {/* Full table */}
      <CyberCard>
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Theft Risk Ranking — All Suspects</h3>
          <span className="text-xs text-slate-500">{ranking.length} meters flagged</span>
        </div>
        <DataTable columns={columns} data={ranking} loading={loading} />
      </CyberCard>
    </div>
  )
}
