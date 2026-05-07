import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, Zap, Shield, TrendingUp, Map, Activity, ArrowRight, ChevronDown } from 'lucide-react'
import ParticleBackground from '../components/ui/ParticleBackground'

const STATS = [
  { label: 'Smart Meters Monitored', value: '2.4M+', icon: Activity },
  { label: 'AI Accuracy', value: '96.8%', icon: Cpu },
  { label: 'Revenue Recovered', value: '₹48Cr', icon: TrendingUp },
  { label: 'Theft Cases Detected', value: '12,400+', icon: Shield },
]

const FEATURES = [
  { icon: Shield, title: 'AI Theft Detection', desc: 'SHAP-powered anomaly detection with 94%+ accuracy across all meter types and tariff categories.' },
  { icon: TrendingUp, title: 'Demand Forecasting', desc: 'LSTM-based 48-hour demand predictions with confidence intervals and weather correlation.' },
  { icon: Map, title: 'Geo Intelligence', desc: 'Real-time heatmaps, animated power flows, and smart meter analytics at household level.' },
  { icon: Zap, title: 'Digital Twin', desc: '3D transformer visualization with predictive failure analysis and thermal monitoring.' },
  { icon: Activity, title: 'Live Streaming', desc: 'WebSocket-powered real-time event streaming with severity-coded alert system.' },
  { icon: Cpu, title: 'Explainable AI', desc: 'SHAP value visualizations with decision trees explaining every AI prediction.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#020817' }}>
      <ParticleBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-orbitron font-bold text-cyan-400 text-lg text-glow-blue">GRIDSHIELD AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Platform', 'Features', 'Analytics', 'Security'].map((item) => (
            <button key={item} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">{item}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2 px-4">Sign In</button>
          <button onClick={() => navigate('/signup')} className="btn-primary text-sm py-2 px-4">Get Access</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-8 pt-24">
        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-6"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">AI-Powered Smart Grid Platform v3.2</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-orbitron text-center text-5xl md:text-7xl font-bold leading-tight mb-6"
        >
          <span className="text-white">INTELLIGENT</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ textShadow: 'none' }}>
            GRID COMMAND
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-lg text-center max-w-2xl mb-10 leading-relaxed"
        >
          Enterprise-grade AI platform for real-time grid monitoring, theft detection, demand forecasting,
          and revenue optimization. Built for modern utility infrastructure.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 mb-16"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center gap-2 text-base px-8 py-3"
          >
            Launch Platform <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/login')} className="btn-ghost text-base px-8 py-3">
            Sign In
          </button>
        </motion.div>

        {/* Animated Grid Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative w-full max-w-5xl rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl shadow-cyan-500/10"
          style={{ background: 'rgba(2, 8, 23, 0.9)' }}
        >
          {/* Fake dashboard preview */}
          <div className="p-4 border-b border-cyan-500/15 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 h-5 bg-slate-800/50 rounded-full flex items-center px-4">
              <span className="text-xs text-slate-500 font-mono">gridshield.ai/dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
            {[
              { label: 'Total Demand', val: '892 MW', color: 'cyan' },
              { label: 'Anomalies', val: '67 Active', color: 'orange' },
              { label: 'Revenue Loss', val: '₹9.8L', color: 'red' },
              { label: 'AI Confidence', val: '94.7%', color: 'green' },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30"
              >
                <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                <div className={`font-orbitron font-bold text-lg ${
                  m.color === 'cyan' ? 'text-cyan-400' :
                  m.color === 'orange' ? 'text-orange-400' :
                  m.color === 'red' ? 'text-rose-400' : 'text-emerald-400'
                }`}>{m.val}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="mx-4 mb-4 h-32 rounded-xl border border-slate-700/50 bg-slate-800/20 flex items-center justify-center overflow-hidden relative">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 70 C 50 50 100 80 150 40 S 250 60 300 30 S 380 50 400 45 L 400 100 L 0 100 Z"
                fill="url(#lineGrad)"
              />
              <path
                d="M 0 70 C 50 50 100 80 150 40 S 250 60 300 30 S 380 50 400 45"
                fill="none" stroke="#00d4ff" strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 4px #00d4ff)' }}
              />
            </svg>
            <div className="absolute top-3 left-4 text-xs font-mono text-slate-500">DEMAND FORECAST — 48H</div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-slate-500">Explore Features</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-8 border-y border-cyan-500/10" style={{ background: 'rgba(0, 212, 255, 0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-3">
                <stat.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="font-orbitron text-3xl font-bold text-cyan-400 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h2 className="font-orbitron text-3xl font-bold text-white mb-4">
              ENTERPRISE AI CAPABILITIES
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every module is designed for enterprise scale, real-time performance, and seamless ML model integration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="cyber-card p-6"
              >
                <div className="inline-flex p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
          <h2 className="font-orbitron text-4xl font-bold text-white mb-6">
            READY TO COMMAND YOUR GRID?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Access the full platform with demo data. Integrate your ML models in minutes.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary text-lg px-10 py-4 flex items-center gap-2 mx-auto"
          >
            Launch GridShield AI <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-cyan-500/10 text-center">
        <div className="text-sm text-slate-600">© 2026 GridShield AI Intelligence Platform. Enterprise Edition v3.2</div>
      </footer>
    </div>
  )
}
