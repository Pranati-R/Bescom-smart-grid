import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Zap, Network } from 'lucide-react'
import { gridApi } from '../services/api'
import { CyberCard, PageHeader } from '../components/ui/Components'

function TopologyNode({ node, x, y, selected, onClick }) {
  const typeConfig = {
    substation: { color: '#9b59b6', size: 24, label: '⚡' },
    feeder: { color: '#00d4ff', size: 18, label: '━' },
    transformer: { color: node.data?.overload > 0.7 ? '#ff2d55' : node.data?.status === 'warning' ? '#ff6b35' : '#00ff88', size: 14, label: '◈' },
  }
  const config = typeConfig[node.type] || typeConfig.transformer

  return (
    <g onClick={() => onClick(node)} style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={config.size} fill={config.color} fillOpacity={0.15} stroke={config.color} strokeWidth={selected ? 3 : 1.5}
        style={{ filter: selected ? `drop-shadow(0 0 8px ${config.color})` : `drop-shadow(0 0 3px ${config.color})` }} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={config.size * 0.8} fill={config.color}>
        {config.label}
      </text>
      <text x={x} y={y + config.size + 10} textAnchor="middle" fontSize={9} fill="#64748b">{node.label?.slice(0, 12)}</text>
    </g>
  )
}

export default function TopologyPage() {
  const [topology, setTopology] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    gridApi.topology().then(setTopology).finally(() => setLoading(false))
  }, [])

  // Layout nodes in a tree structure
  const nodePositions = {}
  const substations = topology.nodes.filter((n) => n.type === 'substation')
  const feeders = topology.nodes.filter((n) => n.type === 'feeder')
  const transformers = topology.nodes.filter((n) => n.type === 'transformer')

  const W = 900, H = 600
  substations.forEach((n, i) => { nodePositions[n.id] = { x: (i + 1) * W / (substations.length + 1), y: 80 } })
  feeders.forEach((n, i) => { nodePositions[n.id] = { x: (i + 1) * W / (feeders.length + 1), y: 240 } })
  transformers.forEach((n, i) => { nodePositions[n.id] = { x: 30 + (i % 30) * (W - 60) / 30, y: 380 + Math.floor(i / 30) * 80 } })

  return (
    <div className="page-pad space-y-5">
      <PageHeader title="Grid Topology Visualizer" subtitle="Interactive network graph: Substation → Feeder → Transformer → Meters" />

      <div className="kpi-grid">
        {[
          { label: 'Substations', count: substations.length, color: '#9b59b6' },
          { label: 'Feeders', count: feeders.length, color: '#00d4ff' },
          { label: 'Transformers', count: transformers.length, color: '#00ff88' },
          { label: 'Total Nodes', count: topology.nodes.length, color: '#ffd700' },
        ].map((s, i) => (
          <CyberCard key={i} className="p-3 text-center">
            <div className="text-2xl font-bold font-orbitron" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </CyberCard>
        ))}
      </div>

      <CyberCard className="p-4 overflow-hidden">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="loader-ring" />
          </div>
        ) : (
          <div className="w-full aspect-video min-h-[400px]">
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H + 60}`} preserveAspectRatio="xMidYMid meet">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.04)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={W} height={H + 60} fill="url(#grid)" />

              {/* Layer Labels */}
              <text x={10} y={70} fontSize={10} fill="#475569">SUBSTATIONS</text>
              <text x={10} y={230} fontSize={10} fill="#475569">FEEDERS</text>
              <text x={10} y={370} fontSize={10} fill="#475569">TRANSFORMERS</text>

              {/* Horizontal dividers */}
              <line x1={0} y1={155} x2={W} y2={155} stroke="rgba(0,212,255,0.05)" />
              <line x1={0} y1={310} x2={W} y2={310} stroke="rgba(0,212,255,0.05)" />

              {/* Edges */}
              {topology.edges.map((edge) => {
                const src = nodePositions[edge.source]
                const tgt = nodePositions[edge.target]
                if (!src || !tgt) return null
                const isHighlighted = selected?.id === edge.source || selected?.id === edge.target
                return (
                  <line key={edge.id} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={isHighlighted ? '#00d4ff' : 'rgba(0,212,255,0.15)'}
                    strokeWidth={isHighlighted ? 1.5 : 0.8}
                    strokeDasharray={isHighlighted ? '0' : '4 4'}
                  />
                )
              })}

              {/* Nodes */}
              {topology.nodes.map((node) => {
                const pos = nodePositions[node.id]
                if (!pos) return null
                return (
                  <TopologyNode
                    key={node.id}
                    node={node}
                    x={pos.x}
                    y={pos.y}
                    selected={selected?.id === node.id}
                    onClick={setSelected}
                  />
                )
              })}
            </svg>
          </div>
        )}
      </CyberCard>

      {/* Selected Node Info */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CyberCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-200 capitalize">{selected.type}: {selected.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Health: {selected.data?.health?.toFixed(0)}% | Status: {selected.data?.status}
                  {selected.data?.overload !== undefined && ` | Overload: ${(selected.data.overload * 100).toFixed(0)}%`}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
          </CyberCard>
        </motion.div>
      )}
    </div>
  )
}
