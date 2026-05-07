import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import ParticleBackground from '../components/ui/ParticleBackground'
import { useAppStore } from '../store/useAppStore'
import { authApi } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAppStore()
  const [form, setForm] = useState({ email: 'admin@smartgrid.ai', password: 'secret' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(form)
      setToken(res.access_token)
      setUser(res.user)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials. Use admin@smartgrid.ai / secret')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setForm({ email: 'admin@smartgrid.ai', password: 'secret' })
    setLoading(true)
    try {
      const res = await authApi.login({ email: 'admin@smartgrid.ai', password: 'secret' })
      setToken(res.access_token)
      setUser(res.user)
      navigate('/dashboard')
    } catch {
      setError('Demo login failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#020817' }}>
      <ParticleBackground />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-strong rounded-2xl border border-cyan-500/20 p-8 shadow-2xl shadow-cyan-500/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-orbitron text-xl font-bold text-cyan-400 text-glow-blue">GRIDSHIELD AI</h1>
            <p className="text-slate-500 text-sm mt-1">Intelligence Platform Access</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="cyber-input pl-10"
                  type="email"
                  placeholder="admin@smartgrid.ai"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="cyber-input pl-10 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 text-sm p-3 rounded-lg border border-rose-500/20 bg-rose-500/10">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? (
                <div className="loader-ring w-5 h-5 border-2" />
              ) : (
                <><span>Access Platform</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Demo Access */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-sm font-semibold"
          >
            ⚡ One-Click Demo Access
          </button>

          <div className="mt-6 text-center">
            <span className="text-slate-500 text-sm">No account? </span>
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">Create Access</Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
            <div className="text-xs text-slate-500 text-center">Demo credentials</div>
            <div className="text-xs font-mono text-slate-400 text-center mt-1">admin@smartgrid.ai / secret</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          GridShield AI Platform v3.2 — Enterprise Edition
        </p>
      </motion.div>
    </div>
  )
}
