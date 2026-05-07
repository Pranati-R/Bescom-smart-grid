import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical, Play, RotateCcw, AlertTriangle, Zap, Cloud, Thermometer } from 'lucide-react'
import { analyticsApi } from '../services/api'
import { CyberCard, GlowBadge, RadialGauge, PageHeader } from '../components/ui/Components'

export default function SimulationPage() {
  const [params, setParams] = useState({ demand_increase_pct: 0, theft_spike_pct: 0, weather_temp: 35, feeder_fault: false })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await analyticsApi.simulation(params)
      setResult(res)
      setRan(true)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setParams({ demand_increase_pct: 0, theft_spike_pct: 0, weather_temp: 35, feeder_fault: false }); setResult(null); setRan(false) }

  const SliderParam = ({ label, icon: Icon, param, min, max, unit, step = 1 }) => (
    <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-200">{label}</span>
        </div>
        <span className="font-mono text-cyan-400 font-bold">{params[param]}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={params[param]}
        onChange={(e) => setParams({ ...params, [param]: Number(e.target.value) })}
        className="w-full accent-cyan-500"
        style={{ cursor: 'pointer' }}
      />
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Grid Simulation Sandbox" subtitle="Simulate grid scenarios and predict AI-driven outcomes" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters Panel */}
        <CyberCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-200">Simulation Parameters</h3>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="space-y-3">
            <SliderParam label="Demand Increase" icon={Zap} param="demand_increase_pct" min={0} max={50} unit="%" />
            <SliderParam label="Theft Spike" icon={AlertTriangle} param="theft_spike_pct" min={0} max={100} unit="%" />
            <SliderParam label="Weather Temperature" icon={Thermometer} param="weather_temp" min={20} max={50} unit="°C" />
          </div>

          {/* Feeder Fault Toggle */}
          <div className="mt-3 p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-slate-200">Feeder Fault</span>
            </div>
            <button
              onClick={() => setParams({ ...params, feeder_fault: !params.feeder_fault })}
              className={`w-12 h-6 rounded-full transition-all relative ${params.feeder_fault ? 'bg-rose-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${params.feeder_fault ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <><div className="loader-ring w-5 h-5 border-2" />Running AI Simulation...</>
            ) : (
              <><Play className="w-4 h-4" />Run Simulation</>
            )}
          </button>
        </CyberCard>

        {/* Results Panel */}
        <CyberCard className="p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-5">Simulation Results</h3>

          {!ran ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
              <FlaskConical className="w-10 h-10 mb-3 opacity-30" />
              <div className="text-sm">Configure parameters and run simulation</div>
              <div className="text-xs mt-1">AI will predict grid outcomes in real-time</div>
            </div>
          ) : result?.results ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Overload Risk Gauge */}
              <div className="flex justify-around p-4 rounded-xl border border-slate-700/50 bg-slate-800/20">
                <RadialGauge value={Math.round((result.results.overload_risk || 0) * 100)} max={100} label="Overload Risk" color={result.results.overload_risk > 0.7 ? '#ff2d55' : '#ff6b35'} size={90} />
                <RadialGauge value={Math.round((result.results.blackout_probability || 0) * 100)} max={100} label="Blackout Risk" color="#ff2d55" size={90} />
                <RadialGauge value={result.results.transformer_stress_pct || 0} max={100} label="Transformer Stress" color={result.results.transformer_stress_pct > 80 ? '#ff6b35' : '#ffd700'} size={90} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Demand', value: `${result.results.total_demand_mw?.toFixed(0)} MW`, color: 'text-cyan-400' },
                  { label: 'Revenue Loss', value: `₹${(result.results.revenue_loss_inr / 100000).toFixed(1)}L`, color: 'text-rose-400' },
                  { label: 'Feeder Load', value: `${result.results.feeder_load_pct?.toFixed(0)}%`, color: 'text-orange-400' },
                  { label: 'Critical Transformers', value: result.results.critical_transformers, color: 'text-rose-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/20">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className={`text-lg font-bold font-orbitron ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className={`p-4 rounded-xl border ${result.results.overload_risk > 0.7 ? 'border-rose-500/30 bg-rose-500/10' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
                <div className={`text-xs font-bold mb-1 ${result.results.overload_risk > 0.7 ? 'text-rose-400' : 'text-yellow-400'}`}>
                  🤖 AI RECOMMENDATION
                </div>
                <div className="text-sm text-slate-300">{result.results.recommended_action}</div>
              </div>
            </motion.div>
          ) : null}
        </CyberCard>
      </div>
    </div>
  )
}
