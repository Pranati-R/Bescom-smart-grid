import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Activity, Cloud, Calendar } from 'lucide-react'
import { mlApi, analyticsApi } from '../services/api'
import { CyberCard, MetricCard, GlowBadge, PageHeader, MLModelBadge } from '../components/ui/Components'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

const HORIZON_OPTS = [
  { label: '24H', value: 24 },
  { label: '48H', value: 48 },
  { label: '72H', value: 72 },
]

const DISTRICTS = ['Hyderabad','Kukatpally','HITEC City','Madhapur','Secunderabad','Gachibowli']

// Stable mini-chart data per district
const DISTRICT_DATA = DISTRICTS.reduce((acc, d) => {
  acc[d] = Array.from({ length: 8 }, (_, i) => ({ v: 80 + Math.sin(i + d.length) * 40 + 20 }))
  return acc
}, {})

export default function ForecastPage() {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [hours, setHours]               = useState(48)
  const [mlSource, setMlSource]         = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    // Try ML endpoint first, fall back to analytics endpoint
    mlApi.predictForecast({ hours })
      .then((data) => {
        setForecastData(data)
        setMlSource(data.model_source)
      })
      .catch(() =>
        analyticsApi.forecast({ hours }).then((data) => {
          setForecastData(data)
          setMlSource('fallback')
        })
      )
      .finally(() => setLoading(false))
  }, [hours])

  useEffect(() => { load() }, [load])

  const data = forecastData?.data || []

  // Memoize expensive computations
  const { maxDemand, nowIndex } = useMemo(() => ({
    maxDemand: data.length ? Math.max(...data.map((d) => d.upper_bound || d.predicted_mw || 0)) : 0,
    nowIndex:  data.findIndex((d) => d.is_forecast),
  }), [data])

  const accuracy = forecastData ? (100 - (forecastData.accuracy_mape || 4)).toFixed(1) : '-'

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Demand Forecasting" subtitle="AI-powered demand prediction with confidence intervals">
        <div className="flex items-center gap-1.5">
          {HORIZON_OPTS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setHours(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                hours === value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <MLModelBadge source={mlSource} />
      </PageHeader>

      {/* Stats */}
      <div className="kpi-grid">
        <MetricCard title="Peak Predicted" value={Math.round(maxDemand)} unit="MW"    icon={TrendingUp} color="blue" />
        <MetricCard title="Model Accuracy" value={`${accuracy}%`}                     icon={Activity}   color="green" />
        <MetricCard title="Horizon"        value={`${hours}H`}                        icon={Calendar}   color="gold" />
        <MetricCard title="Confidence"     value="95%"                                icon={Cloud}      color="purple" />
      </div>

      {/* Main chart */}
      <CyberCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Demand Forecast with Confidence Band</h3>
            <p className="text-xs text-slate-500 mt-0.5">Blue: actual · Cyan: predicted · Shaded: confidence interval</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-4 h-0.5 bg-cyan-400 rounded" /> Predicted
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-4 h-0.5 bg-blue-400 rounded" /> Actual
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="loader-ring mx-auto mb-3" />
              <div className="text-xs text-slate-400">Running AI forecast…</div>
            </div>
          </div>
        ) : (
          <div className="chart-wrap chart-wrap-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.slice(0, hours + 24)} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00d4ff" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#475569"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  tickFormatter={(v) => `${new Date(v).getHours()}:00`}
                  interval={Math.floor(data.length / 8)}
                />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} width={45} domain={['auto','auto']} />
                <Tooltip
                  contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  formatter={(val, name) => [val?.toFixed(1) + ' MW', name]}
                />
                {nowIndex > 0 && (
                  <ReferenceLine
                    x={data[nowIndex]?.timestamp}
                    stroke="#ffd700"
                    strokeDasharray="4 4"
                    label={{ value: 'NOW', position: 'top', fill: '#ffd700', fontSize: 9 }}
                  />
                )}
                <Area type="monotone" dataKey="upper_bound"  stroke="none"    fill="url(#confBand)"  name="Upper bound" />
                <Area type="monotone" dataKey="lower_bound"  stroke="none"    fill="#020817"         name="Lower bound" />
                <Area type="monotone" dataKey="actual_mw"    stroke="#3b82f6" fill="url(#actualGrad)" strokeWidth={2} dot={false} name="Actual" />
                <Area type="monotone" dataKey="predicted_mw" stroke="#00d4ff" fill="none"            strokeWidth={2} dot={false} name="Predicted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CyberCard>

      {/* District mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISTRICTS.map((district, i) => {
          const peak = Math.round(120 + (i * 17 + 43) % 80)
          const risk = i < 2 ? 'high' : i < 4 ? 'medium' : 'low'
          return (
            <CyberCard key={district} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-200">{district}</div>
                <GlowBadge severity={risk}>{risk} risk</GlowBadge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-bold font-orbitron text-cyan-400">{peak}</div>
                  <div className="text-xs text-slate-500">MW peak predicted</div>
                </div>
                <div className="h-10 w-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DISTRICT_DATA[district]}>
                      <defs>
                        <linearGradient id={`dg${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#00d4ff" fill={`url(#dg${i})`} strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CyberCard>
          )
        })}
      </div>
    </div>
  )
}
