import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout (eager — needed immediately)
import AppLayout from './components/layout/AppLayout'

// Eager: auth + common pages
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import SignupPage   from './pages/SignupPage'
import Dashboard    from './pages/Dashboard'

// Lazy: heavy pages to improve initial bundle size
const GeoMapPage        = lazy(() => import('./pages/GeoMapPage'))
const TopologyPage      = lazy(() => import('./pages/TopologyPage'))
const SimulationPage    = lazy(() => import('./pages/SimulationPage'))
const LiveStreamPage    = lazy(() => import('./pages/LiveStreamPage'))
const AnomalyPage       = lazy(() => import('./pages/AnomalyPage'))
const TheftDetectionPage= lazy(() => import('./pages/TheftDetectionPage'))
const ForecastPage      = lazy(() => import('./pages/ForecastPage'))
const RevenuePage       = lazy(() => import('./pages/RevenuePage'))
const TransformerPage   = lazy(() => import('./pages/TransformerPage'))
const ExplainabilityPage= lazy(() => import('./pages/ExplainabilityPage'))
const InspectionPage    = lazy(() => import('./pages/InspectionPage'))
const ExecutivePage     = lazy(() => import('./pages/ExecutivePage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))

// Store
import { useAppStore } from './store/useAppStore'
import { authApi }     from './services/api'

// ── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="text-center">
        <div className="loader-ring mx-auto mb-4" />
        <div className="text-sm text-slate-500">Loading module…</div>
      </div>
    </div>
  )
}

// ── Auth bootstrap — rehydrates from localStorage token ─────────────────────
function AuthBootstrap({ children }) {
  const { token, setUser, setToken, isAuthenticated } = useAppStore()

  useEffect(() => {
    if (token && !isAuthenticated) {
      // Immediately mark authenticated to prevent redirect flash
      useAppStore.setState({ isAuthenticated: true })
      authApi.me()
        .then((user) => setUser(user))
        .catch(() => setToken(null))
    }
  }, [token])   // eslint-disable-line react-hooks/exhaustive-deps

  return children
}

// ── Lazy route wrapper ───────────────────────────────────────────────────────
function LazyRoute({ element: El }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <El />
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          {/* Public */}
          <Route path="/"       element={<LandingPage />} />
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected — inside AppLayout shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/map"           element={<LazyRoute element={GeoMapPage} />} />
            <Route path="/stream"        element={<LazyRoute element={LiveStreamPage} />} />
            <Route path="/anomalies"     element={<LazyRoute element={AnomalyPage} />} />
            <Route path="/theft"         element={<LazyRoute element={TheftDetectionPage} />} />
            <Route path="/forecast"      element={<LazyRoute element={ForecastPage} />} />
            <Route path="/revenue"       element={<LazyRoute element={RevenuePage} />} />
            <Route path="/transformers"  element={<LazyRoute element={TransformerPage} />} />
            <Route path="/topology"      element={<LazyRoute element={TopologyPage} />} />
            <Route path="/simulation"    element={<LazyRoute element={SimulationPage} />} />
            <Route path="/explainability"element={<LazyRoute element={ExplainabilityPage} />} />
            <Route path="/inspections"   element={<LazyRoute element={InspectionPage} />} />
            <Route path="/executive"     element={<LazyRoute element={ExecutivePage} />} />
            <Route path="/settings"      element={<LazyRoute element={SettingsPage} />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
