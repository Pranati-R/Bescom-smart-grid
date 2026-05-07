import React, { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import AICopilot from './AICopilot'
import ParticleBackground from '../ui/ParticleBackground'
import { useAppStore } from '../../store/useAppStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { dashboardApi } from '../../services/api'

const PAGE_TITLES = {
  '/dashboard':    'Command Center',
  '/map':          'Geo Intelligence Map',
  '/stream':       'Live Data Stream',
  '/anomalies':    'Anomaly Detection',
  '/theft':        'Theft Detection',
  '/forecast':     'Demand Forecasting',
  '/revenue':      'Revenue Analytics',
  '/transformers': 'Transformer Digital Twin',
  '/topology':     'Grid Topology',
  '/simulation':   'Grid Simulation Sandbox',
  '/explainability':'Explainable AI Center',
  '/inspections':  'Inspection Management',
  '/executive':    'Executive Analytics',
  '/settings':     'Platform Settings',
}

export default function AppLayout() {
  const { isAuthenticated, setAlerts, setUnreadAlerts } = useAppStore()
  const { pathname } = useLocation()

  useWebSocket()

  useEffect(() => {
    dashboardApi.alerts()
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setAlerts(arr)
        setUnreadAlerts(arr.filter((a) => !a.is_read).length)
      })
      .catch(() => {})
  }, [setAlerts, setUnreadAlerts])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const pageTitle = PAGE_TITLES[pathname] || 'GridShield AI'

  return (
    <div className="app-shell">
      <ParticleBackground />

      {/* Sidebar — handles its own mobile overlay internally */}
      <Sidebar />

      {/* Main content */}
      <div className="main-slot relative z-10">
        <TopNav pageTitle={pageTitle} />

        <main className="page-scroll grid-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Copilot drawer */}
      <AICopilot />
    </div>
  )
}
