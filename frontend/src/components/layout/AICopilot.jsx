import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Loader, Sparkles, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { copilotApi } from '../../services/api'
import ReactMarkdown from 'react-markdown'

export default function AICopilot() {
  const { copilotOpen, toggleCopilot } = useAppStore()
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '🔮 **GridShield AI Copilot** online. I have full visibility into your grid infrastructure, anomaly patterns, and revenue metrics. How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    copilotApi.suggestions().then(setSuggestions).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (query) => {
    const q = query || input.trim()
    if (!q) return
    setInput('')

    setMessages((prev) => [...prev, { role: 'user', content: q, timestamp: new Date() }])
    setLoading(true)
    setThinking(true)

    try {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))
      setThinking(false)
      const res = await copilotApi.query({ query: q })
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: res.response,
          actions: res.actions,
          confidence: res.confidence,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: '⚠️ Unable to process query. Please try again.', timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
      setThinking(false)
    }
  }

  return (
    <AnimatePresence>
      {copilotOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 h-svh w-full sm:w-96 max-w-full z-[80] flex flex-col"
          style={{ background: 'rgba(2, 8, 23, 0.98)', borderLeft: '1px solid rgba(147, 51, 234, 0.3)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-purple-500/20">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-orbitron text-sm font-bold text-purple-400">AI COPILOT</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">GridShield v3.2 Active</span>
              </div>
            </div>
            <button onClick={toggleCopilot} className="ml-auto p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400 font-mono">GridShield AI</span>
                      {msg.confidence && (
                        <span className="text-xs text-slate-500">({Math.round(msg.confidence * 100)}% conf)</span>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-tr-sm'
                        : 'bg-purple-900/30 border border-purple-500/20 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'ai' ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.actions && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {msg.actions.map((a, j) => (
                        <button key={j} className="text-xs px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}

            {thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-purple-900/30 border border-purple-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader className="w-3 h-3 text-purple-400 animate-spin" />
                    <span className="text-xs text-purple-400 font-mono">Analyzing grid data...</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-purple-500/10">
              <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> Quick queries
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 transition-colors border border-transparent hover:border-purple-500/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-purple-500/10">
            <div className="flex gap-2">
              <input
                className="cyber-input flex-1 text-sm"
                placeholder="Ask about your grid..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                disabled={loading}
                style={{ borderColor: 'rgba(147, 51, 234, 0.3)' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-purple-500/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
