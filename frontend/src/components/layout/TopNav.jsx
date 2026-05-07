import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Sun, Moon, Wifi, WifiOff, Cpu, Menu, X, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { dashboardApi } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const SEARCH_ROUTES = [
  { label: 'Command Center',    path: '/dashboard' },
  { label: 'Anomaly Detection', path: '/anomalies' },
  { label: 'Theft Detection',   path: '/theft' },
  { label: 'Demand Forecast',   path: '/forecast' },
  { label: 'Revenue Analytics', path: '/revenue' },
  { label: 'Transformer Twin',  path: '/transformers' },
  { label: 'Grid Topology',     path: '/topology' },
  { label: 'Explainable AI',    path: '/explainability' },
  { label: 'Inspections',       path: '/inspections' },
  { label: 'Geo Map',           path: '/map' },
  { label: 'Live Stream',       path: '/stream' },
  { label: 'Simulation',        path: '/simulation' },
  { label: 'Executive View',    path: '/executive' },
  { label: 'Settings',          path: '/settings' },
]

export default function TopNav({ pageTitle }) {
  const {
    user, theme, setTheme,
    alerts, unreadAlerts, setUnreadAlerts,
    wsConnected, toggleSidebarMobileOpen,
    logout,
  } = useAppStore()
  const navigate = useNavigate()

  const [time, setTime] = useState(new Date())
  const [showAlerts, setShowAlerts] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [aiHealth, setAiHealth] = useState(null)

  const alertsRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    dashboardApi.systemHealth().then(setAiHealth).catch(() => {})
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setShowAlerts(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })

  const filteredRoutes = searchQuery.trim().length > 0
    ? SEARCH_ROUTES.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const handleSearchSelect = (path) => {
    navigate(path)
    setSearchQuery('')
    setShowSearch(false)
  }

  const handleMarkAllRead = () => {
    setUnreadAlerts(0)
    setShowAlerts(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="h-14 md:h-16 glass-strong border-b border-cyan-500/15 flex items-center gap-2 px-3 md:px-5 relative z-40 flex-shrink-0"
      role="banner"
    >
      {/* Mobile hamburger */}
      <button
        id="mobile-menu-btn"
        onClick={toggleSidebarMobileOpen}
        aria-label="Open navigation menu"
        className="md:hidden p-2 rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-shrink-0 min-w-0">
        <h1 className="font-orbitron text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider truncate max-w-[140px] sm:max-w-none">
          {pageTitle}
        </h1>
        <div className="text-xs text-slate-500 font-mono hidden sm:block">{formatDate(time)}</div>
      </div>

      {/* Search — desktop */}
      <div ref={searchRef} className="hidden md:flex flex-1 max-w-xs mx-4 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="global-search"
            className="cyber-input pl-9 h-9 text-sm"
            placeholder="Search pages, meters, districts…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true) }}
            onFocus={() => setShowSearch(true)}
            autoComplete="off"
          />
        </div>
        <AnimatePresence>
          {showSearch && filteredRoutes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute top-full left-0 mt-1 w-full glass-strong rounded-xl border border-cyan-500/20 overflow-hidden shadow-2xl z-50"
            >
              {filteredRoutes.map((r) => (
                <button
                  key={r.path}
                  onClick={() => handleSearchSelect(r.path)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Clock — md+ */}
        <div className="hidden md:flex flex-col items-end flex-shrink-0">
          <div className="font-mono text-sm text-cyan-400 font-semibold">{formatTime(time)}</div>
          <div className="flex items-center gap-1.5">
            {wsConnected
              ? <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-400">LIVE</span></>
              : <><WifiOff className="w-3 h-3 text-rose-400" /><span className="text-xs text-rose-400">OFFLINE</span></>
            }
          </div>
        </div>

        {/* AI Status badge — lg+ */}
        {aiHealth && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-mono">{aiHealth.ai_engine?.accuracy || '94'}% AI</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="p-2 rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Alerts bell */}
        <div ref={alertsRef} className="relative">
          <button
            id="alerts-btn"
            onClick={() => setShowAlerts((v) => !v)}
            aria-label={`Alerts — ${unreadAlerts} unread`}
            className="relative p-2 rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 sm:w-80 glass-strong rounded-xl border border-cyan-500/20 overflow-hidden shadow-2xl z-50"
                style={{ maxWidth: 'calc(100vw - 16px)' }}
              >
                <div className="p-3 border-b border-cyan-500/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Active Alerts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-mono">{alerts.length}</span>
                    {unreadAlerts > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.slice(0, 8).map((alert, i) => (
                    <div key={alert.id || i} className="p-3 border-b border-slate-800/50 hover:bg-cyan-500/5 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                          alert.severity === 'critical' ? 'bg-rose-400' :
                          alert.severity === 'high'     ? 'bg-orange-400' :
                          alert.severity === 'medium'   ? 'bg-yellow-400' : 'bg-emerald-400'
                        } animate-pulse`} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 truncate">{alert.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="p-6 text-center text-sm text-slate-500">No active alerts</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            id="profile-btn"
            onClick={() => setShowProfile((v) => !v)}
            aria-label="Profile menu"
            className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name?.[0] || 'A'}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 glass-strong rounded-xl border border-cyan-500/20 p-2 shadow-2xl z-50"
                style={{ maxWidth: 'calc(100vw - 16px)' }}
              >
                <div className="px-3 py-2 border-b border-slate-700/50 mb-1">
                  <div className="text-sm font-medium text-slate-200 truncate">{user?.full_name || 'Admin'}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
                </div>
                <button
                  onClick={() => { navigate('/settings'); setShowProfile(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
