import React, { useEffect, useState, useCallback } from 'react'
import { DollarSign, TrendingDown, TrendingUp, PieChart as PieIcon } from 'lucide-react'
import { analyticsApi } from '../services/api'
import { CyberCard, MetricCard, PageHeader } from '../components/ui/Components'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const COLORS = ['#ff2d55','#ff6b35','#ffd700','#00d4ff','#00ff88','#9b59b6']
const DISTRICTS = ['', 'Hyderabad','Secunderabad','Kukatpally','HITEC City','Madhapur']

export default function RevenuePage() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [district, setDistrict] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    analyticsApi.revenue({ days: 30, district: district || undefined })
      .then(setData)
      .finally(() => setLoading(false))
  }, [district])

  useEffect(() => { load() }, [load])

  const summary            = data?.summary           || {}
  const daily              = data?.daily_data         || []
  const districtBreakdown  = data?.district_breakdown || []

  const pieData = [
    { name: 'Theft Loss',     value: Math.round((summary.total_loss_inr || 0) * 0.705) },
    { name: 'Technical Loss', value: Math.round((summary.total_loss_inr || 0) * 0.295) },
  ]

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Revenue Analytics" subtitle="Financial intelligence with loss analysis and recovery potential">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="cyber-input text-sm py-2 w-40"
          aria-label="Filter by district"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d || 'All Districts'}</option>
          ))}
        </select>
      </PageHeader>

      <div className="kpi-grid">
        <MetricCard title="Total Billed"        value={summary.total_billed_inr    || 0} prefix="₹" icon={DollarSign}  color="blue" />
        <MetricCard title="Total Loss"          value={summary.total_loss_inr      || 0} prefix="₹" icon={TrendingDown} color="red" />
        <MetricCard title="Loss Percentage"     value={`${(summary.loss_percentage?.toFixed(1) || 0)}%`}                icon={PieIcon}    color="orange" />
        <MetricCard title="Recovery Potential"  value={summary.recovery_potential_inr || 0} prefix="₹" icon={TrendingUp}  color="green" />
      </div>

      <div className="two-col">
        {/* Trend chart */}
        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue Loss Trend — 30 Days</h3>
          {loading
            ? <div className="chart-wrap chart-wrap-md skeleton rounded-lg" />
            : (
              <div className="chart-wrap chart-wrap-md">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily.slice(0, 30)} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
                    <defs>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#ff2d55" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ff2d55" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="recovGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#00ff88" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 9, fill: '#475569' }} interval={4} />
                    <YAxis stroke="#475569" tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} width={45} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v, n) => [`₹${(v/100000).toFixed(1)}L`, n]}
                    />
                    <Area type="monotone" dataKey="loss_inr"          name="Loss"     stroke="#ff2d55" fill="url(#lossGrad)"  strokeWidth={2}   dot={false} />
                    <Area type="monotone" dataKey="recovery_potential" name="Recovery" stroke="#00ff88" fill="url(#recovGrad)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </CyberCard>

        {/* Loss composition */}
        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Loss Composition</h3>
          <div className="chart-wrap chart-wrap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="38%" outerRadius="65%" paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={['#ff2d55','#ff6b35'][i]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`₹${(v/100000).toFixed(1)}L`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ['#ff2d55','#ff6b35'][i] }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-slate-200 font-mono">₹{(d.value/100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-center">
            <div className="text-xs text-slate-500">Recovery Potential</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              ₹{((summary.recovery_potential_inr || 0)/100000).toFixed(1)}L
            </div>
          </div>
        </CyberCard>
      </div>

      {/* District breakdown */}
      <CyberCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">District Revenue Loss Breakdown</h3>
        {loading
          ? <div className="chart-wrap chart-wrap-md skeleton rounded-lg" />
          : (
            <div className="chart-wrap chart-wrap-md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtBreakdown} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                  <XAxis dataKey="district" stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis stroke="#475569"  tick={{ fontSize: 9,  fill: '#475569' }} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} width={45} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`₹${(v/100000).toFixed(1)}L`, 'Loss']}
                    cursor={{ fill: 'rgba(0,212,255,0.05)' }}
                  />
                  <Bar dataKey="loss_inr" radius={[4,4,0,0]} fillOpacity={0.85}>
                    {districtBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        }
      </CyberCard>
    </div>
  )
}
