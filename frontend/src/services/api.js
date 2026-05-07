import axios from 'axios'

// Use Vite proxy in dev; in production set VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err.message || 'Network error')
  }
)

/* ─── Auth ────────────────────────────────────────────────────────────────── */
export const authApi = {
  login:  (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  me:     ()     => api.get('/auth/me'),
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
export const dashboardApi = {
  metrics:      ()         => api.get('/dashboard/metrics'),
  kpis:         ()         => api.get('/dashboard/kpis'),
  alerts:       (params)   => api.get('/dashboard/alerts', { params }),
  markRead:     (id)       => api.put(`/dashboard/alerts/${id}/read`),
  systemHealth: ()         => api.get('/dashboard/system-health'),
}

/* ─── Grid ────────────────────────────────────────────────────────────────── */
export const gridApi = {
  mapData:           (params) => api.get('/grid/map-data', { params }),
  meters:            (params) => api.get('/grid/meters', { params }),
  meterDetail:       (id)     => api.get(`/grid/meters/${id}`),
  transformers:      (params) => api.get('/grid/transformers', { params }),
  transformerDetail: (id)     => api.get(`/grid/transformers/${id}`),
  topology:          ()       => api.get('/grid/topology'),
}

/* ─── Analytics ───────────────────────────────────────────────────────────── */
export const analyticsApi = {
  anomalies:      (params)        => api.get('/analytics/anomalies', { params }),
  anomalyStats:   ()              => api.get('/analytics/anomaly-stats'),
  forecast:       (params)        => api.get('/analytics/forecast', { params }),
  theftRanking:   (params)        => api.get('/analytics/theft-ranking', { params }),
  explainability: (type, id)      => api.get(`/analytics/explainability/${type}/${id}`),
  revenue:        (params)        => api.get('/analytics/revenue', { params }),
  simulation:     (params)        => api.get('/analytics/simulation', { params }),
}

/* ─── Inspections ─────────────────────────────────────────────────────────── */
export const inspectionApi = {
  list:         (params)        => api.get('/inspections/', { params }),
  create:       (data)          => api.post('/inspections/', data),
  updateStatus: (id, params)    => api.put(`/inspections/${id}/status`, null, { params }),
  stats:        ()              => api.get('/inspections/stats'),
}

/* ─── AI Copilot ──────────────────────────────────────────────────────────── */
export const copilotApi = {
  query:       (data) => api.post('/copilot/query', data),
  suggestions: ()     => api.get('/copilot/suggestions'),
}

/* ─── ML Inference ────────────────────────────────────────────────────────── */
export const mlApi = {
  health:           ()              => api.get('/ml/health'),
  models:           ()              => api.get('/ml/models'),

  // Theft detection
  predictTheft:       (data)        => api.post('/ml/predict/theft', data),
  predictTheftBatch:  (data)        => api.post('/ml/predict/theft/batch', data),
  predictTheftGet:    (meterId)     => api.get(`/ml/predict/anomaly/${meterId}`),

  // Demand forecasting
  predictForecast:    (params)      => api.get('/ml/predict/forecast', { params }),
  predictForecastPost:(data)        => api.post('/ml/predict/forecast', data),

  // Overload prediction
  predictOverload:    (data)        => api.post('/ml/predict/overload', data),
  predictOverloadGet: (txrId)       => api.get(`/ml/predict/overload/${txrId}`),

  // Anomaly detection
  detectAnomaly:      (data)        => api.post('/ml/predict/anomaly', data),
  detectAnomalyGet:   (meterId)     => api.get(`/ml/predict/anomaly/${meterId}`),

  // District risk
  districtRisk:       (district)    => api.get(`/ml/risk/district/${district}`),
  allDistrictRisks:   ()            => api.get('/ml/risk/all-districts'),
}

export default api
