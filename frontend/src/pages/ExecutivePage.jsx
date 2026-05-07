import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Shield, Zap, DollarSign, Activity } from 'lucide-react'
import { CyberCard, MetricCard, GlowBadge, PageHeader } from '../components/ui/Components'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

// Static data — defined at module scope, never re-created on render
const RADAR_DATA = [
  { metric: 'AI Accuracy',       value: 94.7, fullMark: 100 },
  { metric: 'Recovery Rate',     value: 68.3, fullMark: 100 },
  { metric: 'Response Time',     value: 82.1, fullMark: 100 },
  { metric: 'Theft Detection',   value: 91.5, fullMark: 100 },
  { metric: 'Forecast Accuracy', value: 96.2, fullMark: 100 },
  { metric: 'Uptime',            value: 99.1, fullMark: 100 },
]

const MONTHLY_RECOVERY = [
  { month: 'Nov', recovered: 42, lost: 98 },
  { month: 'Dec', recovered: 58, lost: 91 },
  { month: 'Jan', recovered: 71, lost: 87 },
  { month: 'Feb', recovered: 63, lost: 85 },
  { month: 'Mar', recovered: 84, lost: 79 },
  { month: 'Apr', recovered: 92, lost: 74 },
  { month: 'May', recovered: 78, lost: 71 },
]

const HIGH_RISK_DISTRICTS = [
  { district: 'Kukatpally',   risk: 88, loss: '₹28.4L', meters: 2340, trend: '+12%' },
  { district: 'HITEC City',   risk: 72, loss: '₹22.1L', meters: 1890, trend: '+5%' },
  { district: 'Madhapur',     risk: 65, loss: '₹18.7L', meters: 1560, trend: '-3%' },
  { district: 'Secunderabad', risk: 54, loss: '₹14.2L', meters: 2100, trend: '+8%' },
  { district: 'Gachibowli',   risk: 41, loss: '₹9.8L',  meters: 1240, trend: '-1%' },
]

export default function ExecutivePage() {
  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Executive Analytics" subtitle="C-suite business intelligence dashboard">
        <GlowBadge severity="info">Q2 2026</GlowBadge>
        <GlowBadge severity="success">On Track</GlowBadge>
      </PageHeader>

      {/* KPI grid */}
      <div className="kpi-grid">
        <MetricCard title="YTD Revenue Recovered"  value={4800000} prefix="₹" icon={DollarSign}  color="green" />
        <MetricCard title="Total Theft Cases"      value={12450}              icon={Shield}       color="red" />
        <MetricCard title="Operational Efficiency" value="87.3%"              icon={Activity}     color="blue" />
        <MetricCard title="Grid Uptime"            value="99.1%"              icon={Zap}          color="green" />
        <MetricCard title="AI Model Accuracy"      value="94.7%"              icon={BarChart3}    color="purple" />
        <MetricCard title="Inspections Completed"  value={1240}               icon={TrendingUp}   color="gold" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recovery vs Loss */}
        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Recovery vs Loss — Monthly (₹L)</h3>
          <div className="chart-wrap chart-wrap-md">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_RECOVERY} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} width={35} />
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [`₹${v}L`, n]}
                  cursor={{ fill: 'rgba(0,212,255,0.05)' }}
                />
                <Bar dataKey="lost"      name="Loss"      fill="#ff2d55" radius={[4,4,0,0]} fillOpacity={0.75} />
                <Bar dataKey="recovered" name="Recovered" fill="#00ff88" radius={[4,4,0,0]} fillOpacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Radar */}
        <CyberCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Platform Performance Metrics</h3>
          <div className="chart-wrap chart-wrap-md">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                <PolarGrid stroke="rgba(0,212,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize: 8, fill: '#475569' }} tickCount={3} />
                <Radar name="Score" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      {/* High Risk Zones */}
      <CyberCard className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">High Risk Zones — Priority Ranking</h3>
        <div className="space-y-3">
          {HIGH_RISK_DISTRICTS.map((d, i) => (
            <motion.div
              key={d.district}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors"
            >
              <span className="w-5 text-center font-bold text-slate-500 text-sm flex-shrink-0">{i + 1}</span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mb-1.5">
                  <span className="text-sm text-slate-200">{d.district}</span>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs text-slate-500 hidden sm:inline">{d.meters} meters</span>
                    <span className="text-xs text-rose-400 font-mono">{d.loss}</span>
                    <span className={`text-xs font-semibold ${d.trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {d.trend}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.risk}%` }}
                    transition={{ delay: i * 0.08 + 0.3, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${d.risk > 70 ? '#ff2d55' : d.risk > 50 ? '#ff6b35' : '#ffd700'}, ${d.risk > 70 ? '#ff6b35' : d.risk > 50 ? '#ffd700' : '#00d4ff'})`,
                      boxShadow: `0 0 8px ${d.risk > 70 ? '#ff2d5580' : '#ff6b3580'}`,
                    }}
                  />
                </div>
              </div>

              <GlowBadge severity={d.risk > 70 ? 'critical' : d.risk > 50 ? 'high' : 'medium'}>
                {d.risk}%
              </GlowBadge>
            </motion.div>
          ))}
        </div>
      </CyberCard>
    </div>
  )
}
