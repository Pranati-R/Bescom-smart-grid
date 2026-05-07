import React, { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Zap, AlertTriangle, TrendingUp,
  Activity, Shield, Eye, GitBranch, Settings, LogOut,
  ChevronLeft, ChevronRight, Bot, Cpu, FileText,
  BarChart3, Layers, FlaskConical, X,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const NAV_ITEMS = [
  { path: '/dashboard',     icon: LayoutDashboard, label: 'Command Center',   group: 'overview' },
  { path: '/map',           icon: Map,             label: 'Geo Intelligence', group: 'overview' },
  { path: '/stream',        icon: Activity,        label: 'Live Stream',      group: 'overview', badge: 'LIVE' },
  { path: '/anomalies',     icon: AlertTriangle,   label: 'Anomaly Detection',group: 'analytics' },
  { path: '/theft',         icon: Shield,          label: 'Theft Detection',  group: 'analytics' },
  { path: '/forecast',      icon: TrendingUp,      label: 'Demand Forecast',  group: 'analytics' },
  { path: '/revenue',       icon: BarChart3,       label: 'Revenue Analytics',group: 'analytics' },
  { path: '/transformers',  icon: Zap,             label: 'Transformer Twin', group: 'monitoring' },
  { path: '/topology',      icon: GitBranch,       label: 'Grid Topology',    group: 'monitoring' },
  { path: '/simulation',    icon: FlaskConical,    label: 'Grid Simulation',  group: 'monitoring' },
  { path: '/explainability',icon: Eye,             label: 'Explainable AI',   group: 'ai' },
  { path: '/inspections',   icon: FileText,        label: 'Inspections',      group: 'operations' },
  { path: '/executive',     icon: Layers,          label: 'Executive View',   group: 'operations' },
  { path: '/settings',      icon: Settings,        label: 'Settings',         group: 'system' },
]

const GROUP_LABELS = {
  overview:   'Overview',
  analytics:  'AI Analytics',
  monitoring: 'Grid Monitoring',
  ai:         'AI Intelligence',
  operations: 'Operations',
  system:     'System',
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const {
    sidebarCollapsed, toggleSidebar,
    user, logout, toggleCopilot,
    wsConnected,
    sidebarMobileOpen, setSidebarMobileOpen,
  } = useAppStore()

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarMobileOpen(false)
  }, [pathname, setSidebarMobileOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))]

  // ── Sidebar content (shared between mobile & desktop) ──────────────────
  const sidebarContent = (
    <>
      {/* Logo row */}
      <div className="flex items-center gap-3 p-4 border-b border-cyan-500/15 min-h-[64px] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <Cpu className="w-4 h-4 text-white" />
        </div>

        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="font-orbitron font-bold text-cyan-400 text-sm leading-tight text-glow-blue whitespace-nowrap">GRIDSHIELD</div>
              <div className="text-xs text-slate-500 whitespace-nowrap">AI Intelligence Platform</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="ml-auto p-1.5 rounded-lg hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0 hidden md:flex items-center"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Close button — mobile only */}
        <button
          onClick={() => setSidebarMobileOpen(false)}
          aria-label="Close sidebar"
          className="ml-auto p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0 md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* WS status */}
      <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConnected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-slate-500 whitespace-nowrap overflow-hidden"
            >
              {wsConnected ? 'Live Connected' : 'Reconnecting...'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group)
          return (
            <div key={group} className="mb-1">
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-widest"
                  >
                    {GROUP_LABELS[group]}
                  </motion.div>
                )}
              </AnimatePresence>

              {items.map((item) => {
                const active = pathname === item.path || pathname.startsWith(item.path + '/')
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`sidebar-item ${active ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />

                      <AnimatePresence initial={false}>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm flex-1 whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {item.badge && !sidebarCollapsed && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono animate-pulse flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* AI Copilot */}
      <div className="px-2 py-2 border-t border-cyan-500/10 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleCopilot}
          title={sidebarCollapsed ? 'AI Copilot' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/20 text-purple-400 hover:border-purple-500/40 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <Bot className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                AI Copilot
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* User profile */}
      <div className="px-2 py-3 border-t border-cyan-500/10 flex-shrink-0">
        <div className={`flex items-center gap-3 px-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.full_name?.[0] || 'A'}
          </div>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="text-sm font-medium text-slate-200 truncate">{user?.full_name || 'Admin'}</div>
                <div className="text-xs text-slate-500 truncate">{user?.role || 'Administrator'}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout}
                aria-label="Sign out"
                className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarMobileOpen && (
        <div
          className="sidebar-overlay open md:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — CSS drives mobile vs desktop behaviour */}
      <aside
        className={`sidebar-panel
          ${sidebarMobileOpen ? 'mobile-open' : ''}
          ${sidebarCollapsed ? 'collapsed' : 'expanded'}
        `}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
