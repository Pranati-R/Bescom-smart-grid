import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Database, Cpu, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { CyberCard, PageHeader } from '../components/ui/Components'
import { useAppStore } from '../store/useAppStore'

const TABS = ['Profile', 'Notifications', 'AI Settings', 'Security', 'System']

export default function SettingsPage() {
  const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState('Profile')
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    criticalOnly: false,
    autoRefreshInterval: 30,
    anomalyThreshold: 0.6,
    aiConfidenceMin: 0.75,
    enableExplainability: true,
    realtimeStreaming: true,
    darkMode: true,
    language: 'en-IN',
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Toggle = ({ param, label, desc }) => (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => setSettings((s) => ({ ...s, [param]: !s[param] }))}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings[param] ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings[param] ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Platform Settings" subtitle="Configure your GridShield AI experience" />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tab List — horizontal scroll on mobile */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {TABS.map((tab) => {
              const icons = { Profile: User, Notifications: Bell, 'AI Settings': Cpu, Security: Shield, System: Database }
              const Icon = icons[tab] || Settings
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" /> {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <CyberCard className="p-6">
            {activeTab === 'Profile' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Profile Information</h3>
                {[
                  { label: 'Full Name', value: user?.full_name || 'Grid Administrator', type: 'text' },
                  { label: 'Email', value: user?.email || 'admin@smartgrid.ai', type: 'email' },
                  { label: 'Department', value: user?.department || 'Grid Operations', type: 'text' },
                  { label: 'Role', value: user?.role || 'admin', type: 'text', disabled: true },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input className="cyber-input" type={f.type} defaultValue={f.value} disabled={f.disabled} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Alert Preferences</h3>
                <Toggle param="emailAlerts" label="Email Alerts" desc="Receive critical alerts via email" />
                <Toggle param="smsAlerts" label="SMS Alerts" desc="Receive high-priority SMS notifications" />
                <Toggle param="criticalOnly" label="Critical Only" desc="Only receive critical severity alerts" />
                <div className="mt-4 p-3 rounded-lg border border-slate-700/50">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Auto-Refresh Interval (seconds)</label>
                  <input type="range" min={10} max={120} step={10} value={settings.autoRefreshInterval}
                    onChange={(e) => setSettings((s) => ({ ...s, autoRefreshInterval: Number(e.target.value) }))}
                    className="w-full accent-cyan-500" />
                  <div className="text-right text-xs text-cyan-400 mt-1">{settings.autoRefreshInterval}s</div>
                </div>
              </div>
            )}

            {activeTab === 'AI Settings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">AI Model Configuration</h3>
                <Toggle param="enableExplainability" label="Enable Explainability" desc="Show SHAP explanations for all predictions" />
                <Toggle param="realtimeStreaming" label="Real-time Streaming" desc="Enable WebSocket live data stream" />
                <div className="p-3 rounded-lg border border-slate-700/50">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Anomaly Detection Threshold: {settings.anomalyThreshold}
                  </label>
                  <input type="range" min={0.3} max={0.95} step={0.05} value={settings.anomalyThreshold}
                    onChange={(e) => setSettings((s) => ({ ...s, anomalyThreshold: Number(e.target.value) }))}
                    className="w-full accent-cyan-500" />
                </div>
                <div className="p-3 rounded-lg border border-slate-700/50">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Min AI Confidence: {settings.aiConfidenceMin}
                  </label>
                  <input type="range" min={0.5} max={0.99} step={0.05} value={settings.aiConfidenceMin}
                    onChange={(e) => setSettings((s) => ({ ...s, aiConfidenceMin: Number(e.target.value) }))}
                    className="w-full accent-cyan-500" />
                </div>
                <div className="p-3 rounded-lg border border-cyan-500/15 bg-cyan-500/5">
                  <div className="text-xs font-semibold text-cyan-400 mb-1">Model Integration</div>
                  <div className="text-xs text-slate-400">
                    Replace mock predictions by placing your trained models in <code className="text-cyan-400">/backend/models/</code>
                    and updating endpoint handlers in the router files. All API endpoints are pre-configured for ML model integration.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Security Settings</h3>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2"><Shield className="w-4 h-4" /> Security Status: Active</div>
                  <div className="text-xs text-slate-400">All API communications are encrypted. JWT-based authentication is enabled.</div>
                </div>
                {['Change Password', 'Enable 2FA', 'Active Sessions', 'Audit Log'].map((item) => (
                  <button key={item} className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 text-sm text-slate-300 hover:text-slate-100 transition-colors">
                    {item} <span className="text-slate-500">→</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'System' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">System Information</h3>
                {[
                  { label: 'Platform Version', value: 'GridShield AI v3.2.1' },
                  { label: 'Backend API', value: 'FastAPI + Python 3.13' },
                  { label: 'Database', value: 'SQLite (Enterprise)' },
                  { label: 'AI Engine', value: 'GridShield AI v3.2 (Mock Mode)' },
                  { label: 'WebSocket', value: 'Active — 3 clients' },
                  { label: 'Uptime', value: '99.1% (30 days)' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs text-slate-300 font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={handleSave} className={`btn-primary flex items-center gap-2 py-2 px-6 text-sm transition-all ${saved ? 'bg-emerald-500/80' : ''}`}>
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  )
}
