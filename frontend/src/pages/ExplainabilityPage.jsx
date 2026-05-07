import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Eye, Cpu, BarChart2 } from 'lucide-react'
import { analyticsApi, mlApi } from '../services/api'
import { CyberCard, GlowBadge, MetricCard, PageHeader, MLModelBadge } from '../components/ui/Components'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'

const ENTITY_TYPES = ['meter', 'transformer']

export default function ExplainabilityPage() {
  const [explanation, setExplanation] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [entityId,    setEntityId]    = useState(1)
  const [entityType,  setEntityType]  = useState('meter')
  const [mlResult,    setMlResult]    = useState(null)

  const fetchExplanation = useCallback((type, id) => {
    setLoading(true)
    setExplanation(null)
    setMlResult(null)

    // Fetch SHAP explanation + ML anomaly detection in parallel
    Promise.all([
      analyticsApi.explainability(type, id),
      type === 'meter'
        ? mlApi.detectAnomalyGet(String(id)).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([exp, ml]) => {
        setExplanation(exp)
        setMlResult(ml)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchExplanation(entityType, entityId) }, [])

  const shapData = (explanation?.feature_importance || []).map((f) => ({
    feature:     f.feature.replace(/_/g, ' '),
    importance:  f.importance,
    explanation: f.explanation,
  }))

  const maxImportance = shapData[0]?.importance || 1

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Explainable AI Center" subtitle="SHAP-based model explanations for every AI prediction">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="cyber-input text-sm py-2 w-32"
          aria-label="Entity type"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <input
          type="number"
          value={entityId}
          onChange={(e) => setEntityId(Math.max(1, Number(e.target.value)))}
          className="cyber-input text-sm py-2 w-24"
          min={1}
          aria-label="Entity ID"
        />
        <button
          onClick={() => fetchExplanation(entityType, entityId)}
          className="btn-primary text-sm py-2 px-4"
        >
          Analyze
        </button>
        {mlResult && <MLModelBadge source={mlResult.model_source} />}
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loader-ring mx-auto mb-4" />
            <div className="text-sm text-slate-400">Running SHAP analysis…</div>
          </div>
        </div>
      ) : explanation ? (
        <>
          {/* ML + SHAP prediction header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <CyberCard className={`p-4 sm:p-5 h-full border ${(explanation.confidence || 0) > 0.8 ? 'border-rose-500/30' : 'border-yellow-500/30'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Prediction</div>
                    <div className="text-lg font-bold font-orbitron text-rose-400">{explanation.prediction}</div>
                    <div className="text-sm text-slate-400 mt-1">{explanation.model_name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold font-orbitron text-rose-400">
                      {Math.round((explanation.confidence || 0) * 100)}%
                    </div>
                    <div className="text-xs text-slate-500">Confidence</div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 leading-relaxed">{explanation.reasoning}</div>
                </div>
                <div className="mt-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                  <div className="text-xs font-semibold text-orange-400 mb-1">Recommended Action</div>
                  <div className="text-xs text-slate-400">{explanation.recommended_action}</div>
                </div>
              </CyberCard>
            </div>

            {/* ML model result */}
            {mlResult && (
              <CyberCard className="p-4 sm:p-5 border border-purple-500/20">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" /> ML Model Output
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Anomaly Score</div>
                    <div className="text-2xl font-bold font-orbitron text-purple-400">
                      {Math.round((mlResult.anomaly_score || 0) * 100)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlowBadge severity={mlResult.is_anomalous ? 'critical' : 'low'}>
                      {mlResult.is_anomalous ? 'Anomalous' : 'Normal'}
                    </GlowBadge>
                    <MLModelBadge source={mlResult.model_source} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Confidence</div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(mlResult.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-purple-400 font-mono mt-1">{((mlResult.confidence || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </CyberCard>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SHAP bar chart */}
            <CyberCard className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-slate-200">Feature Importance (SHAP Values)</h3>
              </div>
              <div className="chart-wrap chart-wrap-md">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      stroke="#475569"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      width={140}   /* was 160 — clips on small screens */
                      tickFormatter={(v) => v.length > 18 ? v.slice(0, 17) + '…' : v}
                    />
                    <Tooltip
                      contentStyle={{ background: 'rgba(2,8,23,0.95)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [v.toFixed(3), 'SHAP Value']}
                    />
                    <Bar dataKey="importance" radius={[0,4,4,0]}>
                      {shapData.map((_, i) => (
                        <Cell key={i} fill={i < 3 ? '#ff2d55' : i < 5 ? '#ff6b35' : i < 7 ? '#ffd700' : '#00d4ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CyberCard>

            {/* Decision path */}
            <CyberCard className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-slate-200">AI Decision Path</h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-52">
                {(explanation.decision_path || []).map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs text-purple-400 font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed pt-0.5">
                      {step.replace(/^\d+\.\s+/, '')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>
          </div>

          {/* Feature explanations grid */}
          <CyberCard className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-200">Feature Explanations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {(explanation.feature_importance || []).map((f, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200 capitalize truncate">
                      {f.feature.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-mono flex-shrink-0 ml-2 ${i < 3 ? 'text-rose-400' : i < 6 ? 'text-orange-400' : 'text-slate-400'}`}>
                      {f.importance.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i < 3 ? 'bg-rose-500' : i < 6 ? 'bg-orange-500' : 'bg-cyan-500'}`}
                      style={{ width: `${(f.importance / maxImportance) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{f.explanation}</div>
                </div>
              ))}
            </div>
          </CyberCard>
        </>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <Eye className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <div className="text-sm">No explanation data available</div>
        </div>
      )}
    </div>
  )
}
