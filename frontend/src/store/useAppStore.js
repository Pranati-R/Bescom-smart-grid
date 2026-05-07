import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,

  setUser:  (user)  => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token)
    else       localStorage.removeItem('token')
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false, token: null })
  },

  // ── UI State ──────────────────────────────────────────────────────────────
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  sidebarMobileOpen: false,
  setSidebarMobileOpen: (v) => set({ sidebarMobileOpen: v }),
  toggleSidebarMobileOpen: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),

  theme: 'dark',
  setTheme: (t) => set({ theme: t }),

  copilotOpen: false,
  setCopilotOpen: (v) => set({ copilotOpen: v }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),

  // ── Real-time Data ────────────────────────────────────────────────────────
  metrics: null,
  setMetrics: (m) => set({ metrics: m }),

  streamEvents: [],
  addStreamEvent: (e) =>
    set((s) => ({ streamEvents: [e, ...s.streamEvents].slice(0, 150) })),
  clearStream: () => set({ streamEvents: [] }),

  alerts: [],
  setAlerts: (a)  => set({ alerts: Array.isArray(a) ? a : [] }),
  addAlert:  (a)  => set((s) => ({ alerts: [a, ...s.alerts].slice(0, 50) })),
  unreadAlerts: 0,
  setUnreadAlerts: (n) => set({ unreadAlerts: n }),

  // ── WebSocket ─────────────────────────────────────────────────────────────
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  // ── Selected entities ─────────────────────────────────────────────────────
  selectedMeter:       null,
  setSelectedMeter:       (m) => set({ selectedMeter: m }),
  selectedTransformer: null,
  setSelectedTransformer: (t) => set({ selectedTransformer: t }),

  // ── Map state ─────────────────────────────────────────────────────────────
  mapMode:   'dark',
  setMapMode:   (m) => set({ mapMode: m }),
  mapCenter: [17.3850, 78.4867],
  setMapCenter: (c) => set({ mapCenter: c }),
  mapZoom:   12,
  setMapZoom:   (z) => set({ mapZoom: z }),

  // ── Filters ───────────────────────────────────────────────────────────────
  filters: { district: null, severity: null, anomalyType: null, isSuspicious: null },
  setFilter: (key, val) =>
    set((s) => ({ filters: { ...s.filters, [key]: val } })),
  clearFilters: () =>
    set({ filters: { district: null, severity: null, anomalyType: null, isSuspicious: null } }),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: [],
  addNotification:    (n)  => set((s) => ({ notifications: [{ id: Date.now(), ...n }, ...s.notifications].slice(0, 10) })),
  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  // ── ML Model State ────────────────────────────────────────────────────────
  mlHealth: null,
  setMlHealth: (h) => set({ mlHealth: h }),

  mlPredictions: {},
  setMlPrediction: (key, value) =>
    set((s) => ({ mlPredictions: { ...s.mlPredictions, [key]: value } })),
  clearMlPredictions: () => set({ mlPredictions: {} }),
}))
