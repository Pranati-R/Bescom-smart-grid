import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, AlertTriangle, Activity, Info } from 'lucide-react'
import { gridApi } from '../services/api'
import { GlowBadge, CyberCard } from '../components/ui/Components'
import 'leaflet/dist/leaflet.css'

// ── Leaflet default icon fix (bundler strips the marker images) ──────────────
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Lazy-import react-leaflet so it doesn't break SSR / tree-shaking
import {
  MapContainer, TileLayer, CircleMarker,
  LayerGroup, Tooltip as MapTooltip,
} from 'react-leaflet'

// ── Constants ────────────────────────────────────────────────────────────────
const MAP_STYLES = {
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  standard:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
}

const LEGEND = [
  { color: '#ff2d55', label: 'High Theft Risk (>70%)' },
  { color: '#ff6b35', label: 'Medium Risk (40–70%)' },
  { color: '#ffd700', label: 'Low Anomaly (<40%)' },
  { color: '#00ff88', label: 'Normal' },
  { color: '#00d4ff', label: 'Transformer' },
]

function getMeterColor(m) {
  if (m.theft_probability > 0.7) return '#ff2d55'
  if (m.theft_probability > 0.4) return '#ff6b35'
  if (m.anomaly_score       > 0.5) return '#ffd700'
  return '#00ff88'
}
function getTxrColor(t) {
  if (t.status === 'critical') return '#ff2d55'
  if (t.status === 'warning')  return '#ff6b35'
  return '#00d4ff'
}

// ── Overlay panel (glassmorphic card positioned on top of the map) ────────────
function MapPanel({ children, className = '' }) {
  return (
    <div
      className={`absolute z-[400] rounded-xl border border-cyan-500/20 shadow-xl ${className}`}
      style={{ background: 'rgba(2,8,23,0.88)', backdropFilter: 'blur(18px)' }}
    >
      {children}
    </div>
  )
}

export default function GeoMapPage() {
  const [mapData,       setMapData]       = useState({ meters: [], transformers: [], substations: [] })
  const [loading,       setLoading]       = useState(true)
  const [selectedMeter, setSelectedMeter] = useState(null)
  const [mapStyle,      setMapStyle]      = useState('dark')
  const [filterMode,    setFilterMode]    = useState('all')
  const [showLayer,     setShowLayer]     = useState({ meters: true, transformers: true, substations: true })

  useEffect(() => {
    gridApi.mapData({ limit: 300 })
      .then(setMapData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredMeters = mapData.meters.filter((m) => {
    if (filterMode === 'suspicious') return m.is_suspicious
    if (filterMode === 'critical')   return m.theft_probability > 0.7
    return true
  })

  const stats = {
    total:       mapData.meters.length,
    suspicious:  mapData.meters.filter((m) => m.is_suspicious).length,
    critical:    mapData.meters.filter((m) => m.theft_probability > 0.7).length,
    transformers:mapData.transformers.length,
  }

  return (
    /*
     * KEY FIX: The map page must fill the remaining viewport height
     * without relying on h-full inside overflow-y: auto (page-scroll).
     * We use "calc(100svh - 56px)" where 56px = TopNav height.
     * position:relative lets the absolute overlay panels sit inside.
     */
    <div
      className="map-fullscreen relative w-full overflow-hidden"
      style={{ background: '#020817' }}
    >
      {/* ── Controls — top-left ─────────────────────────────────────── */}
      <MapPanel className="top-3 left-3 p-2.5 w-[168px]">
        {/* Style switcher */}
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Map Style</div>
        <div className="flex gap-1 mb-3">
          {Object.keys(MAP_STYLES).map((s) => (
            <button
              key={s}
              onClick={() => setMapStyle(s)}
              className={`flex-1 px-1.5 py-1 rounded text-[10px] font-medium capitalize transition-all ${
                mapStyle === s
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Layer toggles */}
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Layers</div>
        <div className="space-y-0.5 mb-3">
          {Object.entries(showLayer).map(([layer, active]) => (
            <button
              key={layer}
              onClick={() => setShowLayer((p) => ({ ...p, [layer]: !p[layer] }))}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-all ${active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span className="capitalize">{layer}</span>
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 px-0.5">Filter</div>
        <div className="space-y-0.5">
          {[['all','All Meters'],['suspicious','Suspicious'],['critical','Critical']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-all ${filterMode === mode ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${filterMode === mode ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
              {label}
            </button>
          ))}
        </div>
      </MapPanel>

      {/* ── Stats — top-right ───────────────────────────────────────── */}
      <MapPanel className="top-3 right-3 p-3 w-44">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Map Statistics</div>
        <div className="space-y-1.5">
          {[
            { label: 'Total Meters',  val: stats.total,       color: 'text-cyan-400' },
            { label: 'Suspicious',    val: stats.suspicious,  color: 'text-orange-400' },
            { label: 'Critical',      val: stats.critical,    color: 'text-rose-400' },
            { label: 'Transformers',  val: stats.transformers,color: 'text-blue-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <span className={`font-mono font-semibold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
      </MapPanel>

      {/* ── Legend — bottom-left ────────────────────────────────────── */}
      <MapPanel className="bottom-6 left-3 p-3">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Legend</div>
        <div className="space-y-1.5">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
              <span className="text-[11px] text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </MapPanel>

      {/* ── Loading spinner ─────────────────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center" style={{ background: 'rgba(2,8,23,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center">
            <div className="loader-ring mx-auto mb-4" />
            <div className="text-slate-400 text-sm">Loading Grid Map…</div>
          </div>
        </div>
      )}

      {/* ── Leaflet Map ─────────────────────────────────────────────── */}
      <MapContainer
        center={[17.3850, 78.4867]}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={MAP_STYLES[mapStyle]}
          attribution='&copy; <a href="https://carto.com">CARTO</a> / OpenStreetMap'
        />

        {/* Meters layer */}
        {showLayer.meters && (
          <LayerGroup>
            {filteredMeters.map((m) => (
              <CircleMarker
                key={m.id}
                center={[m.lat, m.lon]}
                radius={m.is_suspicious ? 8 : 5}
                fillColor={getMeterColor(m)}
                color={getMeterColor(m)}
                weight={1.5}
                opacity={0.9}
                fillOpacity={0.8}
                eventHandlers={{ click: () => setSelectedMeter(m) }}
              >
                <MapTooltip sticky>
                  <div style={{ background:'#0a1628', border:'1px solid rgba(0,212,255,0.2)', borderRadius:6, padding:'4px 8px', color:'#e2e8f0', fontSize:11 }}>
                    <div className="font-semibold">{m.meter_id}</div>
                    <div>Theft: {(m.theft_probability * 100).toFixed(0)}%</div>
                    <div>District: {m.district}</div>
                  </div>
                </MapTooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* Transformers layer */}
        {showLayer.transformers && (
          <LayerGroup>
            {mapData.transformers.map((t) => (
              <CircleMarker
                key={t.id}
                center={[t.lat, t.lon]}
                radius={12}
                fillColor={getTxrColor(t)}
                color={getTxrColor(t)}
                weight={2}
                opacity={1}
                fillOpacity={0.35}
              >
                <MapTooltip>
                  <div style={{ background:'#0a1628', border:'1px solid rgba(0,212,255,0.2)', borderRadius:6, padding:'4px 8px', color:'#e2e8f0', fontSize:11 }}>
                    <div className="font-semibold">{t.code}</div>
                    <div>Health: {t.health_score?.toFixed(0)}%</div>
                    <div>Overload: {(t.overload_probability * 100).toFixed(0)}%</div>
                  </div>
                </MapTooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}

        {/* Substations layer */}
        {showLayer.substations && (
          <LayerGroup>
            {mapData.substations.map((s) => (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lon]}
                radius={16}
                fillColor="#9b59b6"
                color="#9b59b6"
                weight={2}
                opacity={1}
                fillOpacity={0.3}
              >
                <MapTooltip>
                  <div style={{ background:'#0a1628', border:'1px solid rgba(155,89,182,0.3)', borderRadius:6, padding:'4px 8px', color:'#e2e8f0', fontSize:11 }}>
                    <div className="font-semibold">{s.name}</div>
                    <div>Status: {s.status}</div>
                  </div>
                </MapTooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        )}
      </MapContainer>

      {/* ── Meter Detail Drawer — slides in from right ──────────────── */}
      <AnimatePresence>
        {selectedMeter && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{   x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute right-3 top-3 bottom-6 w-72 z-[450] flex flex-col"
          >
            <div
              className="flex-1 rounded-xl border border-cyan-500/25 p-5 overflow-y-auto flex flex-col gap-4"
              style={{ background: 'rgba(2,8,23,0.92)', backdropFilter: 'blur(20px)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-cyan-400 font-semibold">{selectedMeter.meter_id}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedMeter.district}</div>
                </div>
                <button
                  onClick={() => setSelectedMeter(null)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                  aria-label="Close detail panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theft risk bar */}
              <div className={`p-3 rounded-lg border ${selectedMeter.theft_probability > 0.6 ? 'border-rose-500/30 bg-rose-500/8' : 'border-slate-700/50 bg-slate-800/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Theft Probability</span>
                  <GlowBadge severity={selectedMeter.theft_probability > 0.7 ? 'critical' : selectedMeter.theft_probability > 0.4 ? 'high' : 'low'}>
                    {(selectedMeter.theft_probability * 100).toFixed(0)}%
                  </GlowBadge>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selectedMeter.theft_probability * 100}%`,
                      background: selectedMeter.theft_probability > 0.7 ? '#ff2d55' : selectedMeter.theft_probability > 0.4 ? '#ff6b35' : '#00ff88',
                      boxShadow: `0 0 8px ${selectedMeter.theft_probability > 0.7 ? '#ff2d55' : '#ff6b35'}`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics list */}
              <div className="space-y-0.5">
                {[
                  { label: 'Anomaly Score',   value: `${(selectedMeter.anomaly_score * 100).toFixed(0)}%`, Icon: AlertTriangle },
                  { label: 'Consumer Type',   value: selectedMeter.consumer_type,                          Icon: Info },
                  { label: 'Current Usage',   value: `${selectedMeter.current_kwh?.toFixed(2)} kWh`,       Icon: Zap },
                  { label: 'Status',          value: selectedMeter.status,                                  Icon: Activity },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                    <span className="text-xs text-slate-200 font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <button className="mt-auto w-full py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/10 transition-colors">
                View Full Analytics →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
