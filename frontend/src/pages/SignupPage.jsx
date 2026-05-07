import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import ParticleBackground from '../components/ui/ParticleBackground'
import { useAppStore } from '../store/useAppStore'
import { authApi } from '../services/api'

export default function SignupPage() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAppStore()
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', department: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.signup({ ...form, role: 'analyst' })
      setToken(res.access_token)
      setUser(res.user)
      navigate('/dashboard')
    } catch (err) {
      setError('Registration failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#020817' }}>
      <ParticleBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl border border-cyan-500/20 p-8 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-orbitron text-lg font-bold text-cyan-400">CREATE ACCESS</h1>
            <p className="text-slate-500 text-xs mt-1">GridShield AI Platform</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            {[
              { key: 'full_name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Smith' },
              { key: 'username', label: 'Username', icon: User, type: 'text', placeholder: 'johnsmith' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'john@utility.com' },
              { key: 'department', label: 'Department', icon: Building2, type: 'text', placeholder: 'Grid Operations' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input className="cyber-input pl-10" type={type} placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key !== 'department'} />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className="cyber-input pl-10 pr-10" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="text-rose-400 text-sm p-3 rounded-lg border border-rose-500/20 bg-rose-500/10">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <div className="loader-ring w-5 h-5 border-2" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-slate-500 text-sm">Already have access? </span>
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">Sign In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
