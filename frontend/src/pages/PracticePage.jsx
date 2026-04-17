import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Type, RefreshCw, Send, ChevronRight, ChevronLeft, Loader,
  FileText, Sparkles, AlertCircle, Clock, RotateCcw, HelpCircle, Activity,
  PlaySquare, Cpu, Radio, Grid, List
} from 'lucide-react'
import CategorySelector from '../components/CategorySelector'
import VoiceRecorder from '../components/VoiceRecorder'
import ResumeUpload from '../components/ResumeUpload'
import QuestionsGallery from '../components/QuestionsGallery'
import CameraMonitor from '../components/CameraMonitor'
import { useAuth } from '../context/AuthContext'
import { generateQuestions, generateQuestionsFromAnalysis, analyzeAnswer, saveSession, generateAllCategoriesQuestions } from '../lib/api'
import { getQuestionsByCategory, DIFFICULTY_COLORS } from '../data/questions'
import { useQuestionGenerator } from '../hooks/useQuestionGenerator'

const MODES = [
  { id: 'speak', icon: Mic, label: 'Voice Link' },
  { id: 'type', icon: Type, label: 'Text Override' },
]

// Animated Waveform Component
const AudioWaveform = ({ isActive, color = "accent-cyan" }) => {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16 pointer-events-none">
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full shadow-[0_0_8px_currentColor] text-${color} bg-current`}
          animate={{ height: isActive ? ['20%', '100%', '20%'] : '10%' }}
          transition={{
            duration: isActive ? 0.4 + Math.random() * 0.4 : 0.5,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Glowing rings behind avatar
const AvatarGlow = ({ speaking }) => (
  <div className="absolute inset-0 pointer-events-none">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: speaking ? [1, 1.2, 1] : 1, opacity: speaking ? 0.5 : 0.2 }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-brand-500/30"
    />
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: speaking ? [1, 1.4, 1] : 1, opacity: speaking ? 0.3 : 0.1 }}
      transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-accent-cyan/20"
    />
  </div>
)

export default function PracticePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [category, setCategory] = useState('Behavioral')
  const [questions, setQuestions] = useState([])
  const [questionIdx, setQuestionIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [mode, setMode] = useState('speak') // Default to speak for futuristic vibe
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [resumeData, setResumeData] = useState(null)
  const [showResume, setShowResume] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [questionsGenerated, setQuestionsGenerated] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [distractions, setDistractions] = useState({ phoneDetections: 0, noPersonDetections: 0 })
  const timerRef = useRef(null)
  const answerRef = useRef(null)

  // Gallery and multi-category question generator
  const questionGenerator = useQuestionGenerator()
  
  // ── Load stored resume from sessionStorage on mount ──────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('mockmate_resume')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setResumeData(parsed)
        // Questions will be loaded by the resumeData+category effect below
      } catch {}
    } else {
      // No resume — load default questions immediately
      setQuestions(getQuestionsByCategory('Behavioral'))
    }
  }, [])

  // ── Reload questions whenever resume OR category changes ──────────────────────
  // This is the CORE fix: both triggers must be declared together
  useEffect(() => {
    loadQuestions(resumeData, category)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, category])

  // ── Generate questions for all 4 categories when resume is loaded ───────────
  useEffect(() => {
    if (resumeData?.parsed && !questionGenerator.hasQuestions) {
      console.log('[PracticePage] Resume loaded — generating questions for all categories')
      questionGenerator.generateForAllCategories(resumeData.parsed, 15).catch(err => {
        console.warn('[PracticePage] Failed to generate all categories:', err)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData])

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  // ── loadQuestions: accepts live resume + category so it's never stale ─────────
  const loadQuestions = async (resume, cat) => {
    setLoading(true)
    setError('')
    setQuestionsGenerated(false)

    try {
      if (resume?.parsed) {
        // ── ALWAYS generate AI questions for the current category ──
        // The old code used _cachedQuestions which was always Behavioral-only.
        // Now we call Gemini fresh for each category using the resume profile.
        console.log(`[PracticePage] Resume detected — generating AI questions for: ${cat}`)
        const data = await generateQuestionsFromAnalysis(resume.parsed, cat, 15)
        if (data.success && data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
          setQuestionsGenerated(true)
          console.log(`[PracticePage] ✅ ${data.questions.length} AI questions ready (${cat})`)
        } else {
          // AI returned nothing — fall back to static bank
          console.warn('[PracticePage] AI returned no questions, using static bank')
          setQuestions(getQuestionsByCategory(cat))
        }
      } else {
        // No resume uploaded — use the curated static question bank
        setQuestions(getQuestionsByCategory(cat))
      }
      setQuestionIdx(0)
      resetAnswer()
    } catch (err) {
      console.error('[PracticePage] Question loading error:', err.message)
      setQuestions(getQuestionsByCategory(cat))
    } finally {
      setLoading(false)
    }
  }

  const resetAnswer = () => {
    setAnswer('')
    setTimer(0)
    setTimerRunning(false)
    setError('')
  }

  // ── Handle selecting a question from the gallery ─────────────────────────────
  const handleSelectFromGallery = (question, selectedCategory) => {
    console.log('[PracticePage] Question selected from gallery:', question)
    setCategory(selectedCategory)
    // Close gallery and load the question
    setShowGallery(false)
    setQuestions([question])
    setQuestionIdx(0)
    resetAnswer()
  }

  // ── Regenerate questions for current category ────────────────────────────────
  const handleRegenerate = async () => {
    if (!resumeData?.parsed) return
    console.log('[PracticePage] Regenerating questions for all categories...')
    await questionGenerator.generateForAllCategories(resumeData.parsed, 15)
  }

  const currentQuestion = questions[questionIdx]

  const handleAnswerChange = (val) => {
    setAnswer(val)
    if (!timerRunning && val.length > 0) setTimerRunning(true)
  }

  const handleAnalyze = async () => {
    if (!answer.trim() || answer.trim().length < 20) {
      setError('System requires more data (at least 20 characters).')
      return
    }
    setAnalyzing(true)
    setError('')
    setTimerRunning(false)
    try {
      const data = await analyzeAnswer({
        question: currentQuestion.question,
        answer: answer.trim(),
        category,
        resumeContext: resumeData?.parsed
      })
    if (data.success) {
        // Save to sessionStorage so Dashboard can show it even without backend
        try {
          sessionStorage.setItem('mockmate_last_analysis', JSON.stringify({ ...data.analysis, category }))
        } catch {}
        try {
          await saveSession({
            userId: user?.id,
            question: currentQuestion.question,
            category,
            answer: answer.trim(),
            analysis: data.analysis,
            // Flatten for localStorage history display
            overallScore: data.analysis.overallScore,
            clarityScore: data.analysis.clarityScore,
            structureScore: data.analysis.structureScore,
            confidenceScore: data.analysis.confidenceScore,
            relevanceScore: data.analysis.relevanceScore,
            englishScore: data.analysis.englishScore,
            fluencyScore: data.analysis.fluencyScore,
            verdict: data.analysis.verdict,
            shortSummary: data.analysis.shortSummary || data.analysis.feedback_summary || '',
            strengths: data.analysis.strengths || [],
            improvements: data.analysis.improvements || [],
            distractions: distractions
          })
        } catch {}
        
        const finalAnalysis = { ...data.analysis, distractions }
        navigate('/results', { state: { analysis: finalAnalysis, question: currentQuestion.question, answer: answer.trim(), category } })
      }
    } catch (err) {
      setError(err.message || 'Analysis link failed. Check uplink.')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const nextQ = () => {
    setQuestionIdx(i => (i + 1) % questions.length)
    resetAnswer()
  }
  const prevQ = () => {
    setQuestionIdx(i => (i - 1 + questions.length) % questions.length)
    resetAnswer()
  }

  const isSpeaking = mode === 'speak' && timerRunning && answer.length > 0
  const aiSpeaking = loading || analyzing || (!timerRunning && answer.length === 0)

  return (
    <div className="min-h-screen pt-24 pb-16 bg-dark-900 overflow-hidden relative selection:bg-brand-500/30 font-sans">
      
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 h-full flex flex-col lg:flex-row gap-8 items-stretch pt-4">
        
        {/* LEFT COLUMN: Controls & Context */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-[350px] flex flex-col gap-6"
        >
          {/* Status Header */}
          <div className="glass-card p-6 border-brand-500/20 shadow-glow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-accent-violet to-accent-cyan" />
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-2">
                <Radio size={18} className="text-brand-400 animate-pulse" />
                Terminal
              </h1>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green"></span>
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Active Session Link</p>
          </div>

          {/* Configuration Panel */}
          <div className="glass-card p-6 flex flex-col gap-5 relative border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-brand-300 uppercase tracking-widest flex items-center gap-2">
                <Cpu size={14} /> Knowledge Module
              </span>
            </div>
            
            <div className="mb-2">
              <CameraMonitor onDistractionUpdate={setDistractions} />
            </div>
            
            <div>
              <CategorySelector selected={category} onChange={(c) => { setCategory(c); }} />
            </div>

            <div className="border-t border-white/5 pt-4">
              <button
                onClick={() => setShowResume(!showResume)}
                className={`w-full flex justify-between items-center text-sm px-4 py-3 rounded-xl border transition-all duration-300 shadow-sm
                  ${resumeData ? 'border-accent-green/30 bg-accent-green/10 text-accent-green shadow-[0_0_15px_rgba(52,211,153,0.15)]' : 'border-white/[0.08] bg-dark-600/40 text-slate-400 hover:text-white hover:border-white/20'}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <FileText size={15} /> {resumeData ? 'Context: Active' : 'Load Resume Matrix'}
                </span>
                {resumeData && <Sparkles size={14} className="animate-pulse" />}
              </button>
            </div>

            {/* Gallery Toggle Button */}
            {questionGenerator.hasQuestions && (
              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={() => setShowGallery(!showGallery)}
                  className={`w-full flex justify-between items-center text-sm px-4 py-3 rounded-xl border transition-all duration-300 shadow-sm
                    ${showGallery ? 'border-accent-violet/30 bg-accent-violet/10 text-accent-violet shadow-[0_0_15px_rgba(147,51,234,0.15)]' : 'border-brand-500/30 bg-brand-500/10 text-brand-300 hover:text-white hover:border-brand-500/50'}`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {showGallery ? <List size={15} /> : <Grid size={15} />}
                    {showGallery ? 'Practice Mode' : 'View Gallery'}
                  </span>
                  <span className="text-xs bg-black/40 px-2 py-1 rounded">{questionGenerator.getTotalCount()} questions</span>
                </button>
              </div>
            )}
          </div>

          {/* Resume Upload Dropdown */}
          <AnimatePresence>
            {showResume && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card overflow-hidden border-accent-cyan/20 box-shadow-glow-cyan"
              >
                <div className="p-5">
                  <p className="text-xs font-mono text-accent-cyan mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Activity size={14} /> Inject Context Data
                  </p>
                  <ResumeUpload
                    onResumeData={(d) => {
                      if (d) {
                        sessionStorage.setItem('mockmate_resume', JSON.stringify(d))
                        setResumeData(d)
                        setShowResume(false)
                        // Immediately generate AI questions for the current category
                        // using the fresh resume data (don't wait for state to settle)
                        loadQuestions(d, category)
                      } else {
                        setResumeData(null)
                        sessionStorage.removeItem('mockmate_resume')
                        loadQuestions(null, category)
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pro Tips Panel */}
          <div className="glass-card p-5 mt-auto border-white/5 bg-dark-800/80">
            <p className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-wider">System Directives</p>
            <div className="flex flex-col gap-2">
              {['Format: Situation, Task, Action, Result', 'Data: Quantify impact', 'Time: 90-150s target window'].map(tip => (
                <div key={tip} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-brand-500 text-[10px] mt-0.5">▶</span> {tip}
                </div>
              ))}
            </div>
          </div>
        </motion.div>


        {/* RIGHT COLUMN: AI Interface & Question/Answer OR Gallery */}
        {showGallery && questionGenerator.hasQuestions ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col"
          >
            <QuestionsGallery 
              allQuestions={questionGenerator.allQuestions}
              onSelectQuestion={handleSelectFromGallery}
              loading={questionGenerator.loading}
              onRegenerate={handleRegenerate}
            />
          </motion.div>
        ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex flex-col gap-6"
        >
          {/* Main Visualizer (The AI) */}
          <div className="glass-card p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden group border-brand-500/20 shadow-glow-sm min-h-[300px]">
            {/* Ambient Background animations in panel */}
            <div className="absolute inset-0 bg-hero-glow opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />
            
            {/* The Avatar / Orb */}
            <div className="relative z-10 w-32 h-32 flex items-center justify-center mb-8">
              <AvatarGlow speaking={aiSpeaking} />
              
              <motion.div 
                animate={{ 
                  boxShadow: aiSpeaking 
                    ? ['0 0 20px rgba(79,157,255,0.8)', '0 0 50px rgba(138,92,255,1)', '0 0 20px rgba(79,157,255,0.8)'] 
                    : ['0 0 10px rgba(79,157,255,0.4)', '0 0 20px rgba(138,92,255,0.6)', '0 0 10px rgba(79,157,255,0.4)']
                }}
                transition={{ duration: aiSpeaking ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-dark-900 border border-brand-400/50 flex items-center justify-center relative shadow-glow z-10"
              >
                {analyzing ? (
                  <Loader size={32} className="text-brand-400 animate-spin" />
                ) : (
                  <Mic size={32} className={`transition-colors duration-500 ${isSpeaking ? 'text-accent-cyan drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-brand-400'}`} />
                )}
              </motion.div>
            </div>

            {/* Simulated Waveform that reacts to state */}
            <div className="w-full max-w-md mx-auto absolute bottom-8 left-1/2 -translate-x-1/2">
              <AudioWaveform isActive={isSpeaking || aiSpeaking} color={analyzing ? "accent-violet" : isSpeaking ? "accent-cyan" : "brand-500"} />
            </div>

            {/* Top hud elements on Avatar panel */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-brand-300/50 uppercase tracking-widest hidden sm:block">STATUS: {analyzing ? 'PROCESSING' : isSpeaking ? 'RECEIVING' : 'STANDBY'}</div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {timer > 0 && (
                <div className="font-mono text-sm font-bold text-accent-cyan drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] bg-dark-900/50 px-2 py-1 rounded">
                  {formatTime(timer)}
                </div>
              )}
            </div>
          </div>

          {/* The Prompt & Console */}
          <div className="glass-card p-0 overflow-hidden border-white/10 flex flex-col min-h-[350px]">
            {/* Question Header Area */}
            <div className="bg-dark-800/80 p-6 border-b border-white/5 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-brand-500/20 text-brand-300 px-3 py-1 rounded text-sm font-mono font-bold border border-brand-500/30 shadow-[0_0_10px_rgba(79,157,255,0.2)]">
                    Q-{String(questionIdx + 1).padStart(2, '0')}
                  </span>
                  {currentQuestion?.difficulty && (
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[currentQuestion.difficulty]}`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                  {questionsGenerated ? (
                    <span className="text-[10px] font-mono text-accent-green px-2 py-0.5 border border-accent-green/40 rounded flex items-center gap-1 bg-accent-green/10 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                      <Sparkles size={10} /> AI PERSONALIZED
                    </span>
                  ) : resumeData ? (
                    <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 border border-white/10 rounded">
                      STATIC
                    </span>
                  ) : null}
                </div>
                
                {/* Navigation Controls */}
                <div className="flex items-center gap-1">
                  <button onClick={prevQ} disabled={loading} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-30"><ChevronLeft size={18} /></button>
                  <button onClick={() => { setQuestionIdx(Math.floor(Math.random() * questions.length)); resetAnswer() }} disabled={loading} className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors disabled:opacity-30" title="Randomize"><RefreshCw size={16} /></button>
                  <button onClick={nextQ} disabled={loading} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {resumeData && (
                    <p className="text-xs font-mono text-accent-green flex items-center gap-2 animate-pulse">
                      <Sparkles size={12} /> Generating personalized questions from your resume...
                    </p>
                  )}
                  <div className="h-6 bg-dark-500/50 rounded w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                  </div>
                  <div className="h-6 bg-dark-500/50 rounded w-3/4 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {currentQuestion?.question}
                  </h3>
                  {currentQuestion?.hint && (
                    <p className="mt-3 text-xs text-slate-500 border-l-2 border-brand-500/30 pl-3 leading-relaxed">
                      💡 {currentQuestion.hint}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Interaction Area */}
            <div className="p-6 flex-1 flex flex-col relative bg-dark-900/40">
              {/* Mode Toggles */}
              <div className="absolute top-4 right-6 flex items-center gap-1 bg-dark-800 border border-white/5 rounded-lg p-1 z-10 w-max">
                {MODES.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => { setMode(id); setAnswer('') }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all uppercase tracking-wider
                      ${mode === id ? 'bg-brand-600/30 text-brand-300 border border-brand-500/50 shadow-[0_0_10px_rgba(79,157,255,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 mt-8 mb-4 relative">
                {mode === 'type' ? (
                  <textarea
                    ref={answerRef}
                    value={answer}
                    onChange={e => handleAnswerChange(e.target.value)}
                    placeholder="Initialize text input sequence. Awaiting data..."
                    className="w-full h-full min-h-[140px] bg-transparent border-0 text-slate-300 placeholder-slate-600 font-mono text-sm leading-relaxed focus:outline-none focus:ring-0 resize-none selection:bg-brand-500/40"
                    disabled={analyzing}
                  />
                ) : (
                  <div className="flex flex-col h-full justify-center">
                    <div className="mb-4">
                      <VoiceRecorder
                        onTranscript={(t) => handleAnswerChange(t)}
                        onError={(e) => setError(e)}
                      />
                    </div>
                    {answer && (
                      <div className="relative mt-4">
                        <span className="absolute -top-3 left-4 bg-dark-900 px-2 text-[10px] font-mono text-brand-400 uppercase tracking-widest border border-brand-500/20 rounded">Live Readout</span>
                        <textarea
                          value={answer}
                          onChange={e => handleAnswerChange(e.target.value)}
                          className="w-full min-h-[100px] bg-dark-800/50 border border-brand-500/20 rounded-xl p-4 pt-5 text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-brand-400 resize-none"
                          placeholder="Voice transcript routing..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Output */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-lg shadow-[0_0_15px_rgba(248,113,113,0.15)]">
                      <AlertCircle size={14} className="text-rose-400 shrink-0" />
                      <p className="text-sm font-mono text-rose-400">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Vol: {answer ? answer.split(/\s+/).filter(Boolean).length : 0} WORDS
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={resetAnswer}
                    disabled={!answer || analyzing}
                    className="p-3 bg-dark-700/50 border border-white/10 hover:border-white/30 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-40"
                    title="Abort Input"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={!answer.trim() || analyzing}
                    style={{ '--btn-shimmer': '#4F9DFF' }}
                    className="relative group px-8 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-600 disabled:border-white/10 font-bold text-white rounded-xl overflow-hidden shadow-[0_0_20px_rgba(79,157,255,0.4)] disabled:shadow-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-brand-400 flex items-center justify-center gap-2"
                  >
                    {!analyzing && <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />}
                    {analyzing ? (
                      <><Loader size={18} className="animate-spin text-accent-cyan" /> <span className="font-mono tracking-widest uppercase">Processing</span></>
                    ) : (
                      <><Send size={18} className="drop-shadow-md" /> <span className="font-mono tracking-widest uppercase">Execute</span></>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  )
}
