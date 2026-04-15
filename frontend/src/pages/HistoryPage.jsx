import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { History, Filter, Calendar, Tag, ChevronRight, Loader, Mic } from 'lucide-react'
import { getSessions } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const CATEGORY_COLORS = {
  Behavioral: 'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
  Technical:  'text-accent-cyan   bg-accent-cyan/10   border-accent-cyan/20',
  Leadership: 'text-accent-amber  bg-accent-amber/10  border-accent-amber/20',
  Product:    'text-accent-green  bg-accent-green/10  border-accent-green/20',
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#34d399' : score >= 65 ? '#818cf8' : score >= 50 ? '#fbbf24' : '#f87171'
  return (
    <span className="font-mono text-sm font-bold" style={{ color }}>{score}</span>
  )
}

function SessionCard({ session }) {
  const date = new Date(session.createdAt || session.created_at)
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const catStyle = CATEGORY_COLORS[session.category] || 'text-slate-400 bg-slate-400/10 border-slate-400/20'

  return (
    <div className="glass-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${catStyle}`}>
              {session.category}
            </span>
            <span className="text-xs text-slate-600">{formattedDate} · {formattedTime}</span>
            {session.verdict && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border
                ${session.verdict === 'Strong' ? 'text-accent-green bg-accent-green/10 border-accent-green/20' :
                  session.verdict === 'Good' ? 'text-brand-300 bg-brand-500/10 border-brand-500/20' :
                  session.verdict === 'Weak' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                  'text-accent-amber bg-accent-amber/10 border-accent-amber/20'}`}>
                {session.verdict}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-relaxed">
            {session.question}
          </p>
          {session.shortSummary && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{session.shortSummary}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <ScoreBadge score={session.overallScore || session.overall_score} />
          <p className="text-[10px] text-slate-600 mt-0.5">/ 100</p>
        </div>
      </div>

      {/* Mini score row */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.05] flex-wrap">
        {[
          ['Clarity', session.clarityScore || session.clarity_score],
          ['Structure', session.structureScore || session.structure_score],
          ['Fluency', session.fluencyScore || session.fluency_score],
          ['English', session.englishScore || session.english_score],
        ].filter(([, v]) => v != null).map(([label, val]) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">{label}</span>
            <span className="text-[11px] font-mono text-slate-300">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [error, setError] = useState('')
  const [isLocal, setIsLocal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSessions(user?.id, category)
      setSessions(data.sessions || [])
      setIsLocal(data._source === 'localStorage')
    } catch (err) {
      setError('Could not load sessions. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [user?.id, category])

  useEffect(() => { load() }, [load])


  const categories = ['All', 'Behavioral', 'Technical', 'Leadership', 'Product']

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <History size={22} className="text-brand-400" /> Session History
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Review your past practice sessions</p>
          </div>
          <Link to="/practice" className="btn-primary text-sm py-2 px-4">
            <Mic size={14} /> Practice
          </Link>
        </div>

        {/* Filter */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-slate-500" />
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-all
                  ${category === c ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' : 'border-white/[0.07] text-slate-400 hover:text-white hover:border-white/[0.15]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* LocalStorage indicator */}
        {isLocal && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-xs font-mono">
            <span>⚡</span> Showing locally stored history (backend offline)
          </div>
        )}

        {/* Sessions */}
        {loading ? (

          <div className="flex items-center justify-center py-16">
            <Loader size={24} className="text-brand-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-center">
            <p className="text-rose-400 text-sm">{error}</p>
            <button onClick={load} className="btn-secondary mt-3 text-sm">Retry</button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <History size={28} className="text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No sessions yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {category !== 'All' ? `No ${category} sessions found. Try a different filter.` : 'Start your first practice session to see your history here.'}
            </p>
            <Link to="/practice" className="btn-primary inline-flex text-sm">
              <Mic size={14} /> Start Practicing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
            {sessions.map((s, i) => <SessionCard key={s.id || i} session={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
