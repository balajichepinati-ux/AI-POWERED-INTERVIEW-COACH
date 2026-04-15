import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw, Activity, ShieldAlert, Sparkles, CheckCircle2, XCircle, Zap, Target, MessageSquare, Brain, Lightbulb } from 'lucide-react'
import { generateIdealAnswer } from '../lib/api'

// ─── Built-in SVG Circular Progress (no external package needed) ───
function CircularScore({ score, size = 176 }) {
  const r = 76
  const circ = 2 * Math.PI * r
  const color = score >= 80 ? '#34d399' : score >= 65 ? '#4F9DFF' : score >= 50 ? '#fbbf24' : '#f87171'
  const [displayed, setDisplayed] = useState(0)
  const [dash, setDash] = useState(circ)

  useEffect(() => {
    const dur = 1600
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(ease * score))
      setDash(circ - ease * (circ * score / 100))
      if (t < 1) requestAnimationFrame(tick)
    }
    const id = setTimeout(() => requestAnimationFrame(tick), 300)
    return () => clearTimeout(id)
  }, [score])

  return (
    <svg width={size} height={size} viewBox="0 0 176 176">
      {/* Glow filter */}
      <defs>
        <filter id="score-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="88" cy="88" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {/* Rotating dashed accent */}
      <circle cx="88" cy="88" r="86" fill="none" stroke={`${color}18`} strokeWidth="1"
        strokeDasharray="4 8" transform={`rotate(${displayed * 3.6} 88 88)`} />
      {/* Progress arc */}
      <circle
        cx="88" cy="88" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        transform="rotate(-90 88 88)"
        filter="url(#score-glow)"
        style={{ transition: 'stroke 0.3s' }}
      />
      {/* Score text */}
      <text x="88" y="82" textAnchor="middle" fill="#fff" fontSize="38" fontWeight="bold"
        fontFamily="monospace" dy="0.35em">{displayed}</text>
      <text x="88" y="110" textAnchor="middle" fill={color} fontSize="10"
        fontFamily="monospace" letterSpacing="3" dy="0.35em">SCORE</text>
    </svg>
  )
}

function MiniScore({ label, score, delay }) {
  const color = score >= 80 ? '#34d399' : score >= 65 ? '#4F9DFF' : score >= 50 ? '#fbbf24' : '#f87171'
  const glow = score >= 80 ? 'shadow-[0_0_15px_rgba(52,211,153,0.3)]' : score >= 65 ? 'shadow-[0_0_15px_rgba(79,157,255,0.3)]' : score >= 50 ? 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'shadow-[0_0_15px_rgba(248,113,113,0.3)]'
  const [displayed, setDisplayed] = useState(0)
  
  useEffect(() => {
    // delay the counting
    const timer = setTimeout(() => {
      const dur = 1500
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1)
        const ease = 1 - Math.pow(1 - t, 4)
        setDisplayed(Math.round(ease * score))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.05 }}
      style={{ borderColor: `${color}33` }}
      className={`flex flex-col items-center p-5 glass-card border ${glow} hover:border-opacity-100 transition-colors`}
    >
      <div className="font-mono text-3xl font-bold mb-2 drop-shadow-md" style={{ color }}>{displayed}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 text-center leading-tight font-mono">{label}</div>
      <div className="w-full mt-3 h-1.5 bg-dark-600 rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
          className="h-full rounded-full" 
          style={{ background: color, boxShadow: `0 0 10px ${color}` }} 
        />
      </div>
    </motion.div>
  )
}

export default function ResultsPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const topRef = useRef(null)
  const [idealAnswer, setIdealAnswer] = useState(null)
  const [loadingIdealAnswer, setLoadingIdealAnswer] = useState(false)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch ideal answer when component mounts
  useEffect(() => {
    if (state?.question && state?.category) {
      setLoadingIdealAnswer(true)
      generateIdealAnswer({
        question: state.question,
        category: state.category,
        resumeContext: state.resumeContext,
        difficulty: state.difficulty || 'medium'
      })
        .then(res => {
          if (res.success && res.result) {
            setIdealAnswer(res.result)
          }
        })
        .catch(err => console.error('Failed to generate ideal answer:', err))
        .finally(() => setLoadingIdealAnswer(false))
    }
  }, [state?.question, state?.category])

  if (!state?.analysis) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-dark-900">
        <div className="glass-card p-10 text-center space-y-4 border-brand-500/30">
          <Activity size={32} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 font-mono">NO ANALYSIS DATA FOUND IN MEMORY.</p>
          <Link to="/practice" className="btn-primary inline-flex mt-4! font-mono uppercase tracking-widest text-sm">Initiate Practice</Link>
        </div>
      </div>
    )
  }

  const { analysis, question, answer, category } = state

  const getVerdictStyle = (v) => {
    if (v === 'Strong') return 'text-accent-green border-accent-green shadow-[0_0_15px_rgba(52,211,153,0.5)] bg-accent-green/10'
    if (v === 'Good') return 'text-brand-400 border-brand-400 shadow-[0_0_15px_rgba(79,157,255,0.5)] bg-brand-500/10'
    if (v === 'Weak') return 'text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(248,113,113,0.5)] bg-rose-500/10'
    return 'text-accent-amber border-accent-amber shadow-[0_0_15px_rgba(251,191,36,0.5)] bg-accent-amber/10'
  }

  return (
    <div ref={topRef} className="min-h-screen pt-24 pb-16 bg-dark-900 overflow-hidden relative font-sans">
      
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between glass-card p-4 border-white/5"
        >
          <button onClick={() => navigate('/practice')} className="btn-secondary text-xs py-2 px-4 uppercase tracking-widest font-mono hover:bg-white/5 hover:text-white border-0 bg-transparent shadow-none">
            <ArrowLeft size={14} /> System Return
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan border border-accent-cyan/30 px-2 py-1 rounded bg-accent-cyan/10 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
              MODULE: {category}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Hero Score Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden border-brand-500/30 shadow-glow text-center min-h-[400px]"
          >
            <div className="absolute inset-0 bg-hero-glow opacity-30 pointer-events-none mix-blend-screen" />
            <Sparkles size={20} className="absolute top-6 left-6 text-brand-400 opacity-50" />
            <Target size={20} className="absolute bottom-6 right-6 text-accent-violet opacity-50" />
            
            <p className="text-[10px] font-mono text-brand-300 uppercase tracking-widest mb-8">Performance Index</p>
            
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <CircularScore score={analysis.overallScore ?? 0} />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <span className={`inline-block px-6 py-2 rounded font-mono text-sm uppercase tracking-widest border ${getVerdictStyle(analysis.verdict)}`}>
                {analysis.verdict}
              </span>
            </motion.div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MiniScore label="Clarity" score={analysis.clarityScore} delay={0.1} />
            <MiniScore label="Structure" score={analysis.structureScore} delay={0.2} />
            <MiniScore label="Confidence" score={analysis.confidenceScore} delay={0.3} />
            <MiniScore label="Relevance" score={analysis.relevanceScore} delay={0.4} />
            <MiniScore label="Vocab/Grammar" score={analysis.englishScore} delay={0.5} />
            <MiniScore label="Fluency" score={analysis.fluencyScore} delay={0.6} />
          </div>
        </div>

          {/* Detailed Analysis Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6 border-accent-green/20 shadow-[0_4px_20px_rgba(52,211,153,0.05)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 size={100} className="text-accent-green" /></div>
            <h3 className="text-sm font-mono text-accent-green uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} /> Positives
            </h3>
            <ul className="space-y-3 relative z-10">
              {(analysis.strengths?.length > 0 ? analysis.strengths : ['Keep practicing to build strong patterns']).map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-accent-green mt-0.5">▶</span> {s}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6 border-rose-500/20 shadow-[0_4px_20px_rgba(248,113,113,0.05)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10"><XCircle size={100} className="text-rose-400" /></div>
            <h3 className="text-sm font-mono text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={16} /> Areas For Patching
            </h3>
            <ul className="space-y-3 relative z-10">
              {(
                (analysis.weaknesses?.length > 0 ? analysis.weaknesses : null) ||
                (analysis.improvements?.length > 0 ? analysis.improvements : null) ||
                ['Focus on adding more concrete examples']
              ).map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-rose-400 mt-0.5">▶</span> {s}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Score Breakdown (new 0-10 schema) */}
        {analysis.breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="glass-card p-6 border-accent-violet/20"
          >
            <h3 className="text-sm font-mono text-accent-violet uppercase tracking-widest mb-5 flex items-center gap-2">
              <Target size={16} className="text-accent-violet" /> Dimension Breakdown (0–10)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Object.entries(analysis.breakdown).map(([key, val]) => {
                const label = key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
                const pct   = Math.round((val / 10) * 100)
                const color = val >= 8 ? '#34d399' : val >= 5 ? '#4F9DFF' : val >= 3 ? '#fbbf24' : '#f87171'
                return (
                  <div key={key} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-800/60">
                    <div className="font-mono text-2xl font-bold" style={{ color }}>{val}</div>
                    <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 text-center">{label}</div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}


        {/* Rewrite Suggestion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-1 relative overflow-hidden border-brand-500/40 shadow-glow-purple"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-accent-violet/10" />
          <div className="relative bg-dark-900/80 p-6 m-[1px] rounded-[15px]">
            <h3 className="text-sm font-mono text-brand-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap size={16} className="text-accent-amber drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" /> 
              Optimal STAR Response Generated
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed italic border-l-2 border-brand-500/50 pl-4 py-2 bg-brand-500/5 rounded-r">
              {analysis.rewriteSuggestion}
            </p>
          </div>
        </motion.div>

        {/* AI-Powered Ideal Answer Feedback */}
        {idealAnswer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="glass-card p-1 relative overflow-hidden border-accent-violet/40 shadow-[0_0_30px_rgba(167,139,250,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/10 to-accent-cyan/10" />
            <div className="relative bg-dark-900/80 p-6 m-[1px] rounded-[15px] space-y-5">
              
              {/* Header */}
              <div>
                <h3 className="text-sm font-mono text-accent-violet uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Brain size={16} className="text-accent-cyan drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> 
                  AI-Powered Ideal Answer for Learning
                </h3>
                <p className="text-xs text-slate-400 font-mono">Learn how an expert would answer this question</p>
              </div>

              {/* Perfect Answer */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-accent-cyan font-mono">📝 IDEAL RESPONSE</p>
                <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-4">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {idealAnswer.ideal_answer}
                  </p>
                </div>
              </div>

              {/* STAR Breakdown */}
              {idealAnswer.structure_breakdown && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-brand-400 font-mono">⭐ STAR METHOD BREAKDOWN</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(idealAnswer.structure_breakdown).map(([step, description]) => (
                      <div key={step} className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-3">
                        <div className="text-xs uppercase tracking-widest text-brand-400 font-bold mb-1.5">
                          {step.replace('_', ' ')}
                        </div>
                        <p className="text-xs text-slate-300">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Points */}
              {idealAnswer.key_points && idealAnswer.key_points.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-accent-green font-mono">✨ KEY STRENGTHS OF THIS ANSWER</p>
                  <div className="space-y-2">
                    {idealAnswer.key_points.map((point, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-accent-green/5 border border-accent-green/20 rounded p-3">
                        <span className="text-accent-green font-bold text-xs mt-1">{idx + 1}.</span>
                        <p className="text-xs text-slate-300">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics & Delivery Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idealAnswer.metrics_included && idealAnswer.metrics_included.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-accent-amber font-mono">📊 QUANTIFIABLE RESULTS INCLUDED</p>
                    <div className="space-y-1.5">
                      {idealAnswer.metrics_included.map((metric, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-accent-amber/5 border border-accent-amber/20 rounded px-3 py-2">
                          <span className="text-accent-amber">▸</span> {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {idealAnswer.tips_for_delivery && idealAnswer.tips_for_delivery.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-accent-cyan font-mono">🎯 DELIVERY TIPS</p>
                    <div className="space-y-1.5">
                      {idealAnswer.tips_for_delivery.map((tip, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-accent-cyan/5 border border-accent-cyan/20 rounded px-3 py-2">
                          <span className="text-accent-cyan">▸</span> {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Why This Is Strong */}
              {idealAnswer.why_this_is_strong && (
                <div className="bg-accent-violet/5 border border-accent-violet/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className="text-accent-violet" />
                    <p className="text-xs uppercase tracking-widest text-accent-violet font-mono">WHY THIS SCORES 9-10/10</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{idealAnswer.why_this_is_strong}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading Ideal Answer */}
        {loadingIdealAnswer && !idealAnswer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="glass-card p-6 text-center border-accent-violet/30 space-y-3"
          >
            <div className="flex justify-center">
              <div className="animate-spin">
                <Brain size={24} className="text-accent-violet" />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Generating AI Ideal Answer...</p>
          </motion.div>
        )}

        {/* Context Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="glass-card p-6 border-white/5 bg-dark-800/50"
          >
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Query Prompt</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{question}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="glass-card p-6 border-white/5 bg-dark-800/50"
          >
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Subject Input Log</h3>
            <p className="text-sm text-slate-400 leading-relaxed h-32 overflow-y-auto pr-2 custom-scrollbar">
              {answer}
            </p>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5"
        >
          <Link to="/practice" className="relative group flex-1 py-4 bg-brand-600 font-bold text-white uppercase tracking-widest text-sm rounded-xl overflow-hidden shadow-[0_0_20px_rgba(79,157,255,0.4)] hover:shadow-[0_0_40px_rgba(79,157,255,0.6)] text-center">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Re-Initialize Session
            </span>
          </Link>
          <Link to="/dashboard" className="glass-card border-white/10 hover:border-white/30 text-white font-mono uppercase tracking-widest text-sm flex-1 py-4 flex items-center justify-center gap-2 transition-all hover:bg-white/5">
            <Activity size={16} /> View Global Telemetry
          </Link>
        </motion.div>

      </div>
    </div>
  )
}
