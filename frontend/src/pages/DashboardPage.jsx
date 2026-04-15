import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, TrendingUp, Award, Target, Mic, Loader, Activity, Database, Radar, Brain, BookOpen } from 'lucide-react'
import { ScoreTrendChart, CategoryBarChart } from '../components/ProgressChart'
import { getStats, generateIdealAnswer } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, color, glow, label, value, sub, delay }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') return
    const timer = setTimeout(() => {
      const dur = 1500
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1)
        const ease = 1 - Math.pow(1 - t, 4)
        setDisplayed(Math.round(ease * value))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`glass-card p-6 relative overflow-hidden flex flex-col items-center text-center border-white/5 hover:border-white/20 transition-all ${glow}`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 rounded-full blur-xl pointer-events-none`} />
      
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10 ${color.replace('text', 'bg').replace('500', '500/10')}`}>
        <Icon size={20} className={color} />
      </div>
      
      <div className={`font-mono text-4xl font-bold text-white mb-1 drop-shadow-md`}>
        {typeof value === 'number' ? displayed : (value ?? '—')}
      </div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-brand-300/50 mt-1 uppercase tracking-widest">{sub}</div>}
    </motion.div>
  )
}

// Learning Library Card Component
function IdealAnswerCard({ question, category, score, onLearnMore, delay }) {
  const [idealAnswer, setIdealAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLoadIdealAnswer = async () => {
    if (idealAnswer) return // Already loaded
    
    setLoading(true)
    try {
      const res = await generateIdealAnswer({
        question,
        category,
        difficulty: score >= 75 ? 'hard' : score >= 50 ? 'medium' : 'easy'
      })
      if (res.success && res.result) {
        setIdealAnswer(res.result)
      }
    } catch (err) {
      console.error('Failed to load ideal answer:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 border-accent-violet/20 space-y-4 hover:border-accent-violet/40 transition-all"
    >
      {/* Question & Score */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm text-slate-300 line-clamp-2">{question}</p>
          <span className={`text-xs font-mono px-2 py-1 rounded whitespace-nowrap ${
            score >= 75 ? 'bg-accent-green/20 text-accent-green' :
            score >= 50 ? 'bg-accent-amber/20 text-accent-amber' :
            'bg-rose-500/20 text-rose-400'
          }`}>
            {score}/100
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{category}</p>
      </div>

      {/* Expand Button / Ideal Answer Preview */}
      {!idealAnswer ? (
        <button
          onClick={handleLoadIdealAnswer}
          disabled={loading}
          className="w-full py-2 bg-accent-violet/10 hover:bg-accent-violet/20 border border-accent-violet/30 rounded text-xs text-accent-violet font-mono uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={12} className="animate-spin" /> Loading
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Brain size={12} /> View Ideal Answer
            </span>
          )}
        </button>
      ) : (
        <div className="space-y-3 bg-accent-violet/5 border border-accent-violet/20 rounded p-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-accent-violet font-bold">✨ IDEAL ANSWER PREVIEW</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
            {idealAnswer.ideal_answer}
          </p>
          {idealAnswer.key_points && idealAnswer.key_points.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-accent-violet/20">
              <p className="text-[10px] font-mono text-accent-cyan uppercase tracking-widest">Key Strengths:</p>
              <ul className="space-y-1">
                {idealAnswer.key_points.slice(0, 2).map((point, idx) => (
                  <li key={idx} className="text-[10px] text-slate-400 flex gap-2">
                    <span className="text-accent-cyan">▸</span> {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, getUserDisplayName } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState([])

  // Helper to load all sessions from localStorage
  const loadStatsFromLocalStorage = (userId) => {
    try {
      // Use same key structure as api.js lsSave function
      const LS_PREFIX = 'mockmate_session_history_'
      const LS_KEY = userId ? `${LS_PREFIX}${userId}` : LS_PREFIX
      const allSessions = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
      
      if (allSessions.length === 0) return null

      // Include all scores >= 0 (don't filter out zeros)
      const scores = allSessions
        .map(s => s.overallScore ?? 0)
        .filter(s => typeof s === 'number' && s >= 0)
      
      if (scores.length === 0) return null

      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      const bestScore = Math.max(...scores)
      const recentScore = scores[0] ?? 0

      // Group by category
      const byCategory = {}
      ;['Behavioral', 'Technical', 'Leadership', 'Product'].forEach(cat => {
        const catSessions = allSessions.filter(s => s.category === cat)
        if (catSessions.length > 0) {
          const catScores = catSessions
            .map(s => s.overallScore ?? 0)
            .filter(s => typeof s === 'number' && s >= 0)
          if (catScores.length > 0) {
            byCategory[cat] = {
              count: catSessions.length,
              avg: Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length)
            }
          }
        }
      })

      // Generate trend (reversed to show oldest → newest for proper chart display)
      const trend = allSessions
        .slice(0, 20)
        .reverse()
        .map(s => ({
          date: s.createdAt || new Date().toISOString(),
          score: s.overallScore ?? 0,
          category: s.category
        }))

      return {
        totalSessions: allSessions.length,
        averageScore: avgScore,
        bestScore: bestScore,
        recentScore: recentScore,
        trend: trend,
        byCategory: byCategory
      }
    } catch (err) {
      console.warn('[Dashboard] localStorage load failed:', err)
      return null
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStats(user?.id)
      
      // If backend has data, use it
      if (data?.stats && data.stats.totalSessions > 0) {
        setStats(data.stats)
      } else {
        // Fallback: load all sessions from localStorage with userId
        const localStats = loadStatsFromLocalStorage(user?.id)
        if (localStats) {
          setStats(localStats)
        }
      }

      // Load recent sessions for learning library
      const LS_PREFIX = 'mockmate_session_history_'
      const LS_KEY = user?.id ? `${LS_PREFIX}${user.id}` : LS_PREFIX
      const allSessions = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
      
      // Get 5 most recent sessions
      const recentSessions = allSessions
        .filter(s => s.question && s.overallScore !== undefined)
        .slice(0, 5)
        .map(s => ({
          question: s.question,
          category: s.category,
          score: s.overallScore
        }))
      
      setSessions(recentSessions)

    } catch (err) {
      console.error('[Dashboard] Load failed:', err)
      setError('Failed to load telemetry data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="min-h-screen pt-24 pb-16 bg-dark-900 overflow-hidden relative font-sans">
      {/* Background ambient lighting */}
      <div className="fixed top-[10%] -left-[10%] w-[60%] h-[60%] bg-brand-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-accent-cyan/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-6 border-brand-500/30 shadow-glow-sm"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3 uppercase tracking-tight">
              <Activity size={24} className="text-brand-400 animate-pulse" /> 
              Global Telemetry & Analytics
            </h1>
            <p className="text-brand-300/60 font-mono text-xs mt-2 uppercase tracking-widest">
              Subject Name: <span className="text-white">{getUserDisplayName()}</span>
            </p>
          </div>
          <Link to="/practice" className="btn-primary text-sm py-3 px-6 shadow-glow">
            <Mic size={16} /> Initiate Practice
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative w-20 h-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-2 border-brand-400 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-b-2 border-accent-cyan rounded-full" />
              <Radar size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand-400 animate-pulse">Syncing Telemetry...</p>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center border-rose-500/30 shadow-[0_0_20px_rgba(248,113,113,0.15)]">
            <p className="font-mono text-sm text-rose-400 uppercase tracking-widest">{error}</p>
            <button onClick={load} className="btn-secondary mt-6 text-sm">Retry Connection</button>
          </motion.div>
        ) : !stats || stats.totalSessions === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-20 text-center space-y-6 border-white/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-hero-glow opacity-20 pointer-events-none mix-blend-screen" />
            <div className="w-24 h-24 bg-dark-800 border-2 border-dashed border-brand-500/40 rounded-full flex items-center justify-center mx-auto relative shadow-glow-sm">
              <Database size={32} className="text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Database Empty</h3>
            <p className="text-slate-400 font-mono text-sm max-w-md mx-auto uppercase tracking-widest">
              Insufficient data. Complete a practice session to generate telemetry.
            </p>
            <Link to="/practice" className="btn-primary inline-flex text-sm py-4 px-8 mt-4 shadow-glow">
              <Mic size={16} /> Begin Data Collection
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 perspective-[1000px]">
              <StatCard icon={Database} color="text-brand-400" glow="shadow-glow-sm" label="Recorded Sessions" value={stats.totalSessions} delay={0.1} />
              <StatCard icon={TrendingUp} color="text-accent-cyan" glow="shadow-glow-cyan" label="Mean Score" value={stats.averageScore} sub="/ 100" delay={0.2} />
              <StatCard icon={Award} color="text-accent-green" glow="shadow-[0_0_20px_rgba(52,211,153,0.3)]" label="Peak Performance" value={stats.bestScore} sub="Personal Best" delay={0.3} />
              <StatCard icon={Target} color="text-accent-violet" glow="shadow-glow-purple" label="Latest Readout" value={stats.recentScore} sub="Previous Session" delay={0.4} />
            </div>

            {/* Detailed Metrics from Most Recent Session */}
            {stats.trend && stats.trend.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="glass-card p-6 border-accent-violet/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={100} className="text-accent-violet" /></div>
                <h3 className="text-sm font-mono uppercase tracking-widest text-accent-violet mb-6 flex items-center gap-2 relative z-10">
                  <Brain size={16} /> AI-Generated Score Breakdown (Latest Session)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
                  {(() => {
                    // Get the most recent session to show detailed scores
                    const LS_PREFIX = 'mockmate_session_history_'
                    const LS_KEY = `${LS_PREFIX}${user?.id || ''}`
                    const allSessions = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
                    const latestSession = allSessions[0]
                    
                    if (!latestSession) return <p className="text-slate-400 text-sm col-span-full">No detailed metrics available</p>
                    
                    const metrics = [
                      { label: 'Overall', value: latestSession.overallScore, color: 'text-brand-400' },
                      { label: 'Clarity', value: latestSession.clarityScore, color: 'text-accent-cyan' },
                      { label: 'Structure', value: latestSession.structureScore, color: 'text-accent-amber' },
                      { label: 'Confidence', value: latestSession.confidenceScore, color: 'text-accent-green' },
                      { label: 'Relevance', value: latestSession.relevanceScore, color: 'text-accent-violet' },
                      { label: 'English', value: latestSession.englishScore, color: 'text-rose-400' },
                      { label: 'Fluency', value: latestSession.fluencyScore, color: 'text-blue-400' },
                    ]
                    
                    return metrics.map((m, i) => (
                      <div key={i} className={`flex flex-col items-center p-3 bg-dark-800/50 rounded-lg border border-white/5 hover:border-white/20 transition-all`}>
                        <div className={`text-2xl font-mono font-bold ${m.color} mb-1`}>
                          {m.value !== undefined ? Math.round(m.value) : '—'}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">{m.label}</div>
                        {m.value !== undefined && (
                          <div className="w-full h-1 bg-dark-900 rounded-full mt-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${m.value}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full ${m.color.replace('text', 'bg')}`}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  })()}
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend chart */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="glass-card p-6 border-brand-500/20 relative"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><TrendingUp size={120} className="text-brand-400" /></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-brand-300 flex items-center gap-2">
                    <Activity size={16} /> Performance Trajectory
                  </h3>
                  <span className="text-[10px] uppercase font-mono bg-dark-800 px-2 py-1 rounded text-slate-500 border border-white/5">n={stats.trend?.length || 0}</span>
                </div>
                <div className="h-64 filter drop-shadow-[0_0_10px_rgba(79,157,255,0.3)] relative z-10 transition-transform hover:scale-[1.01] duration-500">
                  <ScoreTrendChart data={stats.trend || []} />
                </div>
              </motion.div>

              {/* Category breakdown */}
              {Object.keys(stats.byCategory || {}).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="glass-card p-6 border-accent-cyan/20 relative"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none"><LayoutDashboard size={120} className="text-accent-cyan" /></div>
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-accent-cyan flex items-center gap-2">
                      <Database size={16} /> Category Distribution
                    </h3>
                  </div>
                  <div className="h-64 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] relative z-10 transition-transform hover:scale-[1.01] duration-500">
                    <CategoryBarChart data={stats.byCategory} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* AI Summary / Encouragement */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 border-accent-amber/30 shadow-[0_0_20px_rgba(251,191,36,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-amber/10 to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-dark-900 border border-accent-amber/40 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.4)] relative z-10">
                <Award size={28} className="text-accent-amber drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-mono text-accent-amber mb-1 uppercase tracking-widest">AI Diagnostics</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  {stats.averageScore >= 80 ? 'Exceptional performance. Subject is interview-ready.' :
                   stats.averageScore >= 65 ? 'Progress nominal. Recommend further refinement to reach 80+ index.' :
                   'Initial learning phase. Focus on structural frameworks (STAR) to improve indices.'}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-2 uppercase">Analysis based on {stats.totalSessions} data points</p>
              </div>
            </motion.div>

            {/* Learning Library - Ideal Answers */}
            {sessions && sessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono text-accent-violet uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={16} className="text-accent-violet" /> Learning Library - Recent Questions
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{sessions.length} questions</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((session, idx) => (
                    <IdealAnswerCard
                      key={idx}
                      question={session.question}
                      category={session.category}
                      score={session.score}
                      delay={0.85 + idx * 0.05}
                    />
                  ))}
                </div>

                <div className="text-center pt-4">
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                    💡 Tip: Click "View Ideal Answer" to learn how an expert would answer each question
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
