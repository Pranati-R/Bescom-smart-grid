import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { inspectionApi } from '../services/api'
import { CyberCard, GlowBadge, MetricCard, DataTable, PageHeader, FilterPills } from '../components/ui/Components'

const STATUS_OPTS = [
  { label: 'All',         value: '' },
  { label: 'Scheduled',   value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed',   value: 'completed' },
  { label: 'Pending',     value: 'pending' },
]

export default function InspectionPage() {
  const [inspections,   setInspections]   = useState([])
  const [stats,         setStats]         = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [statusFilter,  setStatusFilter]  = useState('')
  const [page,          setPage]          = useState(1)
  const [total,         setTotal]         = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      inspectionApi.list({ page, limit: 20, status: statusFilter || undefined }),
      inspectionApi.stats(),
    ])
      .then(([list, s]) => {
        setInspections(list.data || [])
        setTotal(list.total || 0)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleStatus = (v) => { setStatusFilter(v); setPage(1) }

  const columns = [
    { key: 'id',                   label: '#',         render: (v) => <span className="font-mono text-xs text-slate-500">#{v}</span> },
    { key: 'inspector_name',       label: 'Inspector', render: (v) => <span className="text-slate-200 text-xs">{v}</span> },
    { key: 'inspector_id',         label: 'ID',        render: (v) => <span className="font-mono text-xs text-cyan-400">{v}</span> },
    { key: 'status',               label: 'Status',    render: (v) => (
      <GlowBadge severity={v==='completed'?'success':v==='in_progress'?'info':v==='scheduled'?'medium':'low'}>
        {v?.replace(/_/g, ' ')}
      </GlowBadge>
    )},
    { key: 'priority',             label: 'Priority',  render: (v) => (
      <GlowBadge severity={v==='critical'?'critical':v==='high'?'high':v==='medium'?'medium':'low'}>{v}</GlowBadge>
    )},
    { key: 'inspection_type',      label: 'Type',      render: (v) => <span className="text-xs text-slate-400 capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'district',             label: 'District',  render: (v) => <span className="text-xs text-slate-400">{v}</span> },
    { key: 'theft_confirmed',      label: 'Theft',     render: (v) => v
      ? <GlowBadge severity="critical">Confirmed</GlowBadge>
      : <GlowBadge severity="success">Clear</GlowBadge>
    },
    { key: 'revenue_recovered_inr',label: 'Recovered', render: (v) => <span className="text-emerald-400 font-mono text-xs">₹{v?.toFixed(0)}</span> },
    { key: 'scheduled_date',       label: 'Date',      render: (v) => <span className="text-xs text-slate-500">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
  ]

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Inspection Management" subtitle="Field officer assignments, tracking and resolution workflow">
        <button className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> New Inspection
        </button>
      </PageHeader>

      {/* KPIs */}
      <div className="kpi-grid">
        <MetricCard title="Total"            value={stats?.total}           icon={FileText}     color="blue" />
        <MetricCard title="Completed"        value={stats?.completed}       icon={CheckCircle}  color="green" />
        <MetricCard title="Scheduled"        value={stats?.scheduled}       icon={Clock}        color="gold" />
        <MetricCard title="Theft Confirmed"  value={stats?.theft_confirmed} icon={AlertTriangle} color="red" />
      </div>

      {/* Recovery + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CyberCard className="p-4 sm:p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue Recovery Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { label: 'Total Recovered', value: `₹${((stats?.total_recovered_inr||0)/100000).toFixed(1)}L`, color: 'text-emerald-400' },
              { label: 'Detection Rate',  value: `${stats?.detection_rate||0}%`,                              color: 'text-cyan-400' },
              { label: 'Avg / Inspection',value: `₹${((stats?.avg_recovery_inr||0)).toFixed(0)}`,             color: 'text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <div className={`text-xl sm:text-2xl font-bold font-orbitron ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Scheduled',   count: stats?.scheduled  || 0, color: '#ffd700' },
              { label: 'In Progress', count: stats?.in_progress || 0, color: '#00d4ff' },
              { label: 'Completed',   count: stats?.completed   || 0, color: '#00ff88' },
              { label: 'Pending',     count: stats?.pending     || 0, color: '#ff6b35' },
            ].map((s) => {
              const pct = stats?.total ? (s.count / stats.total) * 100 : 0
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{s.label}</span>
                    <span style={{ color: s.color }} className="font-mono">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CyberCard>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto pb-1">
        <FilterPills options={STATUS_OPTS} value={statusFilter} onChange={handleStatus} />
      </div>

      {/* Table */}
      <CyberCard>
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Inspection Records</h3>
          <span className="text-xs text-slate-500">{total} total</span>
        </div>
        <DataTable columns={columns} data={inspections} loading={loading} />
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-800/50">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}        className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(page+1)} disabled={page >= totalPages}           className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </CyberCard>
    </div>
  )
}
